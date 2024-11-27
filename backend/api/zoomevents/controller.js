/* eslint-disable prettier/prettier */
module.exports = {
  // In-Client OAuth 2/2
  async incomingEvent(req, res) {
    console.log(
      'INCOMING EVENT ==========================================================',
      '\n'
    )

    const eventBody = req.body;
    console.log('!!!!! eventBody: ', eventBody)

    return res.json({ result: 'Success' })
  }
}
