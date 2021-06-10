/**
 * DATA MODEL
 * Represents the message records stored for tracking the usage in the nodes
 */
import mongoose from 'mongoose'
import RecordSchema from './schema'
import { IRecordDocument, IRecordModel } from './types'

export const RecordModel = mongoose.model<IRecordDocument, IRecordModel>(
  'record',
  RecordSchema
)
