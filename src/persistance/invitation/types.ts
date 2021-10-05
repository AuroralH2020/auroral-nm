import { Document, Model } from 'mongoose'

export enum InvitationType {
    COMPANY = 'newCompany',
    USER = 'newUser'
}

export enum InvitationStatus {
    PENDING = 'Pending',
    DONE = 'Done',
    FAILED = 'Failed'
}

export interface IInvitation {
    invitationId: string,
    emailTo: string, // Invited person mail
    nameTo: string, // Invited company name or person name
    sentBy: {
        cid: string, // Organisation inviting id
        organisation: string, // Organisation inviting mail
        uid: string, // User inviting ID
        email: string // Person inviting mail
    },
    used: boolean,
    type: InvitationType,
    status: InvitationStatus,
    updated: number,
    created: number
}

export interface IInvitationPre {
    emailTo: string, // Invited person mail
    nameTo: string, // Invited company name or person name
    type: InvitationType
}

export interface IInvitationCreate {
    emailTo: string, // Invited person mail
    nameTo: string, // Invited company name or person name
    type: InvitationType,
    sentBy: {
        cid: string, // Organisation inviting id
        organisation: string, // Organisation inviting mail
        uid: string, // User inviting ID
        email: string // Person inviting mail
    }
}

export interface IInvitationDocument extends IInvitation, Document{} 

export interface IInvitationModel extends Model<IInvitationDocument> {
    _getInvitation: (
        this: IInvitationModel,
        invitationId: string
    ) => Promise<IInvitation>
    _getDoc: (
        this: IInvitationModel,
        invitationId: string
    ) => Promise<IInvitationDocument>
    _createInvitation: (
        this: IInvitationModel,
        data: IInvitationCreate
    ) => Promise<IInvitationDocument>
    _setUsedInvitation: (
        this: IInvitationModel,
        invitationId: string
    ) => Promise<void>
    _setInvitationStatus: (
        this: IInvitationModel,
        invitationId: string,
        status: InvitationStatus
    ) => Promise<void>
}
