import mongoose from 'mongoose'
import InvitationSchema from './schema'
import { IInvitationDocument, IInvitationModel } from './types'

export const InvitationModel = mongoose.model<IInvitationDocument, IInvitationModel>(
  'invitation',
  InvitationSchema
)
