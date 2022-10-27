import got, { Method, Headers } from 'got'
import { JsonType, XmppNotificationTypes } from '../types/misc-types'
import { Config } from '../config'
import { HttpStatusCode, logger } from '../utils'
import { errorHandler, MyError } from '../utils/error-handler'
import { ContractItemType, IContract, IContractItemUpdate } from '../persistance/contract/types'

// CONSTANTS 

// TBD add DLT URL
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
    simple: 'false' 
    // TBD? ADD AUTH
} 

// FUNCTIONS

export const dlt = {
    createContract: async (cid: string, contract: IContract): Promise<void> => {
        if (!Config.DLT.ENABLED) {
            return
        }
        try {
            await request('/api/createContract', 'POST', contract, ApiHeader) 
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not created: ' + error.message)              
        }
    },
    dissolveContract: async (cid: string, ctid: string): Promise<void> => {
        if (!Config.DLT.ENABLED) {
            return
        }
        try {
            await request('/api/dissolveContract', 'POST', { ctid }, ApiHeader)
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not dissolved: ' + error.message)              
        }
    },
    getContractByID: async (cid: string, ctid: string): Promise<IContract> => {
        if (!Config.DLT.ENABLED) {
            throw new MyError('DLT not enabled', HttpStatusCode.INTERNAL_SERVER_ERROR)
        }
        try {
            const contract = await request('/api/getContractByID', 'POST', { ctid }, ApiHeader) as IContract
            return contract
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not found: ' + error.message)
            throw new MyError('DLT contract not found: ' + error.message, HttpStatusCode.NOT_FOUND)         
        }
    },
    getContractIDs: async (cid: string): Promise<string[]> => {
        if (!Config.DLT.ENABLED) {
            throw new MyError('DLT not enabled', HttpStatusCode.INTERNAL_SERVER_ERROR)
        }
        try {
            const contractIDs = await request('/api/getContractIDs', 'POST', {}, ApiHeader) as string[]
            return contractIDs
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not found: ' + error.message)
            throw new MyError('DLT contract not found: ' + error.message, HttpStatusCode.NOT_FOUND)        
        }
    },
    getContracts: async (cid: string): Promise<IContract[]> => {
        if (!Config.DLT.ENABLED) {
            throw new MyError('DLT not enabled', HttpStatusCode.INTERNAL_SERVER_ERROR)
        }
        try {
            const contracts = await request('/api/getContracts', 'POST', {}, ApiHeader) as IContract[]
            return contracts
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contracts not found: ' + error.message)
            throw new MyError('DLT contracts not found: ' + error.message, HttpStatusCode.NOT_FOUND)        
        }
    },
    acceptContract: async (cid: string, ctid: string): Promise<void> => {
        if (!Config.DLT.ENABLED) {
            return
        }
        try {
            await request('/api/acceptContract', 'POST', { ctid }, ApiHeader)
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not accepted: ' + error.message)              
        }
    },
    rejectContract: async (cid: string, ctid: string): Promise<void> => {
        if (!Config.DLT.ENABLED) {
            return
        }
        try {
            await request('/api/rejectContract', 'POST', { ctid }, ApiHeader)
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract not rejected: ' + error.message)              
        }
    },
    updateContractItem: async (cid: string, ctid: string, item: IContractItemUpdate & { oid: string }): Promise<void> => {
        if (!Config.DLT.ENABLED) {
            return
        }
        try {
            await request('/api/updateContractItem', 'POST', { ctid, item }, ApiHeader)
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract item not updated: ' + error.message)              
        }
    },
    deleteContractItem: async (cid: string, ctid: string, oid: string): Promise<void> => {
        if (!Config.DLT.ENABLED) {
            return
        }
        try {
            await request('/api/deleteContractItem', 'POST', { ctid, oid }, ApiHeader)
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract item not deleted: ' + error.message)              
        }
    },
    addContractItem: async (cid: string, ctid: string, item: ContractItemType): Promise<void> => {
        if (!Config.DLT.ENABLED) {
            return
        }
        try {
            await request('/api/addContractItem', 'POST', { ctid, item }, ApiHeader)
            return
        } catch (err) {
            const error = errorHandler(err)
            logger.error('DLT contract item not added: ' + error.message)              
        }
    },

}

// PRIVATE FUNCTIONS
const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string) => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}
