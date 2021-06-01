import mongoose from 'mongoose'
import NodeSchema from './schema'
import { INodeDocument, INodeModel } from './types'

export const NodeModel = mongoose.model<INodeDocument, INodeModel>(
  'node',
  NodeSchema
)
