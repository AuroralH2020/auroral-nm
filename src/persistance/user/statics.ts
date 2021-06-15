import { RolesEnum } from '../../types/roles'
import { IUserDocument, IUserModel, IUserCreate, IUserUI, UserVisibility, UserStatus, IUserUIProfile } from './types'

export async function getUser(
  this: IUserModel, uid: string
): Promise<IUserUIProfile> {
  const record = await this.findOne(
    { uid }, 
    { hasNotifications: 0, hasAudits: 0, hasItems: 0, hasContracts: 0 }
    ).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('User not found')
  }
}

export async function getUsersByRole(
  this: IUserModel, role: RolesEnum
  ): Promise<IUserUI[]> {
    const record = await this.find({ roles: role }).lean().exec()
    if (record) {
      return record
    } else {
      throw new Error('User not found')
    }
  }

export async function getDoc(
  this: IUserModel, uid: string
): Promise<IUserDocument> {
  const record = await this.findOne({ uid }).exec()
  if (record) {
    return record
  } else {
    throw new Error('User not found')
  }
}

export async function getAllUsers(
  this: IUserModel, accessLevel: UserVisibility[], users: string[]
): Promise<IUserUI[]> {
  const record = await this.find(
    { uid: { $in: users }, accessLevel: { $in: accessLevel } },
    { name: 1,
      email: 1,
      contactMail: 1,
      uid: 1,
      cid: 1,
      occupation: 1,
      location: 1,
      avatar: 1,
      lastUpdated: 1,
      created: 1 }
    ).exec()
  if (record) {
    return record
  } else {
    throw new Error('User not found')
  }
}

export async function createUser(
    this: IUserModel, data: IUserCreate
  ): Promise<IUserDocument> {
    const newUser = {
      ...data,
      accessLevel: UserVisibility.PRIVATE,
      name: data.firstName + ' ' + data.lastName
    }
    return this.create(newUser)
}

export async function findDuplicatesUser(
  this: IUserModel, email: string
): Promise<boolean> {
  // Look in ACTIVE users
  const record = await this.findOne({ email, status: { $ne: UserStatus.DELETED } }).exec()
  if (record) {
    // Duplicates found
    return true
  } else {
    // Duplicates NOT found
    return false
  }
}
