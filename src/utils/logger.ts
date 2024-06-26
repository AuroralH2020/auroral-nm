import path from 'path'
import { createLogger, format, transports } from 'winston'
import ecsFormat from '@elastic/ecs-winston-format'

import dotenv from 'dotenv'

const { combine, timestamp, label, json, colorize, simple } = format
const LOG_FILE_PATH_INFO = path.join(__dirname, '../../../logs/combined.log')
const LOG_FILE_PATH_ERROR = path.join(__dirname, '../../../logs/error.log')

dotenv.config()

// Log rotation config
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 5
 
const logFormat = format.printf(info => `${info.timestamp} ${info.level} {${getId(info.message)}} [${info.label}]: ${parseMsg(info.message)}`)

// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: LOG_FILE_PATH_INFO,
    handleExceptions: true,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    format: ecsFormat()
  },
  errorfile: {
    level: 'error',
    filename: LOG_FILE_PATH_ERROR,
    handleExceptions: true,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    format: ecsFormat()
},
  console: {
    level: 'debug',
    // level: 'info',
    handleExceptions: true,
    timestamp: true,
    format: combine(
      format.errors({ stack: true }),
      label({ label: process.env.LOGGER_LABEL }),
      timestamp(),
      // colorize(),
      logFormat
    )
  },
}
 
// instantiate a new Winston Logger with the settings defined above
export const logger = createLogger({
  transports: [
    // new transports.File(options.file),
    // new transports.File(options.errorfile),
    new transports.Console(options.console),
  ],
  exitOnError: false, // do not exit on handled exceptions
})

function parseMsg(x: any) {
  return typeof x === 'object' ? x.msg : x
}

function getId(x: any) {
  return typeof x === 'object' ? x.id : undefined
}
