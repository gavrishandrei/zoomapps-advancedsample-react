/* eslint-disable prettier/prettier */
const axios = require('axios')
const qs = require('qs');
const store = require('./store')

const exchangeHubSpotTokens = async (exchangeProof) => {
  return await await axios({
    url: 'https://api.hubapi.com/oauth/v1/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    data: qs.stringify(exchangeProof),
  })
}

const getAccessTokenByRefresh = async (zoomAccountId) => {
  const responseData = await store.getHubSpotData(zoomAccountId)
  const redirectUrl = `${process.env.PUBLIC_URL}/api/zoomapp/hubspotOauthCallback?accountId=${zoomAccountId}`
  const authProof = {
    grant_type: 'refresh_token',
    client_id: process.env.HUBSPOT_APP_CLIENT_ID,
    client_secret: process.env.HUBSPOT_APP_CLIENT_SECRET,
    redirect_uri: redirectUrl,
    refresh_token: responseData.refreshToken
  }

  const newAccessTokenResp = await exchangeHubSpotTokens(authProof)
  return newAccessTokenResp.data.access_token    
}

const getContactsByPhone = async (accessToken, phoneNumber) => {
  const searchFilter = {
    filterGroups:[
      {
        filters:[
          {
            propertyName: 'phone',
            operator: 'EQ',
            value: phoneNumber
          }
        ]
      }
    ]
  }
  console.log('!searchFilter:', JSON.stringify(searchFilter));
  return await await axios({
    url: 'https://api.hubapi.com/crm/v3/objects/contacts/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify(searchFilter),
  })
}

const createTicket = async (accessToken, ticketDetailes) => {
  const properties = {
    subject: ticketDetailes.subject,
    content: ticketDetailes.description,
    hs_ticket_priority: ticketDetailes.selectedPriorityItem,
    hs_pipeline_stage: ticketDetailes.selectedStatusItem
  }
  return await await axios({
    url: 'https://api.hubapi.com/crm/v3/objects/tickets',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify(properties),
  })
}

// const createAssociationTicketContact = async (accessToken, associationDetailes) => {
//   //
//   const properties = {
//     subject: ticketDetailes.subject,
//     content: ticketDetailes.description,
//     hs_ticket_priority: ticketDetailes.selectedPriorityItem,
//     hs_pipeline_stage: ticketDetailes.selectedStatusItem
//   }
//   return await await axios({
//     url: 'https://api.hubapi.com/crm/v3/objects/tickets',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//       Authorization: `Bearer ${accessToken}`,
//       data: 
//     },
//     data: JSON.stringify(properties),
//   })
// }

module.exports = {
  exchangeHubSpotTokens,
  getAccessTokenByRefresh,
  getContactsByPhone,
  createTicket
}
