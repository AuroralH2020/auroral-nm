/**
 * redis.js
 * Interface to REDIS DB
 * @interface
 */
 import { createClient } from 'redis'
 import fs from 'fs'
 import path from 'path'
 import { Config } from '../config'
 import { logger } from '../utils/logger'
 import { errorHandler } from '../utils/error-handler'

 // Workaround to solve Redis issue with types
 type RedisClientType = ReturnType<typeof createClient>
 type RedisClientOptions = Parameters<typeof createClient>[0]

export class RedisFactory {
    private client: RedisClientType
  
    constructor(options: RedisClientOptions) {
        if (Config.REDIS.TLS) {
            this.client = createClient(
                { 
                    ...options, 
                    socket: { 
                        tls: true,
                        rejectUnauthorized: false,
                        cert: fs.readFileSync(path.join(Config.HOME_PATH, Config.REDIS.CERT))
                    }
                })
        } else {
            this.client = createClient(options)
        }
    }

    /**
    * Starts REDIS and listens to connect or error events;
    * @returns {void}
    */
    public start = async () => {
        try {
            await this.client.connect()
        } catch (err) {
            const error = errorHandler(err)
            logger.error(error.message)
            logger.error('Could not connect to Redis...')
        }
    }

    /**
     * Checks REDIS connection status;
     * Rejects if REDIS not ready;
     * @async
     * @returns {void}
     */
    public health = async (): Promise<void> => {
        const reply = await this.client.ping()
        logger.debug('Redis is ready: ' + reply)
    }

    // PERSIST
    /**
     * Force saving changes to dump.rdb;
     * Use to ensure critical changes will not be lost;
     * Does not reject on error, resolves false;
     * @async
     * @returns {string}
     */
    public save = async (): Promise<void> => {
        await this.client.save()
    }

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
    public set = async (key: string, item: string, ttl: number): Promise<void> => {
        await this.client.set(key, item, { 'EX': ttl }) // Other options NX, GET (Check redis for more)...
    }

    /**
     * Remove manually one key or list stored;
     * rejects on error a boolean;
     * @async
     * @param {string} key
     * @returns {void}
     */
    public remove = async (key: string): Promise<void> => {
        await this.client.del(key)
    }

    /**
     * Get manually one key or list stored;
     * rejects on error a boolean;
     * @async
     * @param {string} key
     * @returns {string | null}
     */
    public get = (key: string): Promise<string | null> => {
        return this.client.get(key)
    }

    /**
     * Get manually one key or list stored;
     * rejects on error a boolean;
     * @async
     * @param {string} key
     * @returns {string | null}
     */
    public getWithTTL = async (key: string): Promise<{ value: string | null, ttl: number }> => {
        const ttl = await this.client.TTL(key)
        const value = await this.client.get(key)
        return { value, ttl }
    }

    /**
     * Get manually one key or list stored;
     * rejects on error a boolean;
     * @async
     * @param {string} key
     * @returns {string | null}
     */
    public scan = (cursor: number): Promise<{ cursor: number, keys: string[]}> => {
        this.client.scanIterator()
        return this.client.scan(cursor)
    }
    /**
     * Returns iterator for given preffix
     * @param preffix Prefix to search
     * @returns 
     */
    public stringScanIterator = (preffix: string): AsyncIterable<string> => {
        return this.client.scanIterator({
            TYPE: 'string', // `SCAN` only
            MATCH: preffix + '*',
            COUNT: 10
          })
    }
}
