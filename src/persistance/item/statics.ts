import { IItemDocument, IItemModel, IItemCreatePost, IItem, ItemStatus } from './types'

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
  this: IItemModel, items: string[]
): Promise<IItem[]> {
  const record = await this.find(
    { oid: { $in: items }, status: { $ne: ItemStatus.DELETED } }
  ).exec()
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
