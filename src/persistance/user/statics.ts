import { RolesEnum } from '../../types/roles'
import { IUserDocument, IUserModel, IUserCreate, IUserUI, UserVisibility, UserStatus, IUserUIProfile } from './types'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { ItemType } from '../../persistance/item/types'

export async function getUser(
  this: IUserModel, uid: string
): Promise<IUserUIProfile> {
  const record = await this.findOne(
    { uid , status: UserStatus.ACTIVE }, 
    { hasNotifications: 0, hasAudits: 0, hasItems: 0, hasContracts: 0 }
    ).lean().exec()
  if (record) {
    return record
  } else {
    // logger.warn('User not found')
    throw new MyError('User not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.USER })
  }
}

export async function getUserByRole(
  this: IUserModel, role: RolesEnum
  ): Promise<IUserUI[]> {
    const record = await this.find({ roles: role, status: UserStatus.ACTIVE }).lean().exec()
    if (record) {
      return record
    } else {
      // logger.warn('User not found')
      throw new MyError('User not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.USER })
    }
  }

export async function getDoc(
  this: IUserModel, uid: string
): Promise<IUserDocument> {
  const record = await this.findOne({ uid, status: UserStatus.ACTIVE }).exec()
  if (record) {
    return record
  } else {
    // logger.warn('User not found')
    throw new MyError('User not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.USER })
  }
}

export async function getAllUsers(
  this: IUserModel, accessLevel: UserVisibility[], users: string[]
): Promise<IUserUI[]> {
  const record = await this.find(
    { uid: { $in: users }, accessLevel: { $in: accessLevel }, status: UserStatus.ACTIVE },
    { name: 1,
      email: 1,
      contactMail: 1,
      uid: 1,
      cid: 1,
      occupation: 1,
      location: 1,
      avatar: 1,
      lastUpdated: 1,
      roles: 1,
      created: 1 }
    ).exec()
  if (record) {
    return record
  } else {
    // logger.warn('User not found')
    throw new MyError('User not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.USER })
  }
}

export async function createUser(
    this: IUserModel, data: IUserCreate
  ): Promise<IUserDocument> {
    const newUser = {
      ...data,
      email: data.email.toLowerCase(),
      accessLevel: UserVisibility.PRIVATE,
      name: data.firstName + ' ' + data.lastName
    }
    return this.create(newUser)
}

export async function findDuplicatesUser(
  this: IUserModel, email: string
): Promise<boolean> {
  // Look in ACTIVE users
  const record = await this.findOne({ email: email.toLowerCase(), status: { $ne: UserStatus.DELETED } }).exec()
  if (record) {
    // Duplicates found
    return true
  } else {
    // Duplicates NOT found
    return false
  }
}

export async function addItemToUser(
  this: IUserModel, uid: string, oid: string
): Promise<void> {
  const record = await this.updateOne({ uid }, { $addToSet: { hasItems: oid } }).exec()
  if (!record.ok) {
    throw new Error('Error adding item to user')
  }
}

export async function removeItemFromUser(
  this: IUserModel, uid: string, oid: string
  ): Promise<void> {
    const record = await this.updateOne({ uid }, { $pull: { hasItems: oid } }).exec()
    if (!record.ok) {
      throw new Error('Error removing item from user')
    }
}

export async function addNodeToUser(
  this: IUserModel, uid: string, agid: string, type: ItemType
): Promise<void> {
  const record = await this.updateOne({ uid }, { $addToSet: { hasNodes: { agid, type } } }).exec()
  if (!record.ok) {
    throw new Error('Error adding node to user')
  }
}

export async function removeNodeFromUser(
  this: IUserModel, uid: string, agid: string, type: ItemType
  ): Promise<void> {
    const record = await this.updateOne({ uid }, { $pull: { hasNodes: { agid, type } } }).exec()
    if (!record.ok) {
      throw new Error('Error removing node from user')
    }
}

export async function count(
  this: IUserModel): Promise<number> {
    return this.countDocuments({ status: { $ne: UserStatus.DELETED } }).exec()
}

export async function search(
  this: IUserModel, cid: string, knows: string[],  text: string, limit: number, offset: number
  ): Promise<void> {
    const record = await this.aggregate([
      {
        '$match': {
          '$or': [
            {
              'cid': cid
            }, 
            {
              'cid': {
                '$in': knows
              },
              'accessLevel': {
                '$ne': 0
              }
            }
          ],
          'status': { '$ne': UserStatus.DELETED },
          'name': {
            '$regex': text,
            '$options': 'i'
          }
        }
      },
      {
        '$project': {
          'name': '$name',
          'id': '$uid',
          'type': 'User',
          '_id': 0
        }
      }
    ]).sort({ name: -1 }).skip(offset).limit(limit)
    .exec()
    if (record) {
      return record 
    } else {
      throw new Error('Error searching in users')
    }
}
