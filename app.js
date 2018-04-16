const {PUBLIC_PATH} = require('./config/basic')
const express = require('express')
const app = express()

const api = require('./api')
const bodyParser = require('body-parser')
const {DB_SESSION_STORE} = require('./config/redis')
const logger = require('morgan')
const session = require('./lib/session-store')
const path = require('path')
const prototype = require('./lib/prototype')
const captcha = require('./lib/captcha')

// Disable Header 'X-Powered-By' added by express.
app.disable('x-powered-by')

// DEV: request logger
app.use(logger('dev'))

// DEV: PPT JSON
app.set('json spaces', 4)

app.use(session.sessionParser)
app.use(prototype.setResponsePrototype)

// DEV: Added when debugging from localhost or other server
app.use(function (req, res, next) {
  res.set('Access-Control-Allow-Credentials', 'true')
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  next()
})

app.use('/public', express.static(PUBLIC_PATH, {fallthrough: false}))

// Catch internal error
app.use((err, req, res, next) => {
  'use strict'
  if (err instanceof Error)
    res.fatal(500, err)
  else
    next()
})

app.use(bodyParser.json({limit: '233kb'}))

// Catch error generated by bodyParser (Usually size limit exceeded)
app.use((err, req, res, next) => {
  'use strict'
  if (err instanceof Error)
    res.fatal(err.status, err)
  else next()
})

// This defaults to 100kb
app.use(bodyParser.urlencoded({extended: true}))

// Dispatch to router

app.get('/api/captcha', (req, res) => {
  'use strict'
  return captcha.middleware(req.params.type)(req, res)
})

app.get('/api/captcha/:type', (req, res) => {
  'use strict'
  return captcha.middleware(req.params.type)(req, res)
})

app.use('/api', api)

// Catch all other request
app.all(/^.+$/, (req, res) => {
  res.fatal(501)
})

app.all(/^.+$/, (err, req, res) => {
  // DEV: remove
  res.fatal(500, err.stack || err)
})

module.exports = app
