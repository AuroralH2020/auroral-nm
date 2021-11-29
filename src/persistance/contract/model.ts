import mongoose from 'mongoose'
import ContractSchema from './schema'
import { IContractDocument, IContractModel } from './types'

export const ContractModel = mongoose.model<IContractDocument, IContractModel>(
  'contract',
  ContractSchema
)
