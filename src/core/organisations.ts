/**
 * Core functionality of ITEMS
 */

// Imports
import { errorHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { UserModel } from '../persistance/user/model'
import { AccountModel } from '../persistance/account/model'
import { removeOne } from './nodes'
import { IOrganisationDocument } from '../persistance/organisation/types'
import { ContractService } from '../core'
import { IAuditLocals } from '../types/locals-types'

// Functions

/**
 * Get Items
 */
 export const remove = async (organisation: IOrganisationDocument, uid: string, audit: IAuditLocals): Promise<void> => {
    try {
        const cid = organisation.cid

        // 1a - Remove contracts
        await Promise.all(organisation.hasContracts.map(async it => {
            await ContractService.removeOrgFromContract(it, cid, uid, audit)
        }))
        // 1b - Remove contract requests
        await Promise.all(organisation.hasContractRequests.map(async it => {
            await ContractService.rejectContractRequest(it, cid, uid, audit)
        }))

        // 2 - Remove nodes and items
        await Promise.all(organisation.hasNodes.map(async it => {
                await removeOne(it, cid)
            })
        )

        // 3 - Remove users & accounts
        await Promise.all(organisation.hasUsers.map(async it => {
                const userDoc = await UserModel._getDoc(it)
                await AccountModel._deleteAccount(userDoc.email) // remove first account to user proper mail
                await userDoc._removeUser()
            })
        )

        // 4 - Remove organisation
        await organisation._removeOrganisation()
    } catch (err) {
        const error = errorHandler(err)
        throw new Error(error.message)
    }
}

const captureError = (err: unknown): void => {
    const error = errorHandler(err)
    logger.error(error.message)
}
