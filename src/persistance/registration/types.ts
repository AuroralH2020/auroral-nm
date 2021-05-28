import { Document, Model } from 'mongoose'

export enum RegistrationStatus {
    OPEN = 'open', // Waiting for devOps to validate mail/organisation
    VERIFIED = 'verified', // Approved
    DECLINED = 'declined', // Rejected
    PENDING = 'pending' // Verification mail sent to user
}

export enum RegistrationType {
    COMPANY = 'newCompany',
    USER = 'newUser'
}

export interface IRegistration {
    registrationId: string
    // User data
    name: string,
    surname: string,
    email: string,
    occupation: string,
    // Organisation data
    // companyId: mongo id,
    cid: string,
    companyName: string,
    companyLocation: string,
    businessId?: string,
    termsAndConditions: boolean,
    status: RegistrationStatus,
    type: RegistrationType,
    lastUpdated?: number,
    created?: number
}

export interface IRegistrationPre {
    // User data
    name: string,
    surname: string,
    email: string,
    occupation: string,
    password: string, // Use to create hash in account
    // Organisation data
    // companyId: mongo id,
    cid?: string, // Needed if registering user to an organisation
    companyName?: string, // Needed if registering organisation
    companyLocation?: string, // Needed if registering organisation
    businessId?: string, // Needed if registering organisation
    termsAndConditions: boolean,
    status: RegistrationStatus,
    type: RegistrationType,
}

export interface IRegistrationPost {
    registrationId: string // Add during registration
    // User data
    name: string,
    surname: string,
    email: string,
    occupation: string,
    // Organisation data
    // companyId: mongo id,
    cid: string,
    companyName?: string,
    companyLocation?: string,
    businessId?: string,
    termsAndConditions: boolean,
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
    _getRegistrations: (
        this: IRegistrationModel
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