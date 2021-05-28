import { v4 as uuidv4 } from 'uuid'
import { IInvitationDocument, IInvitationModel, IInvitation, IInvitationCreate } from './types'

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

export async function setUsedInvitation(
  this: IInvitationModel, invitationId: string
): Promise<void> {
  await this.updateOne({ invitationId }, { $set: { used: true } }).lean().exec()
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