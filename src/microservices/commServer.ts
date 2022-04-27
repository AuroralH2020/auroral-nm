import got, { Method, Headers } from 'got'
import { JsonType } from '../types/misc-types'
import { Config } from '../config'
import { csGroup, csSession, csSessionCount, csUser, csUserGroups, csUserRoster } from '../types/cs-types'
import { logger } from '../utils/logger'

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

// FUNCTIONS

export const cs = {
    initialize: async (username?: string) => {
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
        const sessions = (await cs.getSessions()).sessions.length
        logger.info(`Communication server connected, there are ${sessions} sessions active`)
    },
    getSessions: async (username?: string) => {
        const uri = username ? 'sessions/' + username : 'sessions'
        return request(uri, 'GET', undefined, ApiHeader) as Promise<{ sessions: csSession[]}>
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
        return request('groups', 'POST', { name, description }, ApiHeader) as Promise<void>
    },
    deleteGroup: async (name: string) => {
        return request('groups/' + name, 'DELETE', undefined, ApiHeader) as Promise<void>
    }  
}

// PRIVATE FUNCTIONS

const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string) => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}
