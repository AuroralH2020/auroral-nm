import { Document, Model } from 'mongoose'
import { RolesEnum } from '../../types/roles'

export enum RegistrationStatus {
    OPEN = 'open', // Waiting for devOps to validate mail/organisation
    VERIFIED = 'verified', // Approved
    DECLINED = 'declined', // Rejected
    PENDING = 'pending', // Verification mail sent to user
    RESENDING = 'resending', // Same as pending, mail is sent again and registration status remains pending
    MASTER_VERIFICATION = 'masterVerification' // Platform admin validates an account
}

export enum RegistrationType {
    COMPANY = 'newCompany',
    USER = 'newUser'
}

// Data model for MONGO
export interface IRegistration {
    type: RegistrationType,
    registrationId: string
    name: string,
    surname: string,
    email: string,
    companyName: string,
    companyLocation: string,
    businessId?: string,
    occupation: string,
    cid: string,
    roles: RolesEnum[],
    termsAndConditions: boolean,
    status: RegistrationStatus,
    invitationId: string,
    lastUpdated: number,
    created: number
}

// Data model to be used in backend
export type IRegisType<T> = T extends RegistrationType.COMPANY ? IRegistrationCompany : IRegistrationUser

interface IRegis {
    type: RegistrationType,
    registrationId: string
    name: string,
    surname: string,
    email: string,
    occupation: string,
    cid: string,
    termsAndConditions: boolean,
    status: RegistrationStatus,
    invitationId: string,
    lastUpdated: number,
    created: number
}

export interface IRegistrationUser extends IRegis {
    roles: RolesEnum[]
}

interface IRegistrationCompany extends IRegis{
    companyName: string,
    companyLocation: string,
    businessId?: string,
}

// Data receive from UI when posting new registration
export interface IRegistrationPost {
    invitationId: string, // Obligatory for users only
    registrationId: string // Add during registration
    // User data
    name: string,
    surname: string,
    email: string,
    occupation: string,
    password: string, // Use to create hash in account
    // Organisation data
    // companyId: mongo id,
    cid: string,
    companyName?: string,
    companyLocation?: string,
    businessId?: string,
    roles: RolesEnum[],
    status: RegistrationStatus,
    type: RegistrationType,
}

export interface IRegistrationDocument extends IRegistration, Document {
    _updateStatus: (this: IRegistrationDocument, status: string) => Promise<void>;
}

export interface IRegistrationModel extends Model<IRegistrationDocument> {
    _getRegistration: (
        this: IRegistrationModel,
        registrationId: string
    ) => Promise<IRegistration>
    _getAllRegistration: (
        this: IRegistrationModel
    ) => Promise<IRegistration[]>
    _getAllCompanyTypeRegistration: (
        this: IRegistrationModel,
        offset: number,
        limit: number
    ) => Promise<IRegistration[]>
    _getDoc: (
        this: IRegistrationModel,
        registrationId: string
    ) => Promise<IRegistrationDocument>
    _createRegistration: (
        this: IRegistrationModel,
        data: IRegistrationPost
    ) => Promise<IRegistrationDocument>
    _findDuplicatesUser: (
        this: IRegistrationModel,
        email: string
    ) => Promise<boolean>
    _findDuplicatesCompany: (
        this: IRegistrationModel,
        companyName: string
    ) => Promise<boolean>
}
