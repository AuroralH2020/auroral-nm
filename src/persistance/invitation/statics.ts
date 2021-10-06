import { v4 as uuidv4 } from 'uuid'
import { IInvitationDocument, IInvitationModel, IInvitation, InvitationType, IInvitationCreate, InvitationStatus } from './types'

export async function getDoc(
  this: IInvitationModel, invitationId: string
): Promise<IInvitationDocument> {
  const record = await this.findOne({ invitationId }).exec()
  if (record) {
    return record
  } else {
    throw new Error('Invitation not found')
  }
}

export async function getInvitation(
  this: IInvitationModel, invitationId: string
): Promise<IInvitation> {
  const record = await this.findOne({ invitationId }).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Invitation not found')
  }
}

export async function getAllInvitations(
  this: IInvitationModel, cid: string
): Promise<IInvitation[]> {
  const records = await this.find({ 'sentBy.cid': cid, type: InvitationType.USER }).lean().exec()
  if (records) {
    return records
  } else {
    throw new Error('Invitation not found')
  }
}

export async function setUsedInvitation(
  this: IInvitationModel, invitationId: string
): Promise<void> {
  await this.updateOne({ invitationId }, { $set: { used: true } }).lean().exec()
}

export async function setInvitationStatus(
  this: IInvitationModel, invitationId: string, status: InvitationStatus
): Promise<void> {
  await this.updateOne({ invitationId }, { $set: { status, updated: new Date().getTime() } }).lean().exec()
}

export async function createInvitation(
  this: IInvitationModel, data: IInvitationCreate
): Promise<IInvitationDocument> {
  const record = await this.create({
    ...data,
    invitationId: uuidv4()
  })
  if (record) {
    return record
  } else {
    throw new Error('Invitation not created')
  }
}
