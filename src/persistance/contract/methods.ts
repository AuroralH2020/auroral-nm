import { ContractStatus, IContractDocument, IContractUpdate } from './types'

export async function updateContract(this: IContractDocument, data: IContractUpdate): Promise<void> {
    this.description = data.description !== undefined ? data.description : this.description
    await this.save()
}

export async function removeContract(this: IContractDocument): Promise<void> {
    this.status = ContractStatus.DELETED
    this.lastUpdated = new Date().getTime()
    this.pendingOrganisations = []
    this.organisations = []
    this.items = []
    this.lastUpdated = new Date().getTime()
    await this.save()
}

export async function updateStatus(this: IContractDocument, status?: ContractStatus): Promise<void> {
    if (status === undefined) {
        this.status = this.pendingOrganisations.length > 0 ? ContractStatus.PENDING : ContractStatus.APPROVED
    } else {
        this.status = status
    }
    await this.save()
}
