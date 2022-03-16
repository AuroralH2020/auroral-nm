/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as users from '../../src/core/users'
import { IItem, ItemPrivacy, ItemStatus } from '../../src/persistance/item/types'
import { OrganisationStatus, UISkins } from '../../src/persistance/organisation/types'
import { IUserDocument, IUserUIProfile } from '../../src/persistance/user/types'
import { NodeModel } from '../../src/persistance/node/model'
import { INodeDocument, INodeUI, NodeStatus, NodeType } from '../../src/persistance/node/types'
import { RolesEnum } from '../../src/types/roles'

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
  hasItems: ['item1'],
  accessLevel: ItemPrivacy.FOR_FRIENDS,
  roles: [RolesEnum.ADMIN]
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

describe('users', () => {
  it('checkRoles', async () => {
    const spy = jest.spyOn(users, 'checkRoles')
    jest.spyOn(NodeModel, '_createNode').mockResolvedValue(node1 as any as INodeDocument)
    try {
      users.checkRoles({ ...user1, roles: [RolesEnum.USER] } as IUserDocument, {} as IUserDocument, [RolesEnum.ADMIN])
    } catch (error) {
      expect(error).toMatchObject({ status: 403 })
    }
    try {
      users.checkRoles({ ...user1, cid: 'differenetCid', roles: [RolesEnum.ADMIN] } as IUserDocument, {} as IUserDocument, [RolesEnum.ADMIN])
    } catch (error) {
      expect(error).toMatchObject({ status: 403 })
    }
    try {
      users.checkRoles({ ...user1, roles: [RolesEnum.ADMIN] } as IUserDocument, { ...user1 } as IUserDocument, [])
    } catch (error) {
      expect(error).toMatchObject({ status: 403 })
    }
    try {
      users.checkRoles({ ...user1 } as IUserDocument, { ...user1, roles: [RolesEnum.DEV_OWNER] } as IUserDocument, [RolesEnum.ADMIN])
    } catch (error) {
      expect(error).toMatchObject({ status: 403 })
    }

    expect(spy).toHaveBeenCalledTimes(4)
  })
})
