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
        const data = await redisDb.scan(cursor)
        const sessions = await Promise.all(data.keys.map(async (it) => {
                return getSession(it) 
            })
        ) as unknown as string[]
        return { cursor: data.cursor, sessions }
    } else {
        return { cursor: 0, sessions: [] }
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
