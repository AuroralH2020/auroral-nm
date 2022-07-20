import { v4 as uuidv4 } from 'uuid'
import { IOrganisationDocument, IOrganisationUpdate, OrganisationStatus } from './types'

export async function updateOrganisation(this: IOrganisationDocument, data: IOrganisationUpdate): Promise<void> {
    this.name = data.name ? data.name : this.name
    this.businessId = data.businessId ? data.businessId : this.businessId
    this.location = data.location ? data.location : this.location
    this.skinColor = data.skinColor ? data.skinColor : this.skinColor
    this.avatar = data.avatar ? data.avatar : this.avatar
    this.notes = data.notes ? data.notes : this.notes
    await this.save()
}

export async function removeOrganisation(this: IOrganisationDocument): Promise<void> {
    this.name = this.name + '/' + uuidv4() // Organisationname/Unique
    this.businessId = ''
    this.location = ''
    this.avatar = ''
    this.status = OrganisationStatus.DELETED
    this.notes = ''
    this.hasNodes = []
    this.hasUsers = []
    this.hasContracts = []
    this.hasContractRequests = []
    this.knows = []
    this.knowsRequestsFrom = []
    this.knowsRequestsTo = []
    this.lastUpdated = new Date().getTime()
    await this.save()
}
