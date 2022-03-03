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
import { ContractService, OrganisationService } from '../core'
import { IAuditLocals } from '../types/locals-types'
import { OrganisationModel } from '../persistance/organisation/model'

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
        // 2a - Remove partnerships
        await Promise.all(organisation.knows.map(async it => {
            OrganisationModel._delFriendship(it, cid)
            OrganisationModel._delFriendship(cid, it)
        }))
        // 2a - Remove partnerships from requests
         await Promise.all(organisation.knowsRequestsFrom.map(async it => {
            OrganisationModel._delFriendship(it, cid)
            OrganisationModel._delIncomingFriendReq(cid, it)
        }))
        // 2c - Remove partnerships to requests
         await Promise.all(organisation.knowsRequestsTo.map(async it => {
            OrganisationModel._delIncomingFriendReq(it, cid)
            OrganisationModel._delOutgoingFriendReq(cid, it)
        }))

        // 3 - Remove nodes and items
        await Promise.all(organisation.hasNodes.map(async it => {
                await removeOne(it, cid)
            })
        )

        // 4 - Remove users & accounts
        await Promise.all(organisation.hasUsers.map(async it => {
                const userDoc = await UserModel._getDoc(it)
                await AccountModel._deleteAccount(userDoc.email) // remove first account to user proper mail
                await userDoc._removeUser()
            })
        )

        // 5 - Remove organisation
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
