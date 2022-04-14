import { redisDb } from '../microservices/redisConnector'
import { Config } from '../config'
import { logger } from '../utils/logger'

// Functions

export const getSession = async (key: string): Promise<string | null> => {
    return redisDb.get(key)
}

export const getAllSessions = async (cursor: number) => {
    await redisDb.scan(cursor)
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
