/**
 * redis.js
 * Interface to REDIS DB
 * @interface
 */
 import { createClient, RedisClientOptions } from 'redis'
 import { Config } from '../config'
 import { logger } from '../utils/logger'
 import { errorHandler } from '../utils/error-handler'

// Create Redis Client for sessions
const redisSessionsOptions = {
    port: Number(Config.REDIS.PORT), 
    url: Config.REDIS.HOST,
    password: Config.REDIS.PASSWORD,
    database: 0 // DB for sessions
 } as RedisClientOptions

const client = createClient(redisSessionsOptions)

// Exposes functions for working with the cache db REDIS
export const redisDb = {
    /**
    * Starts REDIS and listens to connect or error events;
    * @returns {void}
    */
    start: async () => {
        try {
            await client.connect()
            logger.info('Connected successfully to Redis!!')
        } catch (err) {
            const error = errorHandler(err)
            logger.error(error.message)
            logger.error('Could not connect to Redis...')
        }
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
    },
    // PERSIST
    /**
     * Force saving changes to dump.rdb;
     * Use to ensure critical changes will not be lost;
     * Does not reject on error, resolves false;
     * @async
     * @returns {string}
     */
    save: async (): Promise<void> => {
        await client.save()
    },
    // BASIC STRING STORAGE & REMOVAL
    /**
     * Save a string;
     * Custom defined ttl => 0 = no TTL;
     * rejects on error;
     * @async
     * @param {string} key
     * @param {*} item
     * @param {integer} ttl
     * @returns {void}
     */
    set: async (key: string, item: string, ttl: number): Promise<void> => {
        await client.set(key, item, { 'EX': ttl }) // Other options NX, GET (Check redis for more)...
    },
    /**
     * Remove manually one key or list stored;
     * rejects on error a boolean;
     * @async
     * @param {string} key
     * @returns {void}
     */
    remove: async (key: string): Promise<void> => {
        await client.del(key)
    },
    /**
     * Get manually one key or list stored;
     * rejects on error a boolean;
     * @async
     * @param {string} key
     * @returns {string | null}
     */
    get: (key: string): Promise<string | null> => {
        return client.get(key)
    },
    /**
     * Get manually one key or list stored;
     * rejects on error a boolean;
     * @async
     * @param {string} key
     * @returns {string | null}
     */
    scan: (cursor: number): Promise<{ cursor: number, keys: string[]}> => {
        return client.scan(cursor)
    }
}
