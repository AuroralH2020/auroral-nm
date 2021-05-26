import { v4 as uuidv4 } from 'uuid'
import { IUserDocument, IUserModel, IUserCreate, IUserUI, UserVisibility, UserStatus } from './types'

export async function getUser(
  this: IUserModel, uid: string
): Promise<IUserUI> {
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

export async function createUser(
    this: IUserModel, data: IUserCreate
  ): Promise<IUserDocument> {
    const newUser = {
      ...data,
      uid: uuidv4(),
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
