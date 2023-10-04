/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as items from '../../src/core/items'
import { IItem, IItemDocument, ItemPrivacy, ItemStatus, ItemType } from '../../src/persistance/item/types'
import { OrganisationModel } from '../../src/persistance/organisation/model'
import { OrganisationStatus, UISkins } from '../../src/persistance/organisation/types'
import { UserModel } from '../../src/persistance/user/model'
import { IUserUIProfile } from '../../src/persistance/user/types'
import { ItemModel } from '../../src/persistance/item/model'
import { cs } from '../../src/microservices/commServer'
import { NodeModel } from '../../src/persistance/node/model'
import { INodeUI, NodeStatus, NodeType } from '../../src/persistance/node/types'
import { ErrorSource, MyError } from '../../src/utils/error-handler'
import { csSession } from '../../src/types/cs-types'
import { RolesEnum } from '../../src/types/roles'

jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/persistance/contract/model.ts')
jest.mock('../../src/persistance/user/model.ts')
jest.mock('../../src/persistance/notification/model.ts')
jest.mock('../../src/persistance/audit/model.ts')
jest.mock('../../src/persistance/item/model.ts')
jest.mock('../../src/persistance/node/model.ts')
jest.mock('../../src/microservices/commServer.ts')
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
  roles: [RolesEnum.SERV_PROVIDER, RolesEnum.DEV_OWNER],
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

describe('Items', () => {
  it('getMany', async () => {
    const spy = jest.spyOn(items, 'getMany')
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue(org1)
    jest.spyOn(cs, 'getSessions').mockResolvedValue({ session: [], ttl: 0 })
    jest.spyOn(ItemModel, '_getAllItems').mockResolvedValue([item1])
    const response1 = await items.getMany('cid', ItemType.DEVICE, 0, 0)
    expect(response1).toMatchObject([{ agid: 'agid' }])
      jest.spyOn(OrganisationModel, '_getOrganisation').mockImplementation(async() => {
        throw new Error('mock')
    })
    await expect(items.getMany('cid', ItemType.DEVICE, 0, 0)).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it('getOne', async () => {
    const spy = jest.spyOn(items, 'getOne')
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue(item1)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue(org1)
    jest.spyOn(NodeModel, '_getNode').mockResolvedValue(node1)
    jest.spyOn(cs, 'getSessions').mockResolvedValue({ session: [], ttl: 0 })

    const response1 = await items.getOne('cid', ItemType.DEVICE)
    expect(response1).toMatchObject({ agid: 'agid' })
    jest.spyOn(UserModel, '_getUser').mockImplementation(async () => {
      throw new Error('MOCK')
    })
    await expect(items.getOne('cid', ItemType.DEVICE)).rejects.toMatchObject({ status: 500 })
    jest.spyOn(UserModel, '_getUser').mockImplementation(async () => {
      throw new MyError('',400, { source: ErrorSource.ITEM })
    })
    await expect(items.getOne('cid', ItemType.DEVICE)).rejects.toMatchObject({ status: 400 })
    expect(spy).toHaveBeenCalledTimes(3)
  })
  it('createOne', async () => {
    const spy = jest.spyOn(items, 'createOne')

    const response1 = await items.createOne(item1, 'agid', 'cid')
    expect(typeof response1).toBe('string')
    jest.spyOn(ItemModel, '_createItem').mockImplementation(async () => {
      throw new Error('MOCK')
    })
    await expect(items.createOne(item1, 'agid', 'cid')).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it('removeOne', async () => {
    const spy = jest.spyOn(items, 'removeOne')
    jest.spyOn(ItemModel, '_getDoc').mockResolvedValue({ ...item1, _removeItem: async () => {} } as IItemDocument)

    await items.removeOne('oid', 'uid')
    await expect(items.removeOne('oid', 'aaa')).rejects.toMatchObject({ status: 403 })
    
    jest.spyOn(cs, 'deleteUser').mockImplementation(async () => {
      throw new Error('MOCK')
    })
    await expect(items.removeOne('oid', 'uid')).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(3)
  })
  it('updateOne', async () => {
    const spy = jest.spyOn(items, 'updateOne')
    jest.spyOn(ItemModel, '_getDoc').mockResolvedValue({ ...item1, _updateItem: async () => { } } as unknown as IItemDocument)
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue(item1)
    await items.updateOne('oid',{})
    await expect(items.updateOne('oid', {},'owner3')).rejects.toMatchObject({ status: 400 })
    await expect(items.updateOne('oid', { status: ItemStatus.DISABLED },'owner3')).rejects.toMatchObject({ status: 400 })
    await expect(items.updateOne('oid', { status: ItemStatus.DELETED },'owner3')).rejects.toMatchObject({ status: 400 })
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue({ ...item1, hasContracts: [] })
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)

    await items.updateOne('oid', { status: ItemStatus.ENABLED }, 'uid')
    await items.updateOne('oid', { status: ItemStatus.DISABLED }, 'uid')
    await items.updateOne('oid', { accessLevel: ItemPrivacy.PRIVATE }, 'uid')
    await expect(items.updateOne('oid', { accessLevel: ItemPrivacy.PUBLIC },'uid')).rejects.toMatchObject({ status: 403 })
    jest.spyOn(ItemModel, '_getDoc').mockImplementation(async () => {
      throw new Error('MOCK')
    })
    await expect(items.updateOne('oid', {})).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(9)
  })
})
