import { IRegistrationDocument, IRegistrationModel, IRegistrationPost, IRegistration, RegistrationStatus } from './types'

export async function getDoc(
  this: IRegistrationModel, registrationId: string
): Promise<IRegistrationDocument> {
  const record = await this.findOne({ registrationId }).exec()
  if (record) {
    return record
  } else {
    throw new Error('Registration not found')
  }
}

export async function getRegistration(
  this: IRegistrationModel, registrationId: string
): Promise<IRegistration> {
  const record = await this.findOne({ registrationId }, { passwordHash: 0 }).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Registration not found')
  }
}

export async function getAllRegistration(
  this: IRegistrationModel
): Promise<IRegistration[]> {
  const record = await this.find({}).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Registration not found')
  }
}

export async function createRegistration(
  this: IRegistrationModel, data: IRegistrationPost
): Promise<IRegistrationDocument> {
  const record = await this.create(data)
  if (record) {
    return record
  } else {
    throw new Error('Registration not created')
  }
}

export async function findDuplicatesUser(
  this: IRegistrationModel, email: string
): Promise<boolean> {
  const record = await this.findOne({ email, status: { $ne: RegistrationStatus.DECLINED } }).exec()
  if (record) {
    // Duplicates found
    return true
  } else {
    // Duplicates NOT found
    return false
  }
}

export async function findDuplicatesCompany(
  this: IRegistrationModel, companyName: string
): Promise<boolean> {
  const record = await this.findOne({ companyName, status: { $ne: RegistrationStatus.DECLINED } }).exec()
  if (record) {
    // Duplicates found
    return true
  } else {
    // Duplicates NOT found
    return false
  }
}
