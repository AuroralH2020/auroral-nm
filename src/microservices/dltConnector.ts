import got, { Method, Headers } from 'got'
import { JsonType } from '../types/misc-types'
import { Config } from '../config'
import { logger } from '../utils'
import { errorHandler } from '../utils/error-handler'
import { SmartContractItemType, SmartContractType, SmartContractUserType } from '../types/dlt-types'

// API DEFINITIONS
const contractApi = got.extend({
    prefixUrl: Config.DLT.CONTRACT_HOST + ':' + Config.DLT.CONTRACT_PORT + '/auroral/acl-test/',
    responseType: 'json',
    isStream: false,
    retry: 2, // Retries on failure N times
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: 30000, // 30sec to timeout
    decompress: true // accept-encoding header gzip
})

const manageApi = got.extend({
    prefixUrl: Config.DLT.MANAGE_HOST + ':' + Config.DLT.MANAGE_PORT + '/',
    // port: Config.DLT.MANAGE_PORT,
    responseType: 'json',
    isStream: false,
    retry: 2, // Retries on failure N times
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: 30000, // 30sec to timeout
    decompress: true // accept-encoding header gzip
})

const authApi = got.extend({
    prefixUrl: Config.DLT.AUTH_HOST + ':' + Config.DLT.AUTH_PORT + '/auth/realms/auroral/',
    responseType: 'json',
    isStream: false,
    retry: 2, // Retries on failure N times
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: 30000, // 30sec to timeout
    decompress: true // accept-encoding header gzip
})

const BasicApiHeader = { 
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
    simple: 'false' 
} 

// FUNCTIONS

export const dlt = {
    // Contract management
    createContract: async (token: string, contract: SmartContractType): Promise<void> => {
        try {
            await contractManageRequest('contract/propose', 'POST', contract, { ...BasicApiHeader, Authorization: 'Bearer ' + token }) 
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not created: ' + error.message)              
        }
    },
    rejectContract: async (token: string, ctid: string): Promise<void> => {
        try {
            await contractManageRequest('contract/reject/' + ctid, 'POST', {}, { ...BasicApiHeader, Authorization: 'Bearer ' + token }) 
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not rejected: ' + error.message)              
        }
    },
    acceptContract: async (token: string, ctid: string): Promise<void> => {
        try {
            await contractManageRequest('contract/accept/' + ctid, 'POST', {}, { ...BasicApiHeader, Authorization: 'Bearer ' + token })
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not accepted: ' + error.message)              
        }
    },
    removeContract: async (token: string, ctid: string): Promise<void> => {
        try {
            await contractManageRequest('contract/dissolve/' + ctid, 'DELETE', { 'contract_id': ctid }, { ...BasicApiHeader, Authorization: 'Bearer ' + token })
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not rejected: ' + error.message)              
        }
    },
    addContractItem: async (token: string, ctid: string, item: SmartContractItemType): Promise<void> => {
        try {
            await contractManageRequest('item/add/' + ctid, 'POST', item, { ...BasicApiHeader, Authorization: 'Bearer ' + token })
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract item not added: ' + error.message)              
        }
    },
    removeContractItem: async (token: string, ctid: string, oid: string): Promise<void> => {
        try {
            await contractManageRequest('item/delete', 'DELETE', { 'contract_id': ctid, 'object_id': oid }, { ...BasicApiHeader, Authorization: 'Bearer ' + token })
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract item not removed: ' + error.message)
        }
    },
    updateContractItem: async (token: string, ctid: string, item: SmartContractItemType): Promise<void> => {
        try {
            await contractManageRequest('item/update/' + ctid, 'POST', item, { ...BasicApiHeader, Authorization: 'Bearer ' + token })
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract item not updated: ' + error.message)
        }
    },
    // User management
    getUserByMail: async (mail: string): Promise<SmartContractUserType | null> => {
        try {
            const response = await manageRequest('users/' + mail, 'GET', undefined, BasicApiHeader) as unknown as SmartContractUserType
            return response
        } catch {
            return null
        }
    },
    createUser: async (user: { username: string, email: string, password: string, attributes: { cid: string } }): Promise<void> => {
        await manageRequest('users', 'POST', user, BasicApiHeader)
    },
    acceptUser: async (mail: string): Promise<void> => {
        await manageRequest('users/' + mail, 'PATCH', {}, BasicApiHeader)
    },
    deleteUser: async (mail: string): Promise<void> => {
        await manageRequest('users/' + mail, 'DELETE', {}, BasicApiHeader)
    }

}

// PRIVATE FUNCTIONS
const manageRequest = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string) => {
    const response = await manageApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}

const contractManageRequest = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string) => {
    // console.log('Endpoint: ' + endpoint)
    // console.log('Method: ' + method)
    // console.log('Headers: ' + JSON.stringify(headers))
    const response = await contractApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}

const authRequest = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string) => {
    const response = await authApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}
