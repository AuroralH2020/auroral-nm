/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as statistics from '../../src/core/statistics'
import { IItem, ItemPrivacy, ItemStatus } from '../../src/persistance/item/types'
import { OrganisationStatus, UISkins } from '../../src/persistance/organisation/types'
import { IUserUIProfile } from '../../src/persistance/user/types'
import { NodeModel } from '../../src/persistance/node/model'
import { INodeDocument, INodeUI, NodeStatus, NodeType } from '../../src/persistance/node/types'

jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/persistance/node/model.ts')
jest.mock('../../src/persistance/item/model.ts')
jest.mock('../../src/persistance/user/model.ts')
jest.mock('../../src/persistance/contract/model.ts')
jest.mock('../../src/persistance/statistics/model.ts')
jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/microservices/xmppClient')
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

describe('statistics', () => {
  it('storeStatistics', async () => {
    const spy = jest.spyOn(statistics, 'storeStatistics')
    jest.spyOn(NodeModel, '_createNode').mockResolvedValue(node1 as any as INodeDocument)
    const response1 = await statistics.storeStatistics()
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('getLastStatistics', async () => {
    const spy = jest.spyOn(statistics, 'getLastStatistics')
    jest.spyOn(NodeModel, '_createNode').mockResolvedValue(node1 as any as INodeDocument)
    const response1 = await statistics.getLastStatistics()
    expect(response1).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('getStatistics', async () => {
    const spy = jest.spyOn(statistics, 'getStatistics')
    jest.spyOn(NodeModel, '_createNode').mockResolvedValue(node1 as any as INodeDocument)
    const response1 = await statistics.getStatistics(123)
    expect(response1).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
