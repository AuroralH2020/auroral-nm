import { logger } from '../utils/logger'
import { errorHandler } from '../utils/error-handler'
import { Config } from '../config'
import { ContractItemType, IContract } from '../persistance/contract/types'
import { dlt } from '../microservices/dltConnector'
import { SmartContractType } from '../types/dlt-types'
import { generateSecret } from '../auth-server/auth-server'

export const createDLTContract = async (token: string, contract: IContract): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        const dlt_contract = {
            contract_id: contract.ctid,
            contract_type: contract.type,
            orgs: contract.organisations,
            items: contract.items.map((item) => {
                return {
                    object_id: item.oid,
                    org_id: item.cid,
                    write: item.rw,
                    enabled: item.enabled,
                    object_type: item.type
                } 
            })
        } as SmartContractType
        await dlt.createContract(token, dlt_contract)
        return
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT contract not created: ' + error.message)
    }
}
export const removeDLTContract = async (token: string, ctid: string): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        await dlt.removeContract(token, ctid)
        return
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT contract not removed: ' + error.message)
    }
}
export const rejectDLTContract = async (token: string, ctid: string): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        await dlt.rejectContract(token, ctid)
        return
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT contract not rejected: ' + error.message)
    }
}
export const acceptDLTContract = async (token: string, ctid: string): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        await dlt.acceptContract('token', ctid)
        return
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT contract not dissolved: ' + error.message)
    }
}
export const updateDLTContractItem = async (token: string, ctid: string, item: ContractItemType): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        const dlt_item = {
            object_id: item.oid,
            org_id: item.cid,
            write: item.rw,
            enabled: item.enabled,
            object_type: item.type
        }
        await dlt.updateContractItem(token, ctid, dlt_item)
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT contract item not updated: ' + error.message)
    }
}
export const addDLTContractItem = async (token: string, ctid: string, item: ContractItemType): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        const dlt_item = {
            object_id: item.oid,
            org_id: item.cid,
            write: item.rw,
            enabled: item.enabled,
            object_type: item.type
        }
        await dlt.addContractItem(token, ctid, dlt_item)
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT contract item not added: ' + error.message)
    }
}

export const removeDLTContractItem = async (token: string, ctid: string, oid: string): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        await dlt.removeContractItem(token, ctid, oid)
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT contract item not removed: ' + error.message)
    }
}

// User management

export const ensureUserExistsinDLT = async (username: string, cid: string, email: string): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        const registeredUser = await dlt.getUserByMail(email)
        if (!registeredUser) {
            // user does not exist
            await dlt.createUser({ username: username, email: email, password: generateSecret(), attributes: { cid } })
            await dlt.acceptUser(email)
        } else if (!registeredUser.enabled) {
            // user not accepted yet
            await dlt.acceptUser(email)
        }
        logger.debug('DLT user validation successful: ' + email)
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT user validation error: ' + error.message)
    }
}

export const deleteUserFromDlt = async (email: string): Promise<void> => {
    if (!Config.DLT.ENABLED) {
        return
    }
    try {
        await dlt.deleteUser(email)
    } catch (err) {
        // Only log error, do not throw
        const error = errorHandler(err)
        logger.error('DLT user deletion error: ' + error.message)
    }
}

