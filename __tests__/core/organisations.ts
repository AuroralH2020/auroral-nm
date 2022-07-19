/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as organisations from '../../src/core/organisations'
import { IItem,  ItemPrivacy, ItemStatus,  } from '../../src/persistance/item/types'
import { IOrganisationDocument, OrganisationStatus, UISkins } from '../../src/persistance/organisation/types'
import { UserModel } from '../../src/persistance/user/model'
import { IUserDocument, IUserUIProfile } from '../../src/persistance/user/types'
import { INodeUI, NodeStatus, NodeType } from '../../src/persistance/node/types'
import { MyError } from '../../src/utils/error-handler'
import { IAuditLocals } from '../../src/types/locals-types'
import { AccountModel } from '../../src/persistance/account/model'
import { IAccountDocument } from '../../src/persistance/account/types'
import { CommunityModel } from '../../src/persistance/community/model'
import { ICommunity, ICommunityModel } from '../../src/persistance/community/types'

jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/persistance/community/model.ts')
jest.mock('../../src/persistance/contract/model.ts')
jest.mock('../../src/persistance/user/model.ts')
jest.mock('../../src/persistance/account/model.ts')
jest.mock('../../src/persistance/item/model.ts')
jest.mock('../../src/persistance/node/model.ts')
jest.mock('../../src/microservices/commServer.ts')
jest.mock('../../src/microservices/xmppClient')
jest.mock('../../src/core/contracts.ts')
jest.mock('../../src/core/communities.ts')
jest.mock('../../src/core/nodes')
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
  hasUsers: ['uid'],
  hasNodes: ['node1'],
  hasContracts: ['ctid1'],
  hasContractRequests: ['cid5'],
  knows: ['cid2','cid1'],
  knowsRequestsFrom: ['cid3'],
  knowsRequestsTo: ['cid4'],
  lastUpdated: 123,
  created: 123
}

const user1 = {
  name: 'username1',
  email: '1@1.cz',
  accessLevel: ItemPrivacy.FOR_FRIENDS
} as any as IUserUIProfile

const account1 = {
  name: 'username1',
  email: '1@1.cz',
  accessLevel: ItemPrivacy.FOR_FRIENDS
} as any as IAccountDocument

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

describe('organisations', () => {
  it('remove', async () => {
    const spy = jest.spyOn(organisations, 'remove')
    jest.spyOn(UserModel, '_getDoc').mockResolvedValue({ ...user1, _removeUser: async () => {} } as any as IUserDocument)
    jest.spyOn(CommunityModel, '_getPartnershipByCids').mockResolvedValue({ commId: '123' } as any as ICommunity)
    await organisations.remove({ ...org1, _removeOrganisation: async () => {} } as any as IOrganisationDocument, 'uid', {} as IAuditLocals)
    await expect(organisations.remove({ ...org1,
     _removeOrganisation: async () => {
        throw new MyError('MOCK',  500)
      } } as any as IOrganisationDocument, 'uid', {} as IAuditLocals)).rejects.toThrow()
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
