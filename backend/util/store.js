const redis = require('redis')
const encrypt = require('./encrypt')
const util = require('util')
/**
 * The auth token exchange happens before the Zoom App is launched. Therefore,
 * we need a place to store the tokens so we can later use them when a session
 * is established.
 *
 * We're using Redis here, but this could be replaced by a cache or other means
 * of persistence.
 */

const db = redis.createClient({
  url: process.env.REDIS_URL,
})

const getAsync = util.promisify(db.get).bind(db)
const setAsync = util.promisify(db.set).bind(db)
const delAsync = util.promisify(db.del).bind(db)

db.on('error', console.error)

module.exports = {
  getUser: async function (zoomUserId) {
    const user = await getAsync(zoomUserId)
    if (!user) {
      console.log(
        'User not found.  This is normal if the user has added via In-Client (or if you have restarted Docker without closing and reloading the app)'
      )
      return Promise.reject('User not found')
    }
    return JSON.parse(encrypt.beforeDeserialization(user))
  },

  getHubSpotData: async function (zoomAccountId) {
    const account = await getAsync(zoomAccountId)
    if (!account) {
      return Promise.reject('Account not found')
    }
    return JSON.parse(encrypt.beforeDeserialization(account))
  },

  upsertUser: function (zoomUserId, accessToken, refreshToken, expired_at) {
    const isValidUser = Boolean(
      typeof zoomUserId === 'string' &&
        typeof accessToken === 'string' &&
        typeof refreshToken === 'string' &&
        typeof expired_at === 'number'
    )

    if (!isValidUser) {
      return Promise.reject('Invalid user input')
    }

    return setAsync(
      zoomUserId,
      encrypt.afterSerialization(
        JSON.stringify({ accessToken, refreshToken, expired_at })
      )
    )
  },
  upserEngagementDetails: function (engagementId, phoneNumber) {
    const isValiEng = Boolean(
      typeof engagementId === 'string' &&
        typeof phoneNumber === 'string'
    )

    if (!isValiEng) {
      return Promise.reject('Invalid engagement input')
    }

    return setAsync(
      engagementId,
      encrypt.afterSerialization(
        JSON.stringify({ phoneNumber })
      )
    )
  },

  getEngagementDetails: async function (engagementId) {
    const engagement = await getAsync(engagementId)
    if (!engagement) {
      return Promise.reject('Engagement not found')
    }
    return JSON.parse(encrypt.beforeDeserialization(engagement))
  },

  updateUser: async function (zoomUserId, data) {
    const userData = await getAsync(zoomUserId)
    const existingUser = JSON.parse(encrypt.beforeDeserialization(userData))
    const updatedUser = { ...existingUser, ...data }

    return setAsync(
      zoomUserId,
      encrypt.afterSerialization(JSON.stringify(updatedUser))
    )
  },

  upsertHubSpotAuth: function (zoomAccountId, accessToken, refreshToken) {
    const isValidAccount = Boolean(
      typeof zoomAccountId === 'string' &&
        typeof accessToken === 'string' &&
        typeof refreshToken === 'string'
    )

    if (!isValidAccount) {
      return Promise.reject('Invalid account input')
    }

    return setAsync(
      zoomAccountId,
      encrypt.afterSerialization(
        JSON.stringify({ accessToken, refreshToken})
      )
    )
  },

  updateHubSpotAuth: async function (zoomAccountId, data) {
    const accountData = await getAsync(zoomAccountId)
    const existingHubSpotAccount = JSON.parse(encrypt.beforeDeserialization(accountData))
    const updatedHubSpotAccount = { ...existingHubSpotAccount, ...data }

    return setAsync(
      zoomAccountId,
      encrypt.afterSerialization(JSON.stringify(updatedHubSpotAccount))
    )
  },

  logoutUser: async function (zoomUserId) {
    const reply = await getAsync(zoomUserId)
    const decrypted = JSON.parse(encrypt.beforeDeserialization(reply))
    delete decrypted.thirdPartyAccessToken
    return setAsync(
      zoomUserId,
      encrypt.afterSerialization(JSON.stringify(decrypted))
    )
  },

  deleteUser: (zoomUserId) => delAsync(zoomUserId),

  storeInvite: (invitationID, tabState) => {
    const dbKey = `invite:${invitationID}`
    return setAsync(dbKey, tabState)
  },

  getInvite: (invitationID) => {
    const dbKey = `invite:${invitationID}`
    return getAsync(dbKey)
  },
}
