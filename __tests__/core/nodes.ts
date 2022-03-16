/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as nodes from '../../src/core/nodes'
import { IItem, ItemPrivacy, ItemStatus } from '../../src/persistance/item/types'
import { OrganisationStatus, UISkins } from '../../src/persistance/organisation/types'
import { IUserUIProfile } from '../../src/persistance/user/types'
import { NodeModel } from '../../src/persistance/node/model'
import { INodeDocument, INodeUI, NodeStatus, NodeType } from '../../src/persistance/node/types'
import { MyError } from '../../src/utils/error-handler'

jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/persistance/node/model.ts')
jest.mock('../../src/microservices/xmppClient')
jest.mock('../../src/core/items.ts')
jest.mock('../../src/utils/logger')

afterEach(() => {
  jest.clearAllMocks()
})

const item1 = {
  name: 'item1', 
  oid: 'oid', 
  agid: 'agid', 
  status: ItemStatus.ENABLED,
  accessLevel: ItemPrivacy.FOR_FRIENDS,
  uid: 'uid',
  hasContracts: ['ctid1']
} as any as IItem

const org1 = {
  name: 'org1',
  cid: 'cid1',
  businessId: 'string',
  location: 'string',
  skinColor: UISkins.BLACK,
  avatar: 'string',
  notes: 'string',
  status: OrganisationStatus.ACTIVE,
  hasNotifications: [],
  hasAudits: [],
  hasUsers: [],
  hasNodes: ['node1'],
  hasContracts: [],
  hasContractRequests: [],
  knows: ['cid2','cid1'],
  knowsRequestsFrom: [],
  knowsRequestsTo: [],
  lastUpdated: 123,
  created: 123
}

const user1 = {
  name: 'username1',
  email: '1@1.cz',
  accessLevel: ItemPrivacy.FOR_FRIENDS
} as any as IUserUIProfile

const node1 = {
  agid: 'agid1', // unique Node id
  name: 'noideName',
  cid: 'cid1', // unique organisation id
  type: NodeType.AURORAL,
  status: NodeStatus.ACTIVE,
  hasItems: ['oid1'],
  itemsCount: 1,
  hasKey: true,
  visible: true,
  lastUpdated: 123,
  created: 123
} as any as INodeUI

describe('nodes', () => {
  it('createOne', async () => {
    const spy = jest.spyOn(nodes, 'createOne')
    jest.spyOn(NodeModel, '_createNode').mockResolvedValue(node1 as any as INodeDocument)
    const response1 = await nodes.createOne('cid', 'name', NodeType.AURORAL, 'password')
    expect(response1).toMatch('agid1')
    jest.spyOn(NodeModel, '_createNode').mockImplementation(async () => { 
      throw new MyError('MOCK')
    })
    await expect(nodes.createOne('cid', 'name', NodeType.AURORAL, 'password')).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it('updateOne', async () => {
    const spy = jest.spyOn(nodes, 'updateOne')
    jest.spyOn(NodeModel, '_getDoc').mockResolvedValue({ ...node1, _updateNode: async () => {} } as any as INodeDocument)
    await nodes.updateOne('agid1', { visible: true })
    await nodes.updateOne('agid1', { visible: false })
    await nodes.updateOne('agid1', {  })
    jest.spyOn(NodeModel, '_getDoc').mockResolvedValue({ ...node1,
    _updateNode: async () => {
      throw new Error('MOCK ERROR')
    } } as any as INodeDocument)
    await expect(nodes.updateOne('agid1', { visible: false })).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(4)
  })
  it('removeOne', async () => {
    const spy = jest.spyOn(nodes, 'removeOne')
    jest.spyOn(NodeModel, '_getDoc').mockResolvedValue({ ...node1, hasItems: ['oid1'], _removeNode: async () => {} } as any as INodeDocument)
    await nodes.removeOne('agid1', 'cid')
    jest.spyOn(NodeModel, '_getDoc').mockResolvedValue({ ...node1,
      _removeNode: async () => {
      throw new Error('MOCK ERROR')
    } } as any as INodeDocument)
    await expect(nodes.removeOne('agid1', 'cid')).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
