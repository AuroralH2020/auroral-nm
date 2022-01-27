import mongoose from 'mongoose'
import SessionSchema from './schema'
import { ISessionDocument, ISessionModel } from './types'

export const SessionModel = mongoose.model<ISessionDocument, ISessionModel>(
  'session',
  SessionSchema
)
