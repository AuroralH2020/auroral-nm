import mongoose from 'mongoose'
import { getNode, getDoc, createNode, getAllNodes, addItemToNode, removeItemFromNode, getKey, removeKey } from './statics'
import { updateNode, removeNode } from './methods'
import { INodeDocument, INodeModel, NodeType, NodeStatus } from './types'

const Schema = mongoose.Schema

const nodeTypes = Object.values(NodeType)
const statuses = Object.values(NodeStatus)

const NodeSchema = new Schema<INodeDocument, INodeModel>({
    agid: { type: String, index: true, required: true }, // unique Node id
    name: { type: String, required: true }, // fullName
    cid: { type: String, required: true }, // unique organisation id
    status: { type: String, default: NodeStatus.ACTIVE, enum: statuses },
    visible: { type: Boolean, default: true },
    type: { type: String, required: true, enum: nodeTypes },
    // location: String,
    hasItems: [{ type: String, default: [] }],
    itemsCount: { type: Number, default: 0 },
    hasKey: { type: Boolean, default: false },
    key: String,
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }
})

// Statics

NodeSchema.statics._getNode = getNode
NodeSchema.statics._getDoc = getDoc
NodeSchema.statics._createNode = createNode
NodeSchema.statics._getAllNodes = getAllNodes
NodeSchema.statics._addItemToNode = addItemToNode
NodeSchema.statics._removeItemFromNode = removeItemFromNode
NodeSchema.statics._getKey = getKey
NodeSchema.statics._removeKey = removeKey

// Methods

NodeSchema.methods._updateNode = updateNode
NodeSchema.methods._removeNode = removeNode // Not delete record, keep some info for future inspection if needed

// eslint-disable-next-line import/no-default-export
export default NodeSchema
