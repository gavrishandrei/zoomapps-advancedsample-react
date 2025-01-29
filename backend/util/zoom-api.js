/* eslint-disable prettier/prettier */
const axios = require('axios')
const zoomHelpers = require('./zoom-helpers')

const getZoomAccessToken = async (
  zoomAuthorizationCode,
  redirect_uri = process.env.ZOOM_APP_REDIRECT_URI,
  pkceVerifier = undefined
) => {
  const params = {
    grant_type: 'authorization_code',
    code: zoomAuthorizationCode,
    redirect_uri,
  }

  if (typeof pkceVerifier === 'string') {
    params['code_verifier'] = pkceVerifier
  }

  console.log('!!!!! params', params)

  const tokenRequestParamString = zoomHelpers.createRequestParamString(params)

  return await axios({
    url: `${process.env.ZOOM_HOST}/oauth/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: process.env.ZOOM_APP_CLIENT_ID,
      password: process.env.ZOOM_APP_CLIENT_SECRET,
    },
    data: tokenRequestParamString,
  })
}

const refreshZoomAccessToken = async (zoomRefreshToken) => {
  const searchParams = new URLSearchParams()
  searchParams.set('grant_type', 'refresh_token')
  searchParams.set('refresh_token', zoomRefreshToken)

  return await axios({
    url: `${process.env.ZOOM_HOST}/oauth/token?${searchParams.toString()}`,
    method: 'POST',
    auth: {
      username: process.env.ZOOM_APP_CLIENT_ID,
      password: process.env.ZOOM_APP_CLIENT_SECRET,
    },
  })
}

const getZoomUser = async (accessToken) => {
  return await axios({
    url: `${process.env.ZOOM_HOST}/v2/users/me`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

const getDeeplink = async (accessToken) => {
  return await axios({
    url: `${process.env.ZOOM_HOST}/v2/zoomapp/deeplink`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      action: JSON.stringify({
        url: '/your/url',
        role_name: 'Owner',
        verified: 1,
        role_id: 0,
      }),
    },
  })
}

const getBackendAccessToken = async () => {
  const ZOOM_CLIENT_ID = 'KpF7dckSi3wDDDgypuUA'
  const ZOOM_CLIENT_SECRET = 'y89w59tQuEZwIh22ZuTZWWSUfyca4x7U'

  return await axios({
    url: `${process.env.ZOOM_HOST}/oauth/token?grant_type=account_credentials&account_id=oufknCUvSBKO5YWbmE4R-g`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
    }
  })
}

const getChatBotAccessToken = async () => {
  const ZOOM_APP_CLIENT_ID = 'BAoNTIn5Qd2PHiuHdclLew'
  const ZOOM_APP_CLIENT_SECRET = 'S9K8rSe22RC2k1PB2tu61oQU2RACd3T8'
  return await axios({
    url: `${process.env.ZOOM_HOST}/oauth/token?grant_type=client_credentials`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${ZOOM_APP_CLIENT_ID}:${ZOOM_APP_CLIENT_SECRET}`).toString('base64')}`,
    }
  })
}

const getEngInfo = async (accessToken, engagementId) => {
  const url = `${process.env.ZOOM_HOST}/v2/contact_center/engagements/${engagementId}`
  console.log('!!! Eng url:', url)
  console.log('!!! accessToken:', accessToken)
  return await axios({
    url: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

const getEngagementNotes = async (accessToken, engagementId) => {
  const url = `${process.env.ZOOM_HOST}/v2/contact_center/engagements/${engagementId}/notes`
  return await axios({
    url: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  })
}

const getChatDetailesRetry = async (accessToken, engagementId, retries, delay) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `${process.env.ZOOM_HOST}/v2/contact_center/engagements/transcripts/download/${engagementId}`
      return await axios({
        url: url,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      })
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt === retries) {
        console.error('All attempts failed');
        throw error;
      }

      console.log(`Retrying in ${delay} ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

const sendApprovalMessage = async (accessToken) => {
    // let channelId = '';
    // const urlGetJid = `${process.env.ZOOM_HOST}/v2/chat/users/andrei.g@fotando.org/channels`
    // const response = await axios({
    //   url: urlGetJid,
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${accessToken}`
    //   }
    // })
    // const channels = response.data.channels;
    // console.log('channels:', channels);
    // for (const channel of channels) {
    //   if (channel.type === '1on1') {
    //     console.log('Channel:', channel);
    //     channelId = channel.id; // This is the JID needed to send messages
    //   }
    // }
  const reqBody = {
    robot_jid: "v10bpxvpzxrqitsbgsbwwd5q@xmpp.zoom.us",
    user_jid: "f9bfjer1ssecd5oyh1yvqa@xmpp.zoom.us",
    to_jid: "a2ea3f58a7fa4af7bc7991718113a50e@conference.xmpp.zoom.us",
    account_id: "oufknCUvSBKO5YWbmE4R-g",
    content: {
        body: [
            {
              type: "message",
              text: "Meeting ID: "
            }
          ]
    } 
  }
  const url = `${process.env.ZOOM_HOST}/v2/im/chat/messages`
  return await axios({
    url: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify(reqBody),
  })
}

module.exports = {
  getZoomAccessToken,
  refreshZoomAccessToken,
  getBackendAccessToken,
  getZoomUser,
  getEngInfo,
  getDeeplink,
  getEngagementNotes,
  getChatDetailesRetry,
  sendApprovalMessage,
  getChatBotAccessToken
}
