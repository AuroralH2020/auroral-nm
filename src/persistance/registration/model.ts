import mongoose from 'mongoose'
import RegistrationSchema from './schema'
import { IRegistrationDocument, IRegistrationModel } from './types'

export const RegistrationModel = mongoose.model<IRegistrationDocument, IRegistrationModel>(
  'registration',
  RegistrationSchema
)
