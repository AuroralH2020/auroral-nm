import mongoose from 'mongoose'
import { getRegistration, getAllRegistration, getDoc, createRegistration, findDuplicatesUser, findDuplicatesCompany } from './statics'
import { updateStatus } from './methods'
import { IRegistrationDocument, IRegistrationModel, RegistrationStatus, RegistrationType  } from './types'

const Schema = mongoose.Schema

const statusEnum = Object.values(RegistrationStatus)
const typesEnum = Object.values(RegistrationType)

const RegistrationSchema = new Schema<IRegistrationDocument, IRegistrationModel>({
    registrationId: { type: String, unique: true, required: true, index: true },
    invitationId: String,
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true }, // username/id in the app
    occupation: String,
    cid: String, // organisation ID -- CID
    companyName: String,
    companyLocation: String,  
    businessId: String,
    termsAndConditions: { type: Boolean, default: true },
    status: { type: RegistrationStatus, enum: statusEnum },
    type: { type: RegistrationType, enum: typesEnum },
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }
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
