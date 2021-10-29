import got, { Method, Headers } from 'got'
import { JsonType, XmppNotificationTypes } from '../types/misc-types'
import { Config } from '../config'
import { logger } from '../utils'
import { errorHandler } from '../utils/error-handler'

// CONSTANTS 

const apiUri = '/api/message/'

const callApi = got.extend({
    prefixUrl: Config.XMPP_CLIENT.URL + apiUri,
    responseType: 'json',
    isStream: false,
    retry: 2, // Retries on failure N times
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: 30000, // 30sec to timeout
    decompress: true // accept-encoding header gzip
})

const ApiHeader = { 
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
    simple: 'false' } 

// FUNCTIONS

export const xmpp = {
    notifyPrivacy: async (agid?: string): Promise<void> => {
        if (agid) {
            // send notification to Node
            try {
                await request(agid + '/' + XmppNotificationTypes.PRIVACY, 'GET', undefined, ApiHeader)
                logger.debug('XMPP notif sent to: ' + agid)
            } catch (err) {
                const error = errorHandler(err)
                logger.error('XMPP notif not sent: ' + agid + ' [' + error.message + ']')              
            }
        }
    }
}

// PRIVATE FUNCTIONS
const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string) => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}
