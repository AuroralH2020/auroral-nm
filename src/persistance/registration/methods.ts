import { IRegistrationDocument, RegistrationStatus } from './types'

export async function updateStatus(this: IRegistrationDocument, status: RegistrationStatus): Promise<void> {
    this.status = status
    this.lastUpdated = new Date().getTime()
    await this.save()
}
