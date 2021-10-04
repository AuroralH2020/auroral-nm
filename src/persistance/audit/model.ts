import mongoose from 'mongoose'
import AuditSchema from './schema'
import { IAuditDocument, IAuditModel } from './types'

export const AuditModel = mongoose.model<IAuditDocument, IAuditModel>(
  'audit',
  AuditSchema
)
