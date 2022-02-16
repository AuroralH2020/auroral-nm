import { IAccountDocument, IAccountModel, IAccountRegistrationPost, IAccountUI } from './types'
import { MyError } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils'

export async function getAccount(
  this: IAccountModel, username: string
): Promise<IAccountUI> {
  const record = await this.findOne({ username: username.toLowerCase() }, { passwordHash: 0, tempSecret: 0 }).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('User not found')
  }
}

// get hash only if account is verified
export async function getHash(
  this: IAccountModel, username: string
): Promise<string> {
  const record = await this.findOne({ username: username.toLowerCase(), verified: true }, { passwordHash: 1 }).lean().exec()
  if (record) {
    return record.passwordHash
  } else {
    throw new MyError('User not found or not verified', HttpStatusCode.BAD_REQUEST)
  }
}

export async function getDoc(
  this: IAccountModel, username: string
): Promise<IAccountDocument> {
  const record = await this.findOne({ username: username.toLowerCase() }).exec()
  if (record) {
    return record
  } else {
    throw new Error('User not found')
  }
}

export async function getDocByUid(
  this: IAccountModel, uid: string
): Promise<IAccountDocument> {
  const record = await this.findOne({ uid }).exec()
  if (record) {
    return record
  } else {
    throw new Error('User not found')
  }
}

export async function createAccount(
    this: IAccountModel, data: IAccountRegistrationPost
  ): Promise<IAccountDocument> {
    return this.create({
      ...data,
      username: data.username.toLowerCase()
    })
  }

export async function verifyAccount(
  this: IAccountModel, username: string, uid: string
): Promise<void> {
  await this.updateOne({ username: username.toLowerCase() }, { $set: { verified: true, uid } }).lean().exec()
}

export async function isVerified(
  this: IAccountModel, username: string
): Promise<boolean> {
  const doc = await this.findOne({ username: username.toLowerCase() }, { verified: 1 }).lean().exec()
  if (doc && doc.verified) {
    return true
  } else {
    throw new Error('User not verified')
  }
}

export async function deleteAccount(
  this: IAccountModel, username: string
): Promise<void> {
  await this.deleteOne({ username: username.toLowerCase() }).lean().exec()
}
