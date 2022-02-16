import { v4 as uuidv4 } from 'uuid'
import { RolesEnum } from '../../types/roles'
import { IUserDocument, IUserUpdate, UserStatus, UserVisibility } from './types'

export async function updateUser(this: IUserDocument, data: IUserUpdate): Promise<void> {
    this.firstName = data.firstName ? data.firstName : this.firstName
    this.lastName = data.lastName ? data.lastName : this.lastName
    this.name = this.firstName + ' ' + this.lastName
    this.contactMail = data.contactMail ? data.contactMail.toLowerCase() : this.contactMail
    this.occupation = data.occupation ? data.occupation : this.occupation
    this.location = data.location ? data.location : this.location
    this.avatar = data.avatar ? data.avatar : this.avatar
    this.accessLevel = data.accessLevel !== undefined ? Number(data.accessLevel)  : this.accessLevel // AccessLevel from UI is 0-3
    this.lastUpdated = new Date().getTime()
    this.roles = data.roles ? data.roles : this.roles
    await this.save()
}

export async function updateUserRoles(this: IUserDocument, roles: RolesEnum[]): Promise<void> {
    this.roles = roles
    this.lastUpdated = new Date().getTime()
    await this.save()
}

export async function removeUser(this: IUserDocument): Promise<void> {
    // this.firstName
    // this.lastName
    this.name = ''
    this.email = this.email + '/' + uuidv4() // Username/Unique
    // this.contactMail
    // this.cid
    // this.occupation
    this.location = ''
    this.avatar = ''
    this.status = UserStatus.DELETED
    this.accessLevel = UserVisibility.PRIVATE
    this.roles = [RolesEnum.USER]
    // this.hasNotifications
    // this.hasAudits
    this.hasItems = []
    // this.hasContracts = []
    this.lastUpdated = new Date().getTime()
    // this.created
    await this.save()
}
