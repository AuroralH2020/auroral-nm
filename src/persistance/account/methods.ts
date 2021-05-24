import crypto from 'crypto'
import { RolesEnum } from '../../types/roles'
import { IAccountDocument } from './types'

export async function updatePasswordHash(this: IAccountDocument, passwordHash: string): Promise<void> {
    this.passwordHash = passwordHash
    await this.save()
}

export async function updateTempSecret(this: IAccountDocument): Promise<string> {
    const newSecret = crypto.randomBytes(16).toString('base64')
    this.tempSecret = newSecret
    await this.save()
    return newSecret
}

export async function updateRoles(this: IAccountDocument, roles: RolesEnum[]): Promise<void> {
    this.roles = roles
    await this.save()
}
