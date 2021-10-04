import { IRegistrationDocument, IRegistrationModel, IRegistrationPost, IRegistration, RegistrationStatus } from './types'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger } from '../../utils/logger'

export async function getDoc(
  this: IRegistrationModel, registrationId: string
): Promise<IRegistrationDocument> {
  const record = await this.findOne({ registrationId }).exec()
  if (record) {
    return record
  } else {
    // logger.warn('Registration not found')
    throw new MyError('Registration not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getRegistration(
  this: IRegistrationModel, registrationId: string
): Promise<IRegistration> {
  const record = await this.findOne({ registrationId }, { passwordHash: 0 }).lean().exec()
  if (record) {
    return record
  } else {
    // logger.warn('Registration not found')
    throw new MyError('Registration not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getAllRegistration(
  this: IRegistrationModel
): Promise<IRegistration[]> {
  const record = await this.find({}).lean().exec()
  if (record) {
    return record
  } else {
    // logger.warn('Registration not found')
    throw new MyError('Registration not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
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
  // Look in pending and open registrations
  const record = await this.findOne({ email, status: { $in: [RegistrationStatus.OPEN, RegistrationStatus.PENDING] } }).exec()
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
  // Look in pending and open registrations
  const record = await this.findOne({ companyName, status: { $in: [RegistrationStatus.OPEN, RegistrationStatus.PENDING] } }).exec()
  if (record) {
    // Duplicates found
    return true
  } else {
    // Duplicates NOT found
    return false
  }
}
