const axios = require('axios')

const exchangeHubSpotTokens = async (exchangeProof) => {
  return await await axios({
    url: 'https://api.hubapi.com/oauth/v1/token',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    data: {
      form: exchangeProof
    },
  })
}

module.exports = {
  exchangeHubSpotTokens,
}
