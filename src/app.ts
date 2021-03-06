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
import { accessControl } from './api/middlewares/access-control'
import { Config } from './config'
import { logger } from './utils/logger'
import { ExternalRouter } from './api/external-api/routes'

// Create Express server
const app = express()

// Express configuration
app.set('port', Config.PORT || 4000)
app.set('ip', Config.IP || 'localhost')
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Trust proxy, accepting only last hop (1)
app.set('trust proxy', 1)

// Basic cors setup
app.use(cors())

// Setup Headers & Access-Control
app.use(accessControl())
 
app.use('/api/ui/v1/', UiRouter)
app.use('/api/gtw/v1/', GtwRouter)
app.use('/api/external/v1/', ExternalRouter)

/**
 * Not Found
 */
app.get('*', (req, res) => {
  logger.warn(`The path ${req.path} does not exist`)
  return responseBuilder(HttpStatusCode.NOT_FOUND, res)
})

export { app }
