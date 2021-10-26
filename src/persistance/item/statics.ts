import { IItemDocument, IItemModel, IItemCreatePost, IItem, ItemStatus, GetAllQuery, GetByOwnerQuery, IItemPrivacy } from './types'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger } from '../../utils/logger'

export async function getItem(
  this: IItemModel, oid: string
): Promise<IItem> {
  const record = await this.findOne(
    // FILTER disabled items
    { oid , status: { $ne: ItemStatus.DELETED } }
    ).lean().exec()
  if (record) {
    return record
  } else {
    // logger.warn('Item not found')
    throw new MyError('Item not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}

export async function getDoc(
  this: IItemModel, oid: string
): Promise<IItemDocument> {
  const record = await this.findOne(
    // FILTER disabled items
    { oid , status: { $ne: ItemStatus.DELETED } })
    .exec()
  if (record) {
    return record
  } else {
    // logger.warn('Item not found')
    throw new MyError('Item not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}

export async function getAllItems(
  this: IItemModel, params: GetAllQuery, offset: number
): Promise<IItem[]> {
  const record = await this.find(
    params
  )
  .skip(offset)
  .limit(12)
  .lean()
  .exec()
  if (record) {
    return record
  } else {
    // logger.warn('Item not found')
    throw new MyError('Item not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}

export async function getByOwner(
  this: IItemModel, params: GetByOwnerQuery, offset: number
): Promise<IItem[]> {
  const record = await this.find(
    params
  )
  .skip(offset)
  .limit(12)
  .lean()
  .exec()
  if (record) {
    return record
  } else {
    // logger.warn('Item not found')
    throw new MyError('Items not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}

export async function createItem(
    this: IItemModel, data: IItemCreatePost
  ): Promise<IItemDocument> {
    const newItem = {
      ...data
    }
    return this.create(newItem)
}

export async function getItemsPrivacy(
  this: IItemModel, oids: string[]
): Promise<IItemPrivacy[]> {
  // get from mongo
  const record = await this.aggregate([
    { $match: { oid: { $in: oids }, status: ItemStatus.ENABLED } },
    { $project: {  oid: 1, privacy: '$accessLevel', _id: 0 } },
  ])
  .exec()
  if (record) {
    return record
  } else {
    throw new MyError('Items not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}
export async function addUserToItem (
  this: IItemModel, oid: string, uid: string
): Promise<void> {
  await this.updateOne({ oid }, { $set: { uid } }).exec()
}

export async function removeUserFromItem (
  this: IItemModel, oid: string
): Promise<void> {
  await this.updateOne({ oid }, { $set: { uid: undefined } }).exec()
}
