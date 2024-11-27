/* eslint-disable prettier/prettier */
'use strict'

require('./config')

const http = require('http')
const https = require('https')
const express = require('express')
const morgan = require('morgan')
const fs = require("fs")
const crypto = require('crypto')

const privateKey = fs.readFileSync('./server.key', 'utf8')
const certificate = fs.readFileSync('./server.crt', 'utf8')

const credentials = {
  key: privateKey,
  cert: certificate,
}

const middleware = require('./middleware')

const zoomAppRouter = require('./api/zoomapp/router')
const zoomRouter = require('./api/zoom/router')
const zoomeventsRouter = require('./api/zoomevents/router')
const thirdPartyOAuthRouter = require('./api/thirdpartyauth/router')
// Create app
const app = express()

// Set view engine (for system browser error pages)
app.set('view engine', 'pug')

// Set static file directory (for system browser error pages)
app.use('/', express.static('public'))

// Set universal middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(middleware.session)
app.use(middleware.setResponseHeaders)

// Zoom App routes
app.use('/api/zoomapp', zoomAppRouter)
app.use('/api/event', zoomeventsRouter)
if (
  process.env.AUTH0_CLIENT_ID &&
  process.env.AUTH0_CLIENT_SECRET &&
  process.env.AUTH0_ISSUER_BASE_URL
) {
  app.use('/api/auth0', thirdPartyOAuthRouter)
} else {
  console.log('Please add Auth0 env variables to enable the /auth0 route')
}

app.use('/zoom', zoomRouter)

app.post('/hello', (req, res) => {
  res.status(200).send({message: "Updated post successfuly"})
})

// Handle 404
app.use((req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

// Handle errors (system browser only)
app.use((error, req, res) => {
  res.status(error.status || 500)
  res.render('error', {
    title: 'Error',
    message: error.message,
    stack: error.stack,
  })
})

app.post('/webhook', (req, res) => {

  let response

  console.log(req.headers)
  console.log(req.body)

  // // construct the message string
  // const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`

  // const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest('hex')

  // // hash the message string with your Webhook Secret Token and prepend the version semantic
  // const signature = `v0=${hashForVerify}`

  // // you validating the request came from Zoom https://marketplace.zoom.us/docs/api-reference/webhook-reference#notification-structure
  // if (req.headers['x-zm-signature'] === signature) {

  //   // Zoom validating you control the webhook endpoint https://marketplace.zoom.us/docs/api-reference/webhook-reference#validate-webhook-endpoint
  //   if(req.body.event === 'endpoint.url_validation') {
  //     const hashForValidate = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(req.body.payload.plainToken).digest('hex')

  //     response = {
  //       message: {
  //         plainToken: req.body.payload.plainToken,
  //         encryptedToken: hashForValidate
  //       },
  //       status: 200
  //     }

  //     console.log(response.message)

  //     res.status(response.status)
  //     res.json(response.message)
  //   } else {
  //     response = { message: 'Authorized request to Zoom Webhook sample.', status: 200 }

  //     console.log(response.message)

  //     res.status(response.status)
  //     res.json(response)

  //     // business logic here, example make API request to Zoom or 3rd party

  //   }
  // } else {

  //   response = { message: 'Unauthorized request to Zoom Webhook sample.', status: 401 }

  //   console.log(response.message)

    // res.status(response.status)
    // res.json(response)
  //}
  res.status(200).send({message: "!!!! Webhook"})
})

// Start express server
http.createServer(app).listen(process.env.PORT, () => {
  console.log('Zoom App is listening on port', process.env.PORT)
})

// Start express server https
https.createServer(credentials, app).listen(8443, () => {
  console.log('Zoom App is listening on port', 8443)
})