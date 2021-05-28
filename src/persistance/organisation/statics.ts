import { IOrganisationDocument, IOrganisationModel, IOrganisationCreate, IOrganisationUI, OrganisationStatus, OrgConfiguration } from './types'

export async function getOrganisation(
  this: IOrganisationModel, cid: string
): Promise<IOrganisationUI> {
  const record = await this.findOne(
    { cid }, 
    { hasNotifications: 0, hasAudits: 0, hasNodes: 0 }
    ).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Organisation not found')
  }
}

export async function getOrganisations(
  this: IOrganisationModel, cid: string, type: number, offset: number
): Promise<IOrganisationUI[]> {
  // Define variables and constants
  const LIMIT = 12 // max num of items when pagination active
  const query = {}
  let record: IOrganisationUI[] = [] // final result
  // Retrieve all organisations
  if (type === 0) {
      record = await this.find(
        query, 
        { hasNotifications: 0, hasAudits: 0, hasUsers: 0, hasNodes: 0 }
        ).skip(offset).limit(LIMIT).lean()
      .exec()
  // Retrieve all friends
  } else if (type === 1) {
      const doc = await this.findOne({ cid }, { knows: 1 }).lean().exec()
      const friends = doc ? doc.knows : []
      record = await this.find({ cid: { $in: friends }, status: OrganisationStatus.ACTIVE }, { hasNotifications: 0, hasAudits: 0, hasNodes: 0 }).lean().exec()
    // Retrieve all NON friends
  } else if (type === 2) {
      const doc = await this.findOne({ cid }, { knows: 1 }).lean().exec()
      const friends = doc ? doc.knows : []
      record = await this.find({ cid: { $nin: [...friends, cid] }, status: OrganisationStatus.ACTIVE }, { hasNotifications: 0, hasAudits: 0, hasNodes: 0 }).lean().exec()
  } else {
      throw new Error('Wrong type number (organisations retrieval): ' + type)
  }
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

export async function getConfiguration(
  this: IOrganisationModel, cid: string
  ): Promise<OrgConfiguration> {
    const record = await this.findOne({ cid }, { skinColor: 1 }).exec()
    if (record) {
      return {
        skinColor: record.skinColor
      }
    } else {
      throw new Error('Organisation not found')
    }
  }
