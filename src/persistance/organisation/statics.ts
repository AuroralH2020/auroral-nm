import { IOrganisationDocument, IOrganisationModel, IOrganisationCreate, IOrganisationUI, OrganisationStatus } from './types'

export async function getOrganisation(
  this: IOrganisationModel, cid: string
): Promise<IOrganisationUI> {
  const record = await this.findOne(
    { cid }, 
    { hasNotifications: 0, hasAudits: 0, hasUsers: 0, hasNodes: 0 }
    ).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Organisation not found')
  }
}

export async function getDoc(
  this: IOrganisationModel, cid: string
): Promise<IOrganisationDocument> {
  const record = await this.findOne({ cid }).exec()
  if (record) {
    return record
  } else {
    throw new Error('Organisation not found')
  }
}

export async function createOrganisation(
    this: IOrganisationModel, data: IOrganisationCreate
  ): Promise<IOrganisationDocument> {
    return this.create(data)
}

export async function findDuplicatesCompany(
  this: IOrganisationModel, name: string
): Promise<boolean> {
  // Look in ACTIVE organisations
  const record = await this.findOne({ name, status: { $ne: OrganisationStatus.DELETED } }).exec()
  if (record) {
    // Duplicates found
    return true
  } else {
    // Duplicates NOT found
    return false
  }
}
