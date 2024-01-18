import got, { Method, Headers } from 'got'
import { RedisClientOptions } from 'redis'
import { JsonType } from '../types/misc-types'
import { Config } from '../config'
import { csGroup, csSession, csSessionCount, csUser, csUserGroups, csUserRoster } from '../types/cs-types'
import { logger } from '../utils/logger'
import { RedisFactory } from './redisConnector'

// CONSTANTS 

const apiUri = '/plugins/restapi/v1'

const callApi = got.extend({
    prefixUrl: Config.CS.URL + apiUri,
    responseType: 'json',
    isStream: false,
    retry: 2, // Retries on failure N times
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: 30000, // 30sec to timeout
    decompress: true // accept-encoding header gzip
})

const ApiHeader = { 
    Authorization: Config.CS.SECRET_KEY, 
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
    simple: 'false' } 

// REDIS CACHING
// Create Redis Client for XMPP
const redisOptions = {
    // port: Number(Config.REDIS.PORT), 
    url: Config.REDIS.HOST,
    password: Config.REDIS.PASSWORD,
    database: 1 // DB for sessions
 } as RedisClientOptions

const redisDb = new RedisFactory(redisOptions)
redisDb.start()
logger.info('Connected successfully Redis for CommServer!!')

// FUNCTIONS

export const cs = {
    initialize: async () => {
        if (!Config.XMPP_CLIENT.URL) {
            logger.warn('XMPP client configuration missing...Please check...')
        }
        // Create XMPP client user if missing
        try {
            const xmpp_user = await cs.getUsers(Config.XMPP_CLIENT.NAME) as unknown as csUser
            logger.info(`Global xmpp user ${xmpp_user.username}`)
        } catch (err) {
            logger.warn('XMPP User missing... Creating...')
            await cs.postUser(Config.XMPP_CLIENT.NAME, Config.XMPP_CLIENT.PASSWORD)
            const xmpp_user = await cs.getUsers(Config.XMPP_CLIENT.NAME) as unknown as csUser
            logger.info(`Global xmpp user ${xmpp_user.name}`)
        }
        // Get sessions
        const sessions = await cs.getCountOfSessions()
        logger.info(`Communication server connected, there are ${sessions.localSessions} session(s) active`)
    },
    getSessions: async (username: string): Promise<{ session: csSession[], ttl: number }> => {
        // Feature disabled for openfire version 4.8.0 -> REST API sessions is not working
        return { session: [], ttl: 0 }
        // const uri = 'sessions/' + username
        // const session = await redisDb.getWithTTL(uri)
        // if (!session.value) {
        //     const data = await request(uri, 'GET', undefined, ApiHeader) as { sessions: csSession[] }
        //     await redisDb.set(uri, JSON.stringify(data), 900)
        //     return { session: data.sessions, ttl: 900 }
        // } else {
        //     return { session: JSON.parse(session.value).sessions, ttl: session.ttl }
        // }
    },
    closeSessions: async (username: string) => {
        return request('sessions/' + username, 'DELETE', undefined, ApiHeader) as Promise<void>
    },
    getCountOfSessions: async () => {
        return request('system/statistics/sessions', 'GET', undefined, ApiHeader) as Promise<csSessionCount>
    },
    getUsers: async (username?: string) => {
        const uri = username ? 'users/' + username : 'users'
        return request(uri, 'GET', undefined, ApiHeader) as Promise<csUser | csUser[]>
    },
    searchUser: async (username: string) => {
        return request('users', 'GET', undefined, ApiHeader, { search: username }) as Promise<csUser[]>
    },
    postUser: async (username: string, password: string) => {
        return request('users', 'POST', { username, password }, ApiHeader) as Promise<void>
    },
    deleteUser: async (username: string) => {
        return request('users/' + username, 'DELETE', undefined, ApiHeader) as Promise<void>
    },
    lockoutUser: async (username: string) => {
        return request('lockouts/' + username, 'POST', undefined, ApiHeader) as Promise<void>
    },
    unlockUser: async (username: string) => {
        return request('lockouts/' + username, 'DELETE', undefined, ApiHeader) as Promise<void>
    },
    getUserGroups: async (username: string) => {
        return request('users/' + username + '/groups', 'GET', undefined, ApiHeader) as Promise<csUserGroups>
    },
    addUserToGroup: async (username: string, groupName: string) => {
        return request('users/' + username + '/groups/' + groupName, 'POST', undefined, ApiHeader) as Promise<void>
    },
    getUserRoster: async (username: string) => {
        return request('users/' + username + '/roster', 'GET', undefined, ApiHeader) as Promise<csUserRoster>
    },
    deleteUserFromGroup: async (username: string, groupName: string) => {
        return request('users/' + username + '/groups/' + groupName, 'DELETE', undefined, ApiHeader) as Promise<void>
    },
    getGroup: async (name: string) => {
        return request('groups/' + name, 'GET', undefined, ApiHeader) as Promise<csGroup>
    },
    postGroup: async (name: string, description?: string) => {
        return request('groups', 'POST', { name, description, shared: true, members: [], admins: [] }, ApiHeader) as Promise<void>
    },
    deleteGroup: async (name: string) => {
        return request('groups/' + name, 'DELETE', undefined, ApiHeader) as Promise<void>
    },
    addAuroralUsersToGroup: async (groupName: string) => {
        const auroral_users = await cs.searchUser('auroral') as csUser[]
        if (auroral_users.length === 0) {
            logger.error('No auroral users found in CommServer')
            return
        }
        for (const user of auroral_users) {
            await cs.addUserToGroup(user.username, groupName)
        }
    }
}

// PRIVATE FUNCTIONS

const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: JsonType) => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}
