import got, { Method, Headers } from 'got'
import { JsonType } from '../types/misc-types'
import { Config } from '../config'
import { errorHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'

// CONSTANTS 

const callApi = got.extend({
    prefixUrl: Config.SLACK.HOST,
    responseType: 'text',
    isStream: false,
    retry: 2, // Retries on failure N times
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: 30000, // 30sec to timeout
    decompress: true // accept-encoding header gzip
})

const ApiHeader = { 'Content-Type': 'application/json' } 

// FUNCTIONS

export const slack = {
    pushMessage: async (payload: string): Promise<void> => {
        try {
            const json = { text: payload }
            await request(Config.SLACK.HOOK, 'POST', json, ApiHeader)
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error(error.status + ' : SLACK : ' + error.message)
        }
    }
}

// PRIVATE FUNCTIONS

const request = async (endpoint: string, method: Method, json: JsonType, headers?: Headers) => {
    return callApi(endpoint, { method, json, headers })
}
