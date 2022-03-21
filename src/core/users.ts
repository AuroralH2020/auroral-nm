/**
 * Core functionality of USERS
 */

// Imports
import { MyError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { IUserDocument } from '../persistance/user/types'
import { RolesEnum } from '../types/roles'
import { HttpStatusCode } from '../utils'

// Functions

/**
 * Validate roles
 */
 export const checkRoles =  (myUser: IUserDocument, user: IUserDocument, roles: RolesEnum[]): void => {
    // Validate that the user is an admin
    if (!myUser.roles.includes(RolesEnum.ADMIN)) {
        logger.warn('User has to be an admin to update roles')
        throw new MyError('User has to be an admin to update roles', HttpStatusCode.FORBIDDEN)
    }
    // Test if updating user from own company
    if (myUser.cid !== user.cid) {
        logger.warn('You are not allowed to update this users roles')
        throw new MyError('You are not allowed to update this users roles', HttpStatusCode.FORBIDDEN)
    }

    // Check which roles are added/removed
    const diff = findDifferentRoles(user.roles, roles)

    // Validate at least one user with role admin remains
    if (myUser.uid === user.uid && diff.removed.includes(RolesEnum.ADMIN)) {
        logger.warn('User cannot remove admin from from itself')
        throw new MyError('User cannot remove admin from from itself', HttpStatusCode.FORBIDDEN)
    }

    // Validate we do not remove 'ItemOwner' related roles if user hasItems
    if (user.hasItems.length >= 1 && removingItemOwnerRoles(diff.removed)) {
        logger.warn('User that has items cannot remove an itemOwner roles')
        throw new MyError('User that has items cannot remove an itemOwner roles', HttpStatusCode.FORBIDDEN)
    }
    if (user.hasNodes.length >= 1 && diff.removed.includes(RolesEnum.DEV_OWNER)) {
        logger.warn('User that is default Device owner in some node needs to have device owner role')
        throw new MyError('User that is default Device owner in some node needs to have device owner role', HttpStatusCode.FORBIDDEN)
    }
    if (user.hasNodes.length >= 1 && diff.removed.includes(RolesEnum.SERV_PROVIDER)) {
        logger.warn('User that is default Service owner in some node needs to have Service provider role')
        throw new MyError('User that is default Service owner in some node needs to have Service provider role', HttpStatusCode.FORBIDDEN)
    }

    // Validate at least one IoTOperator if company hasContracts
    // TBD
 }

 // Private functions

 const findDifferentRoles = (newRoles: RolesEnum[], oldRoles: RolesEnum[]): { added: RolesEnum[], removed: RolesEnum[]} => {
    const removed = newRoles.filter(it => !oldRoles.includes(it))
    const added = oldRoles.filter(it => !newRoles.includes(it))
    return {
        added, removed
    }
 }

 const removingItemOwnerRoles = (roles: RolesEnum[]): boolean => {
    return (roles.includes(RolesEnum.DEV_OWNER) || roles.includes(RolesEnum.SERV_PROVIDER))
 }
