import mongoose from 'mongoose'
import AccountSchema from './schema'
import { IAccountDocument, IAccountModel } from './types'

export const AccountModel = mongoose.model<IAccountDocument, IAccountModel>(
  'account',
  AccountSchema
)
