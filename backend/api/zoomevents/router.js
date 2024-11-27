const { Router } = require('express')
const router = Router()
const controller = require('./controller')
router
  .post('/incomingEvent', controller.incomingEvent)

module.exports = router
