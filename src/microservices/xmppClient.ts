import got, { Method, Headers } from 'got'
import { JsonType, XmppNotificationTypes } from '../types/misc-types'
import { Config } from '../config'
import { logger } from '../utils'
import { errorHandler } from '../utils/error-handler'
import { signMessage } from '../auth-server/auth-server'

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
    simple: 'false' 
} 

// FUNCTIONS

export const xmpp = {
    notifyPrivacy: async (agid?: string): Promise<void> => {
        if (agid) {
            try {
                const payload = buildXmppMessageBody(agid, XmppNotificationTypes.PRIVACY, '')
                const bodyMessage: {payload: any, signature?: string} = { payload }
                if (Config.NODE_ENV === 'production') {
                    try {
                        const signature = await signMessage(JSON.stringify(payload)) 
                        bodyMessage.signature = signature
                    } catch (error) { 
                        logger.error('Failed to sign xmpp message - sending without signature')
                        // Sending without signature 
                    }
                }
                await request(agid, 'POST', bodyMessage, ApiHeader)
                logger.debug('XMPP notif [' + XmppNotificationTypes.PRIVACY + '] sent to: ' + agid)
            } catch (err) {
                const error = errorHandler(err)
                logger.error('XMPP notif [' + XmppNotificationTypes.PRIVACY + '] not sent: ' + agid + ' [' + error.message + ']')              
            }
        }
    },
    notifyPartnersChanged: async (agid?: string): Promise<void> => {
        if (agid) {
            try {
                const payload = buildXmppMessageBody(agid, XmppNotificationTypes.PARTNERS, '')
                const bodyMessage: {payload: any, signature?: string} = { payload }
                if (Config.NODE_ENV === 'production') {
                    try {
                        const signature = await signMessage(JSON.stringify(payload)) 
                        bodyMessage.signature = signature
                    } catch (error) { 
                        logger.error('Failed to sign xmpp message - sending without signature')
                        // Sending without signature 
                    }
                }
                await request(agid, 'POST', bodyMessage, ApiHeader)
                logger.debug('XMPP notif [' + XmppNotificationTypes.PARTNERS + '] sent to: ' + agid)
            } catch (err) {
                const error = errorHandler(err)
                logger.error('XMPP notif [' + XmppNotificationTypes.PARTNERS + '] not sent: ' + agid + ' [' + error.message + ']')              
            }
        }
    },
    notifyContractCreated: async (agid: string, body: JsonType): Promise<void> => {
        try {
            const payload = buildXmppMessageBody(agid, XmppNotificationTypes.CONTRACT_CREATE, JSON.stringify(body))
            const bodyMessage: {payload: any, signature?: string} = { payload }
            if (Config.NODE_ENV === 'production') {
                try {
                    const signature = await signMessage(JSON.stringify(payload)) 
                    bodyMessage.signature = signature
                } catch (error) { 
                    logger.error('Failed to sign xmpp message - sending without signature')
                    // Sending without signature 
                }
            }
            await request(agid, 'POST', bodyMessage, ApiHeader)
            logger.debug('XMPP notif [' + XmppNotificationTypes.CONTRACT_CREATE + '] sent to: ' + agid)
        } catch (err) {
            const error = errorHandler(err)
            logger.error('XMPP notif [' + XmppNotificationTypes.CONTRACT_CREATE + '] not sent: ' + agid + ' [' + error.message + ']')              
        }
    },
    notifyContractRemoved: async (agid: string, body: JsonType): Promise<void> => {
        try {
            const payload = buildXmppMessageBody(agid, XmppNotificationTypes.CONTRACT_REMOVE, JSON.stringify(body))
            const bodyMessage: {payload: any, signature?: string} = { payload }
            if (Config.NODE_ENV === 'production') {
                try {
                    const signature = await signMessage(JSON.stringify(payload)) 
                    bodyMessage.signature = signature
                } catch (error) { 
                    logger.error('Failed to sign xmpp message - sending without signature')
                    // Sending without signature 
                }
            }
            await request(agid, 'POST', bodyMessage, ApiHeader)
            logger.debug('XMPP notif [' + XmppNotificationTypes.CONTRACT_REMOVE + '] sent to: ' + agid)
        } catch (err) {
            const error = errorHandler(err)
            logger.error('XMPP notif [' + XmppNotificationTypes.CONTRACT_REMOVE + '] not sent: ' + agid + ' [' + error.message + ']')              
        }
    },
    notifyContractItemUpdate: async (agid: string, body: JsonType): Promise<void> => {
        try {
            const payload = buildXmppMessageBody(agid, XmppNotificationTypes.CONTRACT_ITEM_UPDATE, JSON.stringify(body))
            const bodyMessage: {payload: any, signature?: string} = { payload }
            if (Config.NODE_ENV === 'production') {
                try {
                    const signature = await signMessage(JSON.stringify(payload)) 
                    bodyMessage.signature = signature
                } catch (error) { 
                    logger.error('Failed to sign xmpp message - sending without signature')
                    // Sending without signature 
                }
            }
            await request(agid, 'POST', bodyMessage, ApiHeader)
            logger.debug('XMPP notif [' + XmppNotificationTypes.CONTRACT_ITEM_UPDATE + '] sent to: ' + agid)
        } catch (err) {
            const error = errorHandler(err)
            logger.error('XMPP notif [' + XmppNotificationTypes.CONTRACT_ITEM_UPDATE + '] not sent: ' + agid + ' [' + error.message + ']')              
        }
    },
    notifyContractItemRemoved: async (agid: string, body: JsonType): Promise<void> => {
        try {
            const payload = buildXmppMessageBody(agid, XmppNotificationTypes.CONTRACT_ITEM_REMOVE, JSON.stringify(body))
            const bodyMessage: {payload: any, signature?: string} = { payload }
            if (Config.NODE_ENV === 'production') {
                try {
                    const signature = await signMessage(JSON.stringify(payload)) 
                    bodyMessage.signature = signature
                } catch (error) { 
                    logger.error('Failed to sign xmpp message - sending without signature')
                    // Sending without signature 
                }
            }
            await request(agid, 'POST', bodyMessage, ApiHeader)
            logger.debug('XMPP notif [' + XmppNotificationTypes.CONTRACT_ITEM_REMOVE + '] sent to: ' + agid)
        } catch (err) {
            const error = errorHandler(err)
            logger.error('XMPP notif [' + XmppNotificationTypes.CONTRACT_ITEM_REMOVE + '] not sent: ' + agid + ' [' + error.message + ']')              
        }
    }
}

// PRIVATE FUNCTIONS

const buildXmppMessageBody = function(destinationOid: string, nid: string, body: string) { 
    return {
        messageType: 1,
        requestId: 0,
        sourceOid: 'auroral-dev-user',
        destinationOid,
        requestBody: body,
        requestOperation: 12,
        attributes: { nid },
        parameters: {} 
    }
}

const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string) => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as JsonType
    return response.body
}
