import { RedisClientOptions } from 'redis'
import * as crypto from 'crypto'
import { Config } from '../config'
import { logger } from '../utils/logger'
import { RedisFactory } from './redisConnector'

// CONSTANTS 

// REDIS CACHING
// Create Redis Client for XMPP
const redisOptions = {
    // port: Number(Config.REDIS.PORT), 
    url: Config.REDIS.HOST,
    password: Config.REDIS.PASSWORD,
    database: 2 // DB for tokens
 } as RedisClientOptions

const redisDb = new RedisFactory(redisOptions)
redisDb.start()
logger.info('Connected successfully Redis for CommServer!!')

// FUNCTIONS

export const tokenBlacklist = {
    checkInBlacklist: async (uid: string, token: string)  => {
        const tokens = []
        for await (const key of redisDb.stringScanIterator(uid)) {
            if (key) {
                tokens.push(await redisDb.get(key))
            }
        }
        return tokens.includes(token)
    },
    addToBlacklist: async (uid: string, token: string) => {
        const randomString = crypto.randomBytes(10).toString('hex')
        logger.debug('Adding token to blacklist (duration )' + Config.SESSIONS.DURATION + ': ' + uid)
        await redisDb.set(uid + ':' + randomString, token, Config.SESSIONS.DURATION)
    }
}

// PRIVATE FUNCTIONS
