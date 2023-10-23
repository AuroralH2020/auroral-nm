/* eslint-disable import/order */
/* eslint-disable import/first */
import apm_service from './utils/apm-service'

apm_service().catch((error) => {
  logger.error(error.message)
})

import cors from 'cors'
import express from 'express'
import { responseBuilder, HttpStatusCode } from './utils'
import { UiRouter } from './api/ui-api/routes'
import { GtwRouter } from './api/gtw-api/routes'
import { AuthRouter } from './api/auth-api/routes'
import { accessControl } from './api/middlewares/access-control'
import { Config } from './config'
import { logger } from './utils/logger'
import { ExternalRouter } from './api/external-api/routes'

// Create Express server
const app = express()

// Express configuration
app.set('port', Config.PORT || 4000)
app.set('ip', Config.IP || 'localhost')
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Disable x-powered-by
app.use((_req, res, next) => {
  res.setHeader('X-Powered-By', 'AURORAL server')
  next()
})
// Trust proxy, accepting only last hop (1)
app.set('trust proxy', Config.TRUST_PROXY)

// Basic cors setup
// app.use(cors())

// Setup Headers & Access-Control
app.use(accessControl())

const corsOptions = {
  // original
  // origin: Config.NODE_ENV === 'development' ? 'https://auroral.dev.bavenir.eu' : 'https://auroral.bavenir.eu',
  origin: Config.NODE_ENV === 'development' ? '*' : 'https://auroral.bavenir.eu',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
 
app.use('/api/ui/v1/', cors(corsOptions), UiRouter)
app.use('/api/auth/v1/', cors(corsOptions), AuthRouter)
app.use('/api/gtw/v1/', cors(), GtwRouter)
app.use('/api/external/v1/', cors(), ExternalRouter)

/**
 * Not Found
 */
app.get('*', (req, res) => {
  logger.warn(`The path ${req.path} does not exist`)
  return responseBuilder(HttpStatusCode.NOT_FOUND, res)
})

export { app }
