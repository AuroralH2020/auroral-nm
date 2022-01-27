import {
  IItemDocument,
  IItemModel,
  IItemCreatePost,
  IItem,
  ItemStatus,
  GetAllQuery,
  GetByOwnerQuery,
  IItemPrivacy,
  ContractItemSelect, ItemPrivacy
} from './types'
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

export async function getAllCompanyItemsContractView(
    this: IItemModel, cid: string, ctid: string
): Promise<ContractItemSelect[]> {
  const record = await this.aggregate([
    {
      '$match': {
        'cid': cid,
        'status': ItemStatus.ENABLED,
        'accessLevel': { $ne: ItemPrivacy.PRIVATE }
      }
    }, {
      '$lookup': {
        'from': 'contracts',
        'localField': 'hasContracts',
        'foreignField': 'ctid',
        'let': {
          'myOid': '$oid'
        },
        'pipeline': [
          {
            '$match': {
              'ctid': ctid
            }
          }, {
            '$unwind': '$items'
          }, {
            '$project': {
              'oid': '$items.oid',
              '_id': 0,
              'userMail': '$items.userMail',
              'enabled': '$items.enabled',
              'rw': '$items.rw'
            }
          }, {
            '$match': {
              '$expr': {
                '$eq': [
                  '$$myOid', '$oid'
                ]
              }
            }
          }
        ],
        'as': 'contract'
      }
    }, {
      '$unwind': {
        'path': '$contract',
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'uid',
        'foreignField': 'uid',
        'as': 'user'
      }
    }, {
      '$unwind': {
        'path': '$user',
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$project': {
        'oid': 1,
        'uid': 1,
        'rw': '$contract.rw',
        'owner': '$user.name',
        'enabled': '$contract.enabled',
        '_id': 0,
        'status': 1,
        'accessLevel': 1,
        'type': 1,
        'contracted': {
          '$in': [
            ctid, {
              '$ifNull': [
                '$hasContracts', []
              ]
            }
          ]
        },
        'name': 1
      }
    }
  ]).exec()
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

export async function addContractToItem(
  this: IItemModel, oid: string, ctid: string
): Promise<void> {
  const record = await this.updateOne({ oid }, { $addToSet: { hasContracts: ctid } }).exec()
  if (!record.ok) {
    throw new Error('Error removing item from user')
  }
}

export async function removeContractFromItem(
  this: IItemModel, oid: string, ctid: string
): Promise<void> {
  const record = await this.updateOne({ oid }, { $pull: { hasContracts: ctid } }).exec()
  if (!record.ok) {
    throw new Error('Error removing item from user')
  }
}

export async function removeContractFromCompanyItems(
    this: IItemModel,cid: string,  ctid: string
): Promise<void> {
  const record = await this.updateMany({ cid: cid, hasContracts: ctid }, { $pull: { hasContracts: ctid } }).exec()
  if (!record.ok) {
    throw new Error('Error removing item from user')
  }
}

export async function getItemsPrivacy(
  this: IItemModel, oids: string[]
): Promise<IItemPrivacy[]> {
  // get from mongo
  const record = await this.aggregate([
    { $match: { oid: { $in: oids }, status: { $ne: ItemStatus.DELETED } } },
    { $project: { oid: 1, privacy: '$accessLevel', _id: 0 } },
  ])
    .exec()
  if (record) {
    return record
  } else {
    throw new MyError('Items not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}
