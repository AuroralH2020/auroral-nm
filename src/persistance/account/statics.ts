import { IAccountDocument, IAccountModel, IAccountRegistrationPost, IAccountUI } from './types'

export async function getAccount(
  this: IAccountModel, username: string
): Promise<IAccountUI> {
  const record = await this.findOne({ username }, { passwordHash: 0, tempSecret: 0 }).lean().exec()
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
  const record = await this.findOne({ username, verified: true }, { passwordHash: 1 }).lean().exec()
  if (record) {
    return record.passwordHash
  } else {
    throw new Error('User not found or not verified')
  }
}

export async function getDoc(
  this: IAccountModel, username: string
): Promise<IAccountDocument> {
  const record = await this.findOne({ username }).exec()
  if (record) {
    return record
  } else {
    throw new Error('User not found')
  }
}

export async function createAccount(
    this: IAccountModel, data: IAccountRegistrationPost
  ): Promise<IAccountDocument> {
    return this.create(data)
  }

export async function verifyAccount(
  this: IAccountModel, username: string
): Promise<void> {
  await this.updateOne({ username }, { $set: { verified: true } }).lean().exec()
}

export async function isVerified(
  this: IAccountModel, username: string
): Promise<boolean> {
  const doc = await this.findOne({ username }, { verified: 1 }).lean().exec()
  if (doc && doc.verified) {
    return true
  } else {
    throw new Error('User not verified')
  }
}

export async function deleteAccount(
  this: IAccountModel, username: string
): Promise<void> {
  await this.deleteOne({ username }).lean().exec()
}
