import mongoose from 'mongoose'
import { getInvitation, getDoc, createInvitation, setUsedInvitation, setInvitationStatus } from './statics'
import { IInvitationDocument, IInvitationModel, InvitationType, InvitationStatus } from './types'

const Schema = mongoose.Schema

const invitationTypes = Object.values(InvitationType)

const InvitationSchema = new Schema<IInvitationDocument, IInvitationModel>({
    invitationId: { type: String, required: true, index: true },
    emailTo: { type: String, required: true }, // Invited person mail
    nameTo: { type: String, required: true }, // Invited company name or person name
    roles: [String], // When creating user, provides its initial roles
    sentBy: {
        cid: { type: String, required: true }, // Organisation inviting id
        organisation: String, // Organisation inviting name
        uid: { type: String, required: true }, // User inviting id
        email: { type: String, required: true } // Person inviting mail
    },
    used: { type: Boolean, default: false },
    type: { type: String, enum: invitationTypes },
    status: { type: String, default: InvitationStatus.PENDING },
    updated: { type: Number, default: new Date().getTime() },
    created: { type: Number, default: new Date().getTime() }
})

InvitationSchema.statics._getInvitation = getInvitation
InvitationSchema.statics._getDoc = getDoc
InvitationSchema.statics._createInvitation = createInvitation
InvitationSchema.statics._setUsedInvitation = setUsedInvitation
InvitationSchema.statics._setInvitationStatus = setInvitationStatus

// eslint-disable-next-line import/no-default-export
export default InvitationSchema
