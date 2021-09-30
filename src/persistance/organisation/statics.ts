import { IOrganisationDocument, IOrganisationModel, IOrganisationCreate, IOrganisationUI, OrganisationStatus, OrgConfiguration } from './types'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger } from '../../utils/logger'

export async function getOrganisation(
  this: IOrganisationModel, cid: string
): Promise<IOrganisationUI> {
  const record = await this.findOne(
    { cid, status: OrganisationStatus.ACTIVE }, 
    { hasNotifications: 0, hasAudits: 0 }
    ).lean().exec()
  if (record) {
    return record
  } else {
    logger.warn('Organisation not found')
    throw new MyError('Organisation not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getOrganisations(
  this: IOrganisationModel, cid: string, type: number, offset: number
): Promise<IOrganisationUI[]> {
  // Define variables and constants
  const LIMIT = 12 // max num of items when pagination active
  const query = { status: OrganisationStatus.ACTIVE }
  let record: IOrganisationUI[] = [] // final result
  // Retrieve all organisations
  if (type === 0) {
      record = await this.find(
        query, 
        { hasNotifications: 0, hasAudits: 0, hasUsers: 0, hasNodes: 0 }
        ).skip(offset).limit(LIMIT).lean()
      .exec()
  // Retrieve all friends
  } else if (type === 1) {
      const doc = await this.findOne({ cid }, { knows: 1 }).lean().exec()
      const friends = doc ? doc.knows : []
      record = await this.find({ cid: { $in: friends }, status: OrganisationStatus.ACTIVE }, { hasNotifications: 0, hasAudits: 0, hasNodes: 0 }).lean().exec()
    // Retrieve all NON friends
  } else if (type === 2) {
      const doc = await this.findOne({ cid }, { knows: 1 }).lean().exec()
      const friends = doc ? doc.knows : []
      record = await this.find({ cid: { $nin: [...friends, cid] }, status: OrganisationStatus.ACTIVE }, { hasNotifications: 0, hasAudits: 0, hasNodes: 0 }).lean().exec()
  } else {
      throw new Error('Wrong type number (organisations retrieval): ' + type)
  }
  if (record) {
    return record
  } else {
    logger.warn('Organisation not found')
    throw new MyError('Organisation not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getDoc(
  this: IOrganisationModel, cid: string
): Promise<IOrganisationDocument> {
  const record = await this.findOne({ cid,  status: OrganisationStatus.ACTIVE }).exec()
  if (record) {
    return record
  } else {
    logger.warn('Organisation not found')
    throw new MyError('Organisation not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function createOrganisation(
    this: IOrganisationModel, data: IOrganisationCreate
  ): Promise<IOrganisationDocument> {
    return this.create(data)
}

export async function findDuplicatesCompany(
  this: IOrganisationModel, name: string
): Promise<boolean> {
  // Look in ACTIVE organisations
  const record = await this.findOne({ name, status: { $ne: OrganisationStatus.DELETED } }).exec()
  if (record) {
    // Duplicates found
    return true
  } else {
    // Duplicates NOT found
    return false
  }
}

export async function getConfiguration(
  this: IOrganisationModel, cid: string
  ): Promise<OrgConfiguration> {
    const record = await this.findOne({ cid }, { skinColor: 1 }).exec()
    if (record) {
      return {
        skinColor: record.skinColor
      }
    } else {
      logger.warn('Organisation not found')
      throw new MyError('Organisation not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
    }
  }

/**
 * Add and remove 
 */

/**
 * Add a user to company hasUsers array
 * @param this 
 * @param cid 
 * @param uid 
 */
export async function addUserToCompany  (
  this: IOrganisationModel, cid: string, uid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $push: { hasUsers: uid } }).exec()
    if (!record.ok) {
      throw new Error('Error adding user to organisation')
    }
  }

/**
 * Remove a user from company hasUsers array
 * @param this 
 * @param cid 
 * @param uid 
 */
export async function removeUserFromCompany  (
  this: IOrganisationModel, cid: string, uid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $pull: { hasUsers: uid } }).exec()
    if (!record.ok) {
      throw new Error('Error removing user from organisation')
    }
  }

/**
 * Add node to company hasNodes array
 * @param this 
 * @param cid 
 * @param agid 
 */
export async function addNodeToCompany  (
  this: IOrganisationModel, cid: string, agid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $push: { hasNodes: agid } }).exec()
    if (!record.ok) {
      throw new Error('Error adding node to organisation')
    }
  }

/**
 * Remove a node from company hasNodes array
 * @param this 
 * @param cid 
 * @param agid 
 */
export async function removeNodeFromCompany  (
  this: IOrganisationModel, cid: string, agid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $pull: { hasNodes: agid } }).exec()
    if (!record.ok) {
      throw new Error('Error removing node from organisation')
    }
  }

/**
 * FRIENDSHIPS
 */

/**
 * Add incoming friend request
 * @param this 
 * @param cid 
 * @param friendCid 
 */
export async function addIncomingFriendReq  (
  this: IOrganisationModel, cid: string, friendCid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $addToSet: { knowsRequestsFrom: friendCid } }).exec()
    if (!record.ok) {
      throw new Error('Error adding friend request from ' + friendCid)
    }
  }

/**
 * Remove incoming friend request
 * @param this 
 * @param cid 
 * @param friendCid 
 */  
export async function delIncomingFriendReq  (
  this: IOrganisationModel, cid: string, friendCid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $pull: { knowsRequestsFrom: friendCid } }).exec()
    if (!record.ok) {
      throw new Error('Error removing friend request from ' + friendCid)
    }
  }

/**
 * Add outgoing friend request
 * @param this 
 * @param cid 
 * @param friendCid 
 */
export async function addOutgoingFriendReq  (
  this: IOrganisationModel, cid: string, friendCid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $addToSet: { knowsRequestsTo: friendCid } }).exec()
    if (!record.ok) {
      throw new Error('Error adding friend request to ' + friendCid)
    }
  }

/**
 * Cancel outgoing friend request
 * @param this 
 * @param cid 
 * @param friendCid 
 */
export async function delOutgoingFriendReq  (
  this: IOrganisationModel, cid: string, friendCid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $pull: { knowsRequestsTo: friendCid } }).exec()
    if (!record.ok) {
      throw new Error('Error removing friend request to ' + friendCid)
    }
  }

/**
 * Add a friendship
 * @param this
 * @param cid 
 * @param friendCid 
 */
export async function addFriendship  (
  this: IOrganisationModel, cid: string, friendCid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $addToSet: { knows: friendCid } }).exec()
    if (!record.ok) {
      throw new Error('Error adding friend ' + friendCid)
    }
  }

/**
 * Remove a friendship
 * @param this 
 * @param cid 
 * @param friendCid 
 */
export async function delFriendship  (
  this: IOrganisationModel, cid: string, friendCid: string
  ): Promise<void> {
    const record = await this.updateOne({ cid }, { $pull: { knows: friendCid } }).exec()
    if (!record.ok) {
      throw new Error('Error removing friend ' + friendCid)
    }
  }
