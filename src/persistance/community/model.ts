import mongoose from 'mongoose'
import CommunitySchema from './schema'
import { ICommunityDocument, ICommunityModel } from './types'

export const CommunityModel = mongoose.model<ICommunityDocument,  ICommunityModel>(
  'community',
  CommunitySchema
)
