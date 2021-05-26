import mongoose from 'mongoose'
import UserSchema from './schema'
import { IUserDocument, IUserModel } from './types'

export const UserModel = mongoose.model<IUserDocument, IUserModel>(
  'user',
  UserSchema
)
