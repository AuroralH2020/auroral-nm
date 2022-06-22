/**
 * DATA MODEL
 * Represents the external user records in MongoDB
 */
import mongoose from 'mongoose'
import ExternalUserSchema from './schema'
import { IExternalUserDocument, IExternalUserModel } from './types'

export const ExternalUserModel = mongoose.model<IExternalUserDocument, IExternalUserModel>(
  'externalUser',
  ExternalUserSchema
)
