/* eslint-disable prettier/prettier */
const { createProxyMiddleware } = require('http-proxy-middleware')
const zoomApi = require('../../util/zoom-api')
const hubspotApi = require('../../util/hubspot-api')
const zoomHelpers = require('../../util/zoom-helpers')
const store = require('../../util/store')

module.exports = {
  // In-client OAuth 1/2
  async inClientAuthorize(req, res, next) {
    console.log(
      'IN-CLIENT AUTHORIZE HANDLER ==========================================================',
      '\n'
    )

    try {
      console.log('1. Generate code verifier, code challenge and state')
      const codeVerifier = zoomHelpers.generateCodeVerifier()
      const codeChallenge = codeVerifier
      const zoomInClientState = zoomHelpers.generateState()

      console.log('2. Save code verifier and state to session')
      req.session.codeVerifier = codeVerifier
      req.session.state = zoomInClientState

      console.log('3. Return code challenge and state to frontend')
      return res.json({
        codeChallenge,
        state: zoomInClientState,
      })
    } catch (error) {
      return next(error)
    }
  },

  // In-Client OAuth 2/2
  async inClientOnAuthorized(req, res, next) {
    console.log(
      'IN-CLIENT ON AUTHORIZED TOKEN HANDLER ==========================================================',
      '\n'
    )

    const zoomAuthorizationCode = req.body.code
    const href = req.body.href
    const state = decodeURIComponent(req.body.state)
    const zoomInClientState = req.session.state
    const codeVerifier = req.session.codeVerifier

    console.log(
      '1. Verify code (from onAuthorized event in client) exists and state matches'
    )

    try {
      if (!zoomAuthorizationCode || state !== zoomInClientState) {
        throw new Error('State mismatch')
      }

      console.log('2. Getting Zoom access token and user', '\n')
      const tokenResponse = await zoomApi.getZoomAccessToken(
        zoomAuthorizationCode,
        href,
        codeVerifier
      )

      const zoomAccessToken = tokenResponse.data.access_token
      console.log(
        '2a. Use code to get Zoom access token - response data: ',
        tokenResponse.data,
        '\n'
      )

      console.log('2b. Get Zoom user from Zoom API with access token')
      const userResponse = await zoomApi.getZoomUser(zoomAccessToken)
      const zoomUserId = userResponse.data.id
      req.session.user = zoomUserId

      console.log(
        '2c. Use access token to get Zoom user - response data: ',
        userResponse.data,
        '\n'
      )

      console.log(
        '2d. Save the tokens in the store so we can look them up when the Zoom App is opened'
      )

      // 2c. Save the tokens in the store so we can look them up when the Zoom App is opened:
      // When the home url for the app is requested on app open in the Zoom client,
      // the user id (uid field) is in the decrypted x-zoom-app-context header of the GET request
      await store.upsertUser(
        zoomUserId,
        tokenResponse.data.access_token,
        tokenResponse.data.refresh_token,
        Date.now() + tokenResponse.data.expires_in * 1000
      )

      return res.json({ result: 'Success' })
    } catch (error) {
      return next(error)
    }
  },

  async getEngagementInfo(req, res, next) {
    console.log(
      'IN-CLIENT ON AUTHORIZED TOKEN HANDLER ==========================================================',
      '\n'
    )
    console.log('REQUEST PARAMS:', req.query);
    console.log('SESSION:', req.session);
    console.log('req.body.href:', req.body.href);
    //const zoomAuthorizationCode = req.body.code
    const currentUser = req.session.user;
    const engagementId = req.query.engagementId;
    
    // // not enough permission for contact center
    // const appUser = await store.getUser(currentUser)
    // console.log('!!!! appUser:', appUser);
    // const { expired_at = 0, refreshToken = null } = appUser

    // if (!refreshToken) {
    //   console.log('Error: No refresh token saved for this user');
    // }
    // let accessToken = appUser.accessToken
    // if (expired_at && Date.now() >= expired_at - 5000) {
    //   try {
    //     console.log('2. User access token expired')
    //     console.log('2a. Refresh Zoom REST API access token')

    //     const tokenResponse = await zoomApi.refreshZoomAccessToken(
    //       appUser.refreshToken
    //     )
    //     accessToken = tokenResponse.data.access_token
    //     console.log('2b. Save refreshed user token', accessToken)
    //     await store.updateUser(currentUser, {
    //       accessToken: tokenResponse.data.access_token,
    //       refreshToken: tokenResponse.data.refresh_token,
    //       expired_at: Date.now() + tokenResponse.data.expires_in * 1000,
    //     })

    //   } catch (error) {
    //     console.log('Error refreshing user token.', error)
    //   }
    // }
    try {
      const accessTokenResponse = await zoomApi.getBackendAccessToken()
      
      const engagementResponse = await zoomApi.getEngInfo(accessTokenResponse.data.access_token, engagementId)
      console.log('!!! engagementResponse:', engagementResponse)
      return res.json(engagementResponse.data)
    } catch (error) {
      return next(error)
    }
  },

  // INSTALL HANDLER ==========================================================
  // Main entry point for the web-based app install and Zoom user authorize flow
  // Kicks off the OAuth 2.0 based exchange with zoom.us
  install(req, res) {
    console.log(
      'INSTALL HANDLER ==========================================================',
      '\n'
    )
    // 1. Generate and save a random state value for this browser session
    req.session.state = zoomHelpers.generateState()
    console.log(
      '1. Begin add app - generated state for zoom auth and saved:',
      req.session.state,
      '\n'
    )

    // 2. Create a redirect url, eg: https://zoom.us/oauth/authorize?client_id=XYZ&response_type=code&redirect_uri=https%3A%2F%2Fmydomain.com%2Fapi%2Fzoomapp%2Fauth&state=abc...
    // 2a. Set domain (with protocol prefix)
    const domain = process.env.ZOOM_HOST // https://zoom.us

    // 2b. Set path
    const path = 'oauth/authorize'

    // 2c. Create the request params
    const params = {
      redirect_uri: process.env.ZOOM_APP_REDIRECT_URI,
      response_type: 'code',
      client_id: process.env.ZOOM_APP_CLIENT_ID,
      state: req.session.state, // save state on this cookie-based session, to verify on return
    }

    const authRequestParams = zoomHelpers.createRequestParamString(params)

    // 2d. Concatenate
    const redirectUrl = domain + '/' + path + '?' + authRequestParams
    console.log('2. Redirect url to authenticate to Zoom:', redirectUrl, '\n')

    // 3. Redirect to url - the user can authenticate and authorize the app scopes securely on zoom.us
    console.log('3. Redirecting to redirect url', '\n')
    res.redirect(redirectUrl)
  },

  installHubSpot(req, res) {
    const sessionUser = req.session.user
    const hubspotScopes = ['crm.objects.contacts.read'];
    const redirectUrl = `${process.env.PUBLIC_URL}/api/zoomapp/hubspotOauthCallback?zoomUser=${sessionUser}`
    const authUrl =
    'https://app.hubspot.com/oauth/authorize' +
    `?client_id=${encodeURIComponent(process.env.HUBSPOT_APP_CLIENT_ID)}` + // app's client ID
    `&scope=${encodeURIComponent(hubspotScopes)}` + // scopes being requested by the app
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` // where to send the user after the consent page

    console.log('=== Initiating OAuth 2.0 flow with HubSpot ===')
    console.log('')
    console.log("===> Step 1: Redirecting user to your app's OAuth URL")
    res.redirect(authUrl)
    console.log('===> Step 2: User is being prompted for consent by HubSpot')
  },

  async hubspotOauthCallback(req, res) {
    console.log('===> Step 3: Handling the request sent by the server');

    // Received a user authorization code, so now combine that with the other
    // required values and exchange both for an access token and a refresh token
    if (req.query.code) {
      console.log('       > Received an authorization token');
      const redirectUrl = `${process.env.PUBLIC_URL}/api/zoomapp/hupspotOauthCallback`
      const authCodeProof = {
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_APP_CLIENT_ID,
        client_secret: process.env.HUBSPOT_APP_CLIENT_ID,
        redirect_uri: redirectUrl,
        code: req.query.code
      };

      // Step 4
      // Exchange the authorization code for an access token and refresh token
      console.log('===> Step 4: Exchanging authorization code for an access token and refresh token');
      const token = await hubspotApi.exchangeForTokens(authCodeProof);
      console.log('ZOOM USER ID:', req.query.zoomUser);
      console.log('HUBSPOT TOKEN OBJECT:', token);
      // await store.updateUser(sessionUser, {
      //   thirdPartyAccessToken: auth0AccessToken.access_token,
      // })

      // if (token.message) {
      //   console.log(`${token.message}`);
      // }

      // Once the tokens have been retrieved, use them to make a query
      // to the HubSpot API
      //res.redirect(`/`);
    }
  },

  // ZOOM OAUTH REDIRECT HANDLER ==============================================
  // This route is called after the user has authorized the Zoom App on the
  async auth(req, res, next) {
    console.log(
      'ZOOM OAUTH REDIRECT HANDLER  ==============================================',
      '\n'
    )
    console.log(
      '1. Handling redirect from zoom.us with code and state following authentication to Zoom',
      '\n'
    )
    // 1. Validate code and state
    const zoomAuthorizationCode = req.query.code
    const zoomAuthorizationState = req.query.state
    const zoomState = req.session.state

    // For security purposes, delete the browser session
    req.session.destroy()

    // 1a. Check for auth code as parameter on response from zoom.us
    if (!zoomAuthorizationCode) {
      const error = new Error('No authorization code was provided')
      error.status = 400
      return next(error)
    }

    console.log('1a. code param exists:', req.query.code, '\n')

    // 1b. Validate the state parameter is the same as the one we sent
    if (!zoomAuthorizationState || zoomAuthorizationState !== zoomState) {
      const error = new Error('Invalid state parameter')
      error.status = 400
      return next(error)
    }

    console.log(
      '1b. state param is correct/matches ours:',
      req.query.state,
      '\n'
    )

    try {
      console.log('2. Getting Zoom access token and user', '\n')
      // 2. Get and remember Zoom access token and Zoom user
      // 2a. Exchange Zoom authorization code for tokens
      const tokenResponse = await zoomApi.getZoomAccessToken(
        zoomAuthorizationCode
      )
      const zoomAccessToken = tokenResponse.data.access_token
      console.log(
        '2a. Use code to get Zoom access token - response data: ',
        tokenResponse.data,
        '\n'
      )
      // other fields on token response:
      // tokenResponse.data.refresh_token
      // tokenResponse.data.expires_in

      // 2b. Get Zoom user info from Zoom API
      console.log('!!! zoomAccessToken: ', zoomAccessToken);
      const userResponse = await zoomApi.getZoomUser(zoomAccessToken)
      const zoomUserId = userResponse.data.id

      console.log(
        '2b. Use access token to get Zoom user - response data: ',
        userResponse.data,
        '\n'
      )

      console.log(
        '2c. Save the tokens in the store so we can look them up when the Zoom App is opened'
      )

      // 2c. Save the tokens in the store so we can look them up when the Zoom App is opened:
      // When the home url for the app is requested on app open in the Zoom client,
      // the user id (uid field) is in the decrypted x-zoom-app-context header of the GET request
      await store.upsertUser(
        zoomUserId,
        tokenResponse.data.access_token,
        tokenResponse.data.refresh_token,
        Date.now() + tokenResponse.data.expires_in * 1000
      )

      // 3. Get deeplink from Zoom API
      const deepLinkResponse = await zoomApi.getDeeplink(zoomAccessToken)
      const deeplink = deepLinkResponse.data.deeplink

      console.log(
        '3. Generated deeplink from Zoom API using access token: ',
        deeplink,
        '\n'
      )
      console.log('4. Redirecting to Zoom client via deeplink . . .', '\n')

      // 4. Redirect to deep link to return user to the Zoom client
      res.redirect(deeplink)
    } catch (error) {
      return next(error)
    }
  },

  // ZOOM APP HOME URL HANDLER ==================================================
  // This route is called when the app opens
  home(req, res, next) {
    console.log(
      'ZOOM APP HOME URL HANDLER ==================================================',
      '\n'
    )
    try {
      // 1. Decrypt the Zoom App context header
      if (!req.headers['x-zoom-app-context']) {
        throw new Error('x-zoom-app-context header is required')
      }

      const decryptedAppContext = zoomHelpers.decryptZoomAppContext(
        req.headers['x-zoom-app-context'],
        process.env.ZOOM_APP_CLIENT_SECRET
      )

      // 2. Verify App Context has not expired
      if (!decryptedAppContext.exp || decryptedAppContext.exp < Date.now()) {
        throw new Error("x-zoom-app-context header is expired")
      }

      console.log('1. Decrypted Zoom App Context:', decryptedAppContext, '\n')
      console.log('2. Verifying Zoom App Context is not expired: ', new Date(decryptedAppContext.exp).toString(), '\n')
      console.log('3. Persisting user id and meetingUUIDa', '\n')

      // 3. Persist user id and meetingUUID
      req.session.user = decryptedAppContext.uid
      req.session.meetingUUID = decryptedAppContext.mid
    } catch (error) {
      return next(error)
    }

    // 4. Redirect to frontend
    console.log('4. Redirect to frontend', '\n')
    res.redirect('/api/zoomapp/proxy')
  },

  // FRONTEND PROXY ===========================================================
  // proxy(req, res) {
  //   return createProxyMiddleware({
  //     target: process.env.ZOOM_APP_CLIENT_URL,
  //     changeOrigin: true,
  //     ws: false,
  //   })
  // }
  proxy: createProxyMiddleware({
    target: process.env.ZOOM_APP_CLIENT_URL,
    changeOrigin: true,
    ws: false
  }),
}
