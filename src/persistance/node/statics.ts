import { v4 as uuidv4 } from 'uuid'
import { INodeDocument, INodeModel, INodeCreatePost, INodeUI, NodeStatus } from './types'

export async function getNode(
  this: INodeModel, agid: string, cid?: string
): Promise<INodeUI> {
  const query = cid ? { agid, cid } : { agid }
  const record = await this.findOne(
    query, 
    { key: 0 }
    ).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Node not found in organisation: ' + cid)
  }
}

export async function getDoc(
  this: INodeModel, agid: string, cid?: string
): Promise<INodeDocument> {
  const query = cid ? { agid, cid } : { agid }
  const record = await this.findOne(query).exec()
  if (record) {
    return record
  } else {
    throw new Error('Node not found in organisation: ' + cid)
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
    throw new Error('Node not found')
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
