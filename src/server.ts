import errorHandler from 'errorhandler'
import stoppable from 'stoppable'
import { app } from './app'
import { Config } from './config'
import { logger } from './utils/logger'
import { mongo } from './persistance/mongo'
import { cs } from './microservices/commServer'
import { scheduledJobs } from './core/scheduler'

/**
 * Error Handler. Provides full stack - only in dev
 */
if (Config.NODE_ENV === 'development') {
  app.use(errorHandler())
}

// Start other services
async function bootstrap() {
  try {
    // Run other services here
    mongo.connect() // Mongo connection
    await cs.initialize()
    // Scheduled tasks
    if (Config.SCHEDULER_ENABLED) {
      logger.info('Scheduler enabled')
      scheduledJobs.start()
    } else {
      logger.info('Scheduler NOT enabled')
      scheduledJobs.stop()
    }
    logger.info('All services initialized')
  } catch (error: unknown) {
    const err = error as Error
    logger.error(err.message)
    logger.error('There were errors initializing the server...')
  }
}

/*
  WEB SERVER lifecycle
  Start server
  Connection manager wrapping to end connections gracefully
  Control kill signals
  Control HTTP server errors
*/
function startServer() {
  return stoppable(app.listen(app.get('port'), app.get('ip'), () => {
    // Server started
    logger.info(
      `  App is running at ${app.get('ip')}:${app.get('port')} in ${app.get('env')} mode`)
    logger.info(`  App root path is ${Config.HOME_PATH}`)
    logger.info('  Press CTRL-C to stop\n')
    logger.info('Initializing services... Will take some seconds')
    setTimeout(bootstrap, 10000)  // Initialize everything else (Wait 10 for other services to be ready)
  }), 3000)
}

// App
const server = startServer()

// gracefully shut down server
function shutdown() {
  server.stop((err: Error | undefined) => {
    if (err) {
      logger.error(err)
      process.exitCode = 1
    }
    process.exit()
  }) // decorated by stoppable module to handle keep alives 
}

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', () => {
  logger.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ')
  shutdown()
})

// quit properly on docker stop
process.on('SIGTERM', () => {
  logger.info('Got SIGTERM (docker container stop). Graceful shutdown ')
  shutdown()
})

// eslint-disable-next-line import/no-default-export
export default server
