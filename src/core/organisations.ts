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

// Functions

/**
 * Get Items
 */
 export const remove = async (organisation: IOrganisationDocument): Promise<void> => {
    try {
        const cid = organisation.cid

        // 1 - Remove contracts
        // TBD

        // 2 - Remove nodes and items
        await Promise.all(organisation.hasNodes.map(async it => {
                await removeOne(it, cid)
            })
        ).catch(captureError)

        // 3 - Remove users & accounts
        await Promise.all(organisation.hasUsers.map(async it => {
                const userDoc = await UserModel._getDoc(it)
                await AccountModel._deleteAccount(userDoc.email) // remove first account to user proper mail
                await userDoc._removeUser()
            })
        ).catch(captureError)

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
