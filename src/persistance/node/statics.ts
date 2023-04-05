import { v4 as uuidv4 } from 'uuid'
import { INodeDocument, INodeModel, INodeCreatePost, INodeUI, NodeStatus, VersionsType, NodeInfoType } from './types'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { ItemType } from '../../persistance/item/types'
import { logger } from '../../utils'

export async function getNode(
  this: INodeModel, agid: string, cid?: string
): Promise<INodeUI> {
  const query = cid ? { agid, cid, status: NodeStatus.ACTIVE } : { agid, status: NodeStatus.ACTIVE }
  const record = await this.findOne(
    query, 
    { key: 0 }
    ).lean().exec()
  if (record) {
    return record
  } else {
    // logger.warn('Node not found in organisation: ' + cid)
    throw new MyError('Node not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getDoc(
  this: INodeModel, agid: string, cid?: string
): Promise<INodeDocument> {
  const query = cid ? { agid, cid, status: NodeStatus.ACTIVE } : { agid, status: NodeStatus.ACTIVE }
  const record = await this.findOne(query).exec()
  if (record) {
    return record
  } else {
    // logger.warn('Node not found in organisation: ' + cid)
    throw new MyError('Node not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getAllNodes(
  this: INodeModel, nodes: string[]
): Promise<INodeUI[]> {
  const record = await this.find(
    { agid: { $in: nodes }, status: NodeStatus.ACTIVE },
    { key: 0 }
    ).exec()
  if (record) {
    return record
  } else {
    // logger.warn('Node not found')
    throw new MyError('Node not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function createNode(
    this: INodeModel, data: INodeCreatePost
  ): Promise<INodeDocument> {
    const newNode = {
      ...data,
      agid: uuidv4()
    }
    return this.create(newNode)
}

export async function addItemToNode(
  this: INodeModel, agid: string, oid: string
): Promise<void> {
  const record = await this.updateOne({ agid }, { $addToSet: { hasItems: oid }, $inc: { itemsCount: 1 } }).exec()
  if (!record.ok) {
    throw new Error('Error adding item to node')
  }
}

export async function removeItemFromNode(
  this: INodeModel, agid: string, oid: string
  ): Promise<void> {
    const record = await this.updateOne({ agid }, { $pull: { hasItems: oid }, $inc: { itemsCount: -1 } }).exec()
    if (!record.ok) {
      throw new Error('Error removing item from node')
    }
  }

export async function getKey(
  this: INodeModel, agid: string
): Promise<string | null> {
  const record = await this.findOne({ agid }, { key: 1 }).exec()
  if (record) {
    return record.key
  } else {
    throw new Error('Node not found')
  }
}

export async function removeKey(
  this: INodeModel, agid: string
): Promise<void> {
  const record = await this.updateOne({ agid }, { $set: { hasKey: false, key: null } }).exec()
  if (!record.ok) {
    throw new Error('Error removing key from node')
  }
}

export async function count(
  this: INodeModel): Promise<number> {
    return this.countDocuments({ status: { $ne: NodeStatus.DELETED } }).exec()
  }

export async function addDefaultItemOwner(
  this: INodeModel, agid: string, uid: string,  type?: ItemType
  ): Promise<void> {
    let record
    if (type === ItemType.DEVICE) {
      record = await this.updateOne({ agid }, { '$set': { 'defaultOwner.Device': uid } }).exec()
    } else if (type === ItemType.SERVICE) {
      record = await this.updateOne({ agid }, { '$set': { 'defaultOwner.Service': uid } }).exec()
    } else if (type === ItemType.MARKETPLACE) {
      record = await this.updateOne({ agid }, { '$set': { 'defaultOwner.Marketplace': uid } }).exec()
    } else {
      throw new Error('Error addDefaultitemOwner: type not supported')
    }
    if (!record.ok) {
      throw new Error('Error adding defaultOwner to node')
    }
}

export async function removeDefaultItemOwner(
  this: INodeModel, agid: string, type?: ItemType
  ): Promise<void> {
    let record
    if (type === ItemType.DEVICE) {
      record = await this.updateOne({ agid }, { '$unset': { 'defaultOwner.Device': '' } }).exec()
    } else if (type === ItemType.SERVICE) {
      record = await this.updateOne({ agid }, { '$unset': { 'defaultOwner.Service': '' } }).exec()
    } else if (type === ItemType.MARKETPLACE) {
      record = await this.updateOne({ agid }, { '$unset': { 'defaultOwner.Marketplace': '' } }).exec()
    } else {
      throw new Error('Error addDefaultitemOwner: type not supported')
    }
    if (!record.ok) {
      throw new Error('Error removing defaultOwner from node')
    }
}

export async function addToCommunity(
  this: INodeModel, agid: string, commId: string
): Promise<void> {
  const record = await this.updateOne({ agid }, { $addToSet: { hasCommunities: commId } }).exec()
  if (!record.ok) {
    throw new Error('Error adding community to node')
  }
}

export async function removeFromCommunity(
  this: INodeModel, agid: string, commId: string
): Promise<void> {
  const record = await this.updateOne({ agid }, { $pull: { hasCommunities: commId } }).exec()
  if (!record.ok) {
    throw new Error('Error removing community from node')
  }
}

export async function addNodeInfo(
  this: INodeModel, agid: string, info: NodeInfoType
): Promise<void> {
  const record = await this.updateOne({ agid }, {
     $set: { info } }).exec()
  if (!record.ok) {
    logger.error('Error adding versions to node')
  }
}

export async function search(
  this: INodeModel, cid: string, text: string, limit: number, offset: number
): Promise<void> {
  const record = await this.aggregate([
    {
      '$match': {
        'cid': cid,
        'status': { '$ne': NodeStatus.DELETED },
        'name': {
          '$regex': text,
          '$options': 'i'
        }
      }
    }, {
      '$project': {
        'name': '$name',
        'id': '$agid',
        'type': 'Node',
        '_id': 0
      }
    }
  ]).sort({ name: -1 }).skip(offset).limit(limit)
  .exec()
  if (record) {
    return record 
  } else {
    throw new Error('Error adding community to node')
  }
}
