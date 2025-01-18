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
  const propertiesObj = {
      subject: ticketDetailes.subject,
      content: ticketDetailes.description,
      hs_ticket_priority: ticketDetailes.priority,
      hs_pipeline_stage: ticketDetailes.status
  }

  return await await axios({
    url: 'https://api.hubapi.com/crm/v3/objects/tickets',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: {properties: propertiesObj},
  })
}

const createContact = async (accessToken, contactDetailes) => {
  const propertiesObj = {
      firstname: contactDetailes.firstName,
      lastname: contactDetailes.lastName,
      email: contactDetailes.email,
      mobilephone: contactDetailes.phone,
      phone: contactDetailes.phone
  }

  return await await axios({
    url: 'https://api.hubapi.com/crm/v3/objects/contacts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: {properties: propertiesObj},
  })
}

const updateTicket = async (accessToken, ticketDetailes) => {
  const propertiesObj = {
      subject: ticketDetailes.subject,
      content: ticketDetailes.description,
      hs_ticket_priority: ticketDetailes.priority,
      hs_pipeline_stage: ticketDetailes.status
  }
  const updateTicketUrl = `https://api.hubapi.com/crm/v3/objects/tickets/${ticketDetailes.ticketId}`
  return await await axios({
    url: updateTicketUrl,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: {properties: propertiesObj},
  })
}

const getTicketsList = async (accessToken, ticketDetailes) => {
  const searchTicketsFilter = {
    filterGroups:[
      {
        filters:[
          {
            propertyName: 'associations.contact',
            operator: 'EQ',
            value: ticketDetailes.contactId
          }
        ]
      }
    ]
  }

  return await await axios({
    url: 'https://api.hubapi.com/crm/v3/objects/tickets/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify(searchTicketsFilter),
  })
}

const createNotes = async (accessToken, notesBody) => {
  return await await axios({
    url: 'https://api.hubapi.com/crm/v3/objects/notes/batch/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: notesBody,
  })
}

const createDefaultAssociation = async (accessToken, associationDetailes) => {
  return await await axios({
    url: `https://api.hubapi.com/crm/v4/objects/${associationDetailes.fromObjectType}/${associationDetailes.fromObjectId}/associations/default/${associationDetailes.toObjectType}/${associationDetailes.toObjectId}`,
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: {}
  })
}

const getAccountInfo = async (accessToken) => {
  return await await axios({
    url: 'https://api.hubapi.com/account-info/v3/details',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    data: {}
  })
}

const searchRelatedToRecords = async (accessToken, searchDetailes) => {
  // dealname
  // name
  const propertyName = searchDetailes.entity === 'deal' ? 'dealname' : 'name';
  const searchEntityFilter = {
    filterGroups:[
      {
        filters:[
          {
            propertyName: propertyName,
            operator: 'CONTAINS_TOKEN',
            value: `*${searchDetailes.searchTerm}*`
          }
        ]
      }
    ]
  }
  return await await axios({
    url: `https://api.hubapi.com/crm/v3/objects/${searchDetailes.entity}/search`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify(searchEntityFilter),
  })
}

const searchContacts = async (accessToken, searchDetailes) => {
  const searchQuery = {
    query: searchDetailes.searchTerm
  }
  return await await axios({
    url: `https://api.hubapi.com/crm/v3/objects/contacts/search`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify(searchQuery),
  })
}

const updateContact = async (accessToken, contactDetailes) => {
  const updateTicketUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactDetailes.contactId}`
  return await await axios({
    url: updateTicketUrl,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: {properties: contactDetailes.properties},
  })
}

module.exports = {
  exchangeHubSpotTokens,
  getAccessTokenByRefresh,
  getContactsByPhone,
  createTicket,
  createDefaultAssociation,
  createNotes, 
  getTicketsList,
  updateTicket,
  getAccountInfo,
  searchRelatedToRecords,
  createContact,
  searchContacts,
  updateContact
}
