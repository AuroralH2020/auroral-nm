import mongoose from 'mongoose'
import ItemSchema from './schema'
import { IItemDocument, IItemModel } from './types'

export const ItemModel = mongoose.model<IItemDocument, IItemModel>(
  'item',
  ItemSchema
)
