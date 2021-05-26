import mongoose from 'mongoose'
import OrganisationSchema from './schema'
import { IOrganisationDocument, IOrganisationModel } from './types'

export const OrganisationModel = mongoose.model<IOrganisationDocument, IOrganisationModel>(
  'organisation',
  OrganisationSchema
)
