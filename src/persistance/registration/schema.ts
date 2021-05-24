import mongoose from 'mongoose'
import { getRegistration, getAllRegistration, getDoc, createRegistration, findDuplicatesUser, findDuplicatesCompany } from './statics'
import { updateStatus } from './methods'
import { IRegistrationDocument, IRegistrationModel, RegistrationStatus, RegistrationType  } from './types'

const Schema = mongoose.Schema

const statusEnum = Object.values(RegistrationStatus)
const typesEnum = Object.values(RegistrationType)

const RegistrationSchema = new Schema<IRegistrationDocument, IRegistrationModel>({
    registrationId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true }, // username/id in the app
    cid: String, // organisation ID -- CID
    companyName: String,
    companyLocation: String,  
    businessId: String,
    termsAndConditions: Boolean,
    status: { type: RegistrationStatus, enum: statusEnum },
    type: { type: RegistrationType, enum: typesEnum },
    lastUpdated: { type: Number, default: new Date().getTime() },
    created: { type: Number, default: new Date().getTime() }
})

RegistrationSchema.statics._getRegistration = getRegistration
RegistrationSchema.statics._getAllRegistration = getAllRegistration
RegistrationSchema.statics._getDoc = getDoc
RegistrationSchema.statics._createRegistration = createRegistration
RegistrationSchema.statics._findDuplicatesUser = findDuplicatesUser
RegistrationSchema.statics._findDuplicatesCompany = findDuplicatesCompany

RegistrationSchema.methods._updateStatus = updateStatus

// eslint-disable-next-line import/no-default-export
export default RegistrationSchema
