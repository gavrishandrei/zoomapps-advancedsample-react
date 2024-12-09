const axios = require('axios')
const qs = require('qs');

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

module.exports = {
  exchangeHubSpotTokens,
}
