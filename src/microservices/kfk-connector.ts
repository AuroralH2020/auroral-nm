/**
* Interface to interact with the Neighbourhood Manager
* @interface
*/ 

import got, { Method, Headers, Response } from 'got'
import { Config } from '../config'
import { GenericResponse } from '../types/nm-types'
import { nmToken } from '../core/platformToken'
import { ErrorLogType, JsonType } from '../types/misc-types'
import { RecordType } from '../types/xmpp-types'

// CONSTANTS 

const callApi = got.extend({
    prefixUrl: Config.KFK.HOST,
    isStream: false,
    throwHttpErrors: false, // If true 4XX and 5XX throw an error
    timeout: { 
        response: Number(Config.NM.TIMEOUT)
    }, // 10sec to timeout for response is the default
    decompress: true // accept-encoding header gzip
})

const ApiHeader = { 
    'Content-Type': 'application/json',
    // Accept: 'application/json',
    simple: 'false' 
}

export const kfk = {
    postRecords: async function(records: RecordType[]): Promise<void> {
        const response = request('api/pushRecords/' + Config.KFK.ENV, 'POST', { records }, { ...ApiHeader, 'authorization': 'Bearer ' + nmToken.token })
        if (((await response).error)) {
            console.log('Error posting counters to kfk')
        }
    },
    postError: async function(error: ErrorLogType): Promise<void> {
        const response = request('api/pushErrors/' + Config.KFK.ENV, 'POST', error, { ...ApiHeader, 'authorization': 'Bearer ' + nmToken.token })
        if (((await response).error)) {
            console.log('Error posting to kfk')
        }
    }
}

// PRIVATE FUNCTIONS

const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string): Promise<GenericResponse> => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as unknown as Response<GenericResponse>
    return response.body
}

