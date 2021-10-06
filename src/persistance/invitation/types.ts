import { Document, Model } from 'mongoose'
import { RolesEnum } from '../../types/roles'

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
    roles?: RolesEnum[], // Mandatory when creating a new User
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
    roles?: RolesEnum[], // Mandatory when creating a new User
    type: InvitationType
}

export interface IInvitationCreate {
    emailTo: string, // Invited person mail
    nameTo: string, // Invited company name or person name
    roles?: RolesEnum[], // Mandatory when creating a new User
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
    _getAllInvitations: (
        this: IInvitationModel,
        cid: string
    ) => Promise<IInvitation[]>
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
