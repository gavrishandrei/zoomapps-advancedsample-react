const { Router } = require('express')
const router = Router()
const controller = require('./controller')
router
  .use('/proxy', controller.proxy)
  .use('/sockjs-node', controller.proxy)
  .get('/install', controller.install)
  .get('/auth', controller.auth)
  .get('/home', controller.home)
  .get('/authorize', controller.inClientAuthorize)
  .get('/getEngagementInfo', controller.getEngagementInfo)
  .post('/onauthorized', controller.inClientOnAuthorized)
  .get('/installHubspot', controller.installHubSpot)
  .get('/hubspotOauthCallback', controller.hubspotOauthCallback)

module.exports = router
