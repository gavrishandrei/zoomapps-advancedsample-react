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

module.exports = {
  getZoomAccessToken,
  refreshZoomAccessToken,
  getBackendAccessToken,
  getZoomUser,
  getEngInfo,
  getDeeplink,
  getEngagementNotes,
  getChatDetailesRetry
}
