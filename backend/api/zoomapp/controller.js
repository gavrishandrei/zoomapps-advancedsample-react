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

  async getCrmInstalled(req, res) {
    const zoomAccountId = req.query.accountId
    let isCrmSetup = false;
    try {
      const responseData = await store.getHubSpotData(zoomAccountId)
      console.log('!!!! RESP DATA:', responseData)
      if (responseData) {
        isCrmSetup = true
      }
    } catch(error) {
      isCrmSetup = false
    }
    return res.json({ result: isCrmSetup })
  },

  async getCrmContactsByPhone(req, res) {
    const zoomAccountId = req.body.zoomAccountId
    const phoneNumber = req.body.phoneNumber
    try {
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      console.log('!!!! accessToken:', accessToken)
      const getContactsResponse = await hubspotApi.getContactsByPhone(accessToken, phoneNumber)
      return res.json(getContactsResponse.data)
    } catch(error) {
      console.log('!!!!! CRM Error:', error)
    }
  },

  async createCrmContact(req, res) {
    const zoomAccountId = req.body.zoomAccountId
    const contactProperties = req.body.properties
    try {
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      const createContactResponse = await hubspotApi.createContact(accessToken, contactProperties)
      console.log('!!! createContactResponse:', createContactResponse)
      if (createContactResponse.status === 200 || createContactResponse.status === 201) {
        res.json({type: 'success', message: 'Contact successfully created', data: createContactResponse.data})
      } else {
        res.json({type: 'danger', message: createContactResponse.statusText, data: ''})
      }
    } catch(error) {
      res.json({type: 'danger', message: error, data: ''})
    }
    
  },

  async createCrmTicket(req, res) {
    let relatedToAssociationStatus = 200;
    const zoomAccountId = req.body.zoomAccountId
    const relatedToEntity = req.body.relatedToEntity
    const relatedToRecordId = req.body.relatedToRecordId
    const ticketProperties = req.body.properties
    try {
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      const getTicketResponse = await hubspotApi.createTicket(accessToken, ticketProperties)

      const createDefaultAssociation = {
        fromObjectType: 'ticket',
        fromObjectId: getTicketResponse.data.id,
        toObjectType: 'contact',
        toObjectId: ticketProperties.contactId
      }
      const associationResp = await hubspotApi.createDefaultAssociation(accessToken, createDefaultAssociation)

      if (relatedToEntity != null && relatedToRecordId != null) {
        const createDefaultRelatedToAssociation = {
          fromObjectType: 'ticket',
          fromObjectId: getTicketResponse.data.id,
          toObjectType: relatedToEntity,
          toObjectId: relatedToRecordId
        }
        const relatedToAssociationResp = await hubspotApi.createDefaultAssociation(accessToken, createDefaultRelatedToAssociation)
        relatedToAssociationStatus = relatedToAssociationResp.status
      }
      if (associationResp.status === 200 && getTicketResponse.status === 201 && relatedToAssociationStatus == 200) {
        res.json({type: 'success', message: 'Ticket successfully created', data: getTicketResponse.data})
      } else {
        res.json({type: 'danger', message: getTicketResponse.statusText, data: ''})
      }
    } catch(error) {
      res.json({type: 'danger', message: error, data: ''})
    }
    
  },

  async updateCrmTicket(req, res) {
    const zoomAccountId = req.body.zoomAccountId
    const ticketProperties = req.body.properties
    try {
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      const updateTicketResponse = await hubspotApi.updateTicket(accessToken, ticketProperties)
      console.log('!updateTicketResponse:', updateTicketResponse)
      if (updateTicketResponse.status === 200) {
        res.json({type: 'success', message: 'Ticket successfully updated'})
      } else {
        res.json({type: 'danger', message: updateTicketResponse.statusText})
      }
    } catch(error) {
      res.json({type: 'danger', message: error})
    }
    
  },

  async getCrmTickets(req, res) {
    const zoomAccountId = req.body.zoomAccountId
    const ticketProperties = req.body.properties
    try {
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      const getTicketResponse = await hubspotApi.getTicketsList(accessToken, ticketProperties)
      res.json(getTicketResponse.data)
    } catch(error) {
      console.log('!!!!! CRM Error:', error)
    }
    
  },

  async searchRelatedToRecords(req, res) {
    const zoomAccountId = req.body.zoomAccountId
    const searchProperties = req.body
    try {
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      const searchResponse = await hubspotApi.searchRelatedToRecords(accessToken, searchProperties)
      res.json(searchResponse.data)
    } catch(error) {
      console.log('!!!!! CRM Error:', error)
    }
    
  },

  async getCrmAccountInfo(req, res) {
    const zoomAccountId = req.query.zoomAccountId
    try {
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      const getAccountInfoResponse = await hubspotApi.getAccountInfo(accessToken)
      res.json(getAccountInfoResponse.data)
    } catch(error) {
      console.log('!!!!! CRM Error:', error)
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
    const engagementId = req.query.engagementId;
  
    try {
      const accessTokenResponse = await zoomApi.getBackendAccessToken()
      
      const engagementResponse = await zoomApi.getEngInfo(accessTokenResponse.data.access_token, engagementId)
      console.log('!!! engagementResponse:', engagementResponse)
      return res.json(engagementResponse.data)
    } catch (error) {
      console.log('ZOOM API ERROR:', error)
      return next(error)
    }
  },

  async saveEngagementNotes(req, res) {
    const defaultAssociationTypeId = 228
    const defaultAssociationCategory = 'HUBSPOT_DEFINED'
    const engagementId = req.body.engagementId
    const zoomAccountId = req.body.zoomAccountId
    const crmTicketId = req.body.crmTicketId
    try {
      const accessTokenResponse = await zoomApi.getBackendAccessToken()
      const notesResponse = await zoomApi.getEngInfo(accessTokenResponse.data.access_token, engagementId)
      console.log('!!! notesResponse:', notesResponse.data.notes)
      const noteProperties = notesResponse.data.notes.map(noteItem => {
        return {
          associations: [
            {
              types: [
                {
                  associationCategory: defaultAssociationCategory,
                  associationTypeId: defaultAssociationTypeId
                }
              ],
              to: {
                id: crmTicketId
              }
            }
          ],
          properties: {
            hs_note_body: noteItem.note 
          }
        }
      })
      const crmNoteBody = {inputs: noteProperties}
      const accessToken = await hubspotApi.getAccessTokenByRefresh(zoomAccountId)
      const getTicketResponse = await hubspotApi.createNotes(accessToken, crmNoteBody)
      res.json(getTicketResponse.data)
      return res.json(notesResponse.data)
    } catch (error) {
      console.log('ZOOM API ERROR:', error)
    }
  },

  async storeEngagementDetails(req, res) {
    const engagementId = req.body.engagementId
    const incomingNumber = req.body.incomingNumber
    console.log('!!! engagementId:', engagementId);
    console.log('!!! incomingNumber:', incomingNumber);
    try {
      await store.upserEngagementDetails(engagementId, incomingNumber);
    } catch (error) {
      res.status(400).send({message: error})
    }
    res.status(200).send({message: "Updated post successfuly"})
  },

  async getEngagementDetails(req, res) {
    const engagementId = req.query.engagementId
    try {
      const responseData = await store.getEngagementDetails(engagementId)
      return res.json(responseData)
    } catch(error) {
      console.log('!!! Error:', error)
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
    const zoomAccountId = req.query.accountId
    console.log('zoomAccountId:', req.query);
    const hubspotScopes = 'crm.objects.companies.read, crm.objects.contacts.read, crm.objects.contacts.write, crm.objects.deals.read, oauth, tickets';
    const SCOPES = (hubspotScopes.split(/ |, ?|%20/)).join(' ')
    const redirectUrl = `${process.env.PUBLIC_URL}/api/zoomapp/hubspotOauthCallback?accountId=${zoomAccountId}`
    const authUrl =
    'https://app.hubspot.com/oauth/authorize' +
    `?client_id=${encodeURIComponent(process.env.HUBSPOT_APP_CLIENT_ID)}` + // app's client ID
    `&scope=${encodeURIComponent(SCOPES)}` + // scopes being requested by the app
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` // where to send the user after the consent page

    console.log('=== Initiating OAuth 2.0 flow with HubSpot ===')
    console.log('')
    console.log("===> Step 1: Redirecting user to your app's OAuth URL")
    res.redirect(authUrl)
    console.log('===> Step 2: User is being prompted for consent by HubSpot')
  },

  async hubspotOauthCallback(req, res) {
    console.log('===> Step 3: Handling the request sent by the server', req.query);

    // Received a user authorization code, so now combine that with the other
    // required values and exchange both for an access token and a refresh token
    if (req.query.code) {
      console.log('       > Received an authorization token');
      const redirectUrl = `${process.env.PUBLIC_URL}/api/zoomapp/hubspotOauthCallback?accountId=${req.query.accountId}`
      const authCodeProof = {
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_APP_CLIENT_ID,
        client_secret: process.env.HUBSPOT_APP_CLIENT_SECRET,
        redirect_uri: redirectUrl,
        code: req.query.code
      };

      // Step 4
      // Exchange the authorization code for an access token and refresh token
      // console.log('===> Step 4: Exchanging authorization code for an access token and refresh token');
      const token = await hubspotApi.exchangeHubSpotTokens(authCodeProof);
      console.log('HUBSPOT DATA:', token.data);
      console.log('HUBSPOT TOKEN OBJECT:', token.data.access_token);
      console.log('HUBSPOT REFRESH TOKEN OBJECT:', token.data.refresh_token);
      await store.upsertHubSpotAuth(req.query.accountId, token.data.access_token, token.data.refresh_token);

      // if (token.message) {
      //   console.log(`${token.message}`);
      // }

      // Once the tokens have been retrieved, use them to make a query
      // to the HubSpot API
      //res.redirect(`/api/zoomapp/proxy`);
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
