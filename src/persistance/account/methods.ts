import crypto from 'crypto'
import { RolesEnum } from '../../types/roles'
import { IAccountDocument } from './types'

export async function updatePasswordHash(this: IAccountDocument, passwordHash: string): Promise<void> {
    this.passwordHash = passwordHash
    this.lastUpdated = new Date().getTime()
    await this.save()
}

export async function updateTempSecret(this: IAccountDocument): Promise<string> {
    const newSecret = crypto.randomBytes(16).toString('base64')
    this.tempSecret = newSecret
    this.lastUpdated = new Date().getTime()
    await this.save()
    return newSecret
}

export async function updateRoles(this: IAccountDocument, roles: RolesEnum[]): Promise<void> {
    this.roles = roles
    this.lastUpdated = new Date().getTime()
    await this.save()
}
