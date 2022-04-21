import { redisDb } from '../microservices/redisConnector'
import { Config } from '../config'
import { logger } from '../utils/logger'

// Functions

export const getSession = async (key: string): Promise<string | null> => {
    if (Config.SESSIONS.ENABLED) {
        return redisDb.get(key)
    } else {
        return ''
    }
}

export const getAllSessions = async (cursor: number) => {
    if (Config.SESSIONS.ENABLED) {
        return redisDb.scan(cursor)
    } else {
        return { cursor: 0, keys: [] }
    }
}

export const setSession = async (key: string, value: string): Promise<void> => {
    if (Config.SESSIONS.ENABLED) {
        return redisDb.set(key, value, Config.SESSIONS.DURATION)
    }
}

export const delSession = async (key: string) => {
    if (Config.SESSIONS.ENABLED) {
        await redisDb.remove(key)
    }
}
