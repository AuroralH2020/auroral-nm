import { IItemDocument, IItemModel, IItemCreatePost, IItem, ItemStatus, GetAllQuery } from './types'

export async function getItem(
  this: IItemModel, oid: string
): Promise<IItem> {
  const record = await this.findOne(
    { oid }
    ).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Item not found')
  }
}

export async function getDoc(
  this: IItemModel, oid: string
): Promise<IItemDocument> {
  const record = await this.findOne({ oid }).exec()
  if (record) {
    return record
  } else {
    throw new Error('Item not found')
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
    throw new Error('Item not found')
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
