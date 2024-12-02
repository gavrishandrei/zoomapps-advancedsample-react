const path = require('path')

require('dotenv').config({
  path: path.join(__dirname, `.env${process.env.NODE_ENV}`),
})

require('dotenv').config()

const envars = [
  'PORT',
  'ZOOM_WEBHOOK_SECRET_TOKEN',
  'SESSION_SECRET',
  'ZOOM_APP_CLIENT_URL',
  'ZOOM_APP_CLIENT_ID',
  'HUBSPOT_APP_CLIENT_ID',
  'HUBSPOT_APP_CLIENT_SECRET',
  'ZOOM_APP_CLIENT_SECRET',
  'ZOOM_APP_REDIRECT_URI',
  'ZOOM_HOST',
  'ZOOM_APP_OAUTH_STATE_SECRET',
  'REDIS_URL',
  'REDIS_ENCRYPTION_KEY',
]

envars.forEach((envar) => {
  if (!process.env[envar]) {
    const error = new Error(`${envar} was not detected in environment`)
    console.error(error)
    process.exit(1)
  }
})
