/**
 * redis.js
 * Interface to REDIS DB
 * @interface
 */
 import redis, { createClient, RedisClientOptions } from 'redis'
 import { Request, Response, NextFunction } from 'express'
 import { Config } from '../config'
 import { logger } from '../utils/logger'
 import { JsonType } from '../types/misc-types'
 
 const redisOptions = {
     port: Number(Config.REDIS.PORT), 
     host: Config.REDIS.HOST,
     auth_pass: Config.REDIS.PASSWORD
  } as RedisClientOptions

  const client = createClient(redisOptions)

// Exposes functions for working with the cache db REDIS
export const redisDb = {
    /**
    * Starts REDIS and listens to connect or error events;
    * @returns {void}
    */
    start: async () => {
        client.on('error', (err) => {
            logger.error(err.message)
            process.exit(1)
        })
        client.on('connect', () => {
            logger.info('Connected successfully to Redis!!')
        })
        await client.connect()
        },
    /**
     * Checks REDIS connection status;
     * Rejects if REDIS not ready;
     * @async
     * @returns {void}
     */
    health: async (): Promise<void> => {
        const reply = await client.ping()
        logger.debug('Redis is ready: ' + reply)
    }
}
