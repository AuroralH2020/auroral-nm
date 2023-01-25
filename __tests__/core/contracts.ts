/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as contracts from '../../src/core/contracts'
import { cs } from '../../src/microservices/commServer'
import { ContractModel } from '../../src/persistance/contract/model'
import { ContractType, ContractItemType, IContractDocument, IContractUI } from '../../src/persistance/contract/types'
import { ItemModel } from '../../src/persistance/item/model'
import { IItem, ItemPrivacy, ItemStatus } from '../../src/persistance/item/types'
import { NotificationModel } from '../../src/persistance/notification/model'
import { OrganisationModel } from '../../src/persistance/organisation/model'
import { OrganisationStatus, UISkins } from '../../src/persistance/organisation/types'
import { UserModel } from '../../src/persistance/user/model'
import { IUserUIProfile } from '../../src/persistance/user/types'
import { csGroup } from '../../src/types/cs-types'
import { IAuditLocals } from '../../src/types/locals-types'

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockReturnValue((mailoptions:any, callback:any) => {})
    })
  }))

jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/persistance/contract/model.ts')
jest.mock('../../src/persistance/user/model.ts')
jest.mock('../../src/persistance/notification/model.ts')
jest.mock('../../src/persistance/audit/model.ts')
jest.mock('../../src/persistance/item/model.ts')
jest.mock('../../src/microservices/commServer.ts')
jest.mock('../../src/microservices/xmppClient')
jest.mock('../../src/utils/logger')

afterEach(() => {
  jest.clearAllMocks()
})

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
} as any as IUserUIProfile

const item1 = {
  name: 'item1', 
  oid: 'oid', 
  agid: 'agid', 
  status: ItemStatus.ENABLED,
  accessLevel: ItemPrivacy.FOR_FRIENDS,
  uid: 'uid'
} as any as IItem

const contract1 = {
  ctid: 'ctid1',
  organisations: ['cid1', 'cid2'],
  pendingOrganisations: [],
  items: []
} as any as IContractDocument

describe('Contracts', () => {
  it('getMany', async () => {
      const spy = jest.spyOn(contracts, 'getMany')
      jest.spyOn(ContractModel, '_getAllContracts').mockResolvedValue([{ ctid: 'ctid1' } as IContractUI])
      const response1 = await contracts.getMany({ ctid: ['ctid1'], offset: 1, type: ContractType.PRIVATE })
      expect(response1).toMatchObject([{ ctid: 'ctid1' }])
      expect(spy).toHaveBeenCalledTimes(1)
  })
  it('getMany fail', async () => {
    const spy = jest.spyOn(contracts, 'getMany')
    jest.spyOn(ContractModel, '_getAllContracts').mockImplementation(async () => {
      throw new Error('MOCK')
    })
    await expect(contracts.getMany({ ctid: ['ctid1'], offset: 1, type: ContractType.PRIVATE })).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('createOne', async () => {
      const spy = jest.spyOn(contracts, 'createOne')
      jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce(org1)
      jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, cid: 'cid2' })
      jest.spyOn(ContractModel, '_createContract').mockResolvedValue(contract1)
      jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
      await contracts.createOne({ cid: 'cid1', uid: 'uid',termsAndConditions: 'terms',organisations: ['cid2'] },{} as any as IAuditLocals, 'token')
      expect(spy).toHaveBeenCalledTimes(1)
  })
  it('createOne toFail', async () => {
    const spy = jest.spyOn(contracts, 'createOne')
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce(org1)
    jest.spyOn(ContractModel, '_createContract').mockResolvedValue(contract1)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    await expect(contracts.createOne({ cid: 'cid1', uid: 'uid',termsAndConditions: 'terms',organisations: [] },{} as any as IAuditLocals, 'token')).rejects.toMatchObject({ status: 400 })
    await expect(contracts.createOne({ cid: 'cid1', uid: 'uid',termsAndConditions: 'terms',organisations: ['cid1'] },{} as any as IAuditLocals, 'token')).rejects.toMatchObject({ status: 400 })
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce({ ...org1, status: OrganisationStatus.DELETED })
    await expect(contracts.createOne({ cid: 'cid1', uid: 'uid',termsAndConditions: 'terms',organisations: ['cid1'] },{} as any as IAuditLocals, 'token')).rejects.toMatchObject({ status: 400 })
    expect(spy).toHaveBeenCalledTimes(3)
  })
  it('updateOne', async () => {
    const spy = jest.spyOn(contracts, 'updateOne')
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce(org1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, cid: 'cid2' })
    jest.spyOn(ContractModel, '_createContract').mockResolvedValue(contract1)
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValue({ _updateContract: async () => { } } as any as IContractDocument)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    await contracts.updateOne('ctid', {})
    expect(spy).toHaveBeenCalledTimes(1)
})
it('updateOne fail', async () => {
    const spy = jest.spyOn(contracts, 'updateOne')
    jest.spyOn(ContractModel, '_createContract').mockResolvedValue(contract1)
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValue({ _updateContract: async () => {
      throw new Error('MOCK')
    } } as any as IContractDocument)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    await expect(contracts.updateOne('ctid', {})).rejects.toMatchObject({ status: 500 })
    expect(spy).toHaveBeenCalledTimes(1)
})
  it('removeOrgFromContract', async () => {
    const spy = jest.spyOn(contracts, 'removeOrgFromContract')
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue(contract1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce(org1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, cid: 'cid2' })
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValue({ ...contract1, _updateContract: async () => { } } as any as IContractDocument)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    await contracts.removeOrgFromContract('ctid', 'cid', 'uid', {} as any as IAuditLocals, 'token')
    expect(spy).toHaveBeenCalledTimes(1)
})
  it('removeOrgFromContract - testAfterRemoving', async () => {
    const spy = jest.spyOn(contracts, 'removeOrgFromContract')
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue(contract1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce(org1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, cid: 'cid2' })
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue(['123'])
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValue({ ...contract1, organisations: [], pendingOrganisations: [], _updateContract: async () => { }, _removeContract: async () => {} } as any as IContractDocument)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(cs, 'getGroup').mockResolvedValue({ members: ['asd'] } as any as csGroup)
    await contracts.removeOrgFromContract('ctid', 'cid', 'uid', {} as any as IAuditLocals, 'token')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('rejectContractRequest ', async () => {
    const spy = jest.spyOn(contracts, 'rejectContractRequest')
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue(contract1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce({ ...org1, hasContractRequests: ['ctid'] })
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, cid: 'cid2' })
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValue({ ...contract1, organisations: ['cid1'], pendingOrganisations: ['cid2'], _updateStatus: async () => { } } as any as IContractDocument)
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue({ ...contract1, organisations: ['cid1'], pendingOrganisations: [], _updateStatus: async () => { } } as any as IContractDocument)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue(['123'])
    await contracts.rejectContractRequest('ctid', 'cid', 'uid', {} as any as IAuditLocals, 'token')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('rejectContractRequest - testAfterRemoving', async () => {
    const spy = jest.spyOn(contracts, 'rejectContractRequest')
    jest.spyOn(cs, 'getGroup').mockResolvedValue({ members: ['asd'] } as any as csGroup)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce({ ...org1, hasContractRequests: ['ctid'] })
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, cid: 'cid2' })
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValueOnce({ ...contract1, organisations: ['cid1'], pendingOrganisations: ['cid2'], _updateStatus: async () => { } } as any as IContractDocument)
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValueOnce({ ...contract1, organisations: [], pendingOrganisations: [], _removeContract: async () => { } } as any as IContractDocument)
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue({ ...contract1, organisations: [], pendingOrganisations: [], _removeContract: async () => { } } as any as IContractDocument)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue(['123'])
    await contracts.rejectContractRequest('ctid', 'cid', 'uid', {} as any as IAuditLocals, 'token')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('acceptContractRequest', async () => {
    const spy = jest.spyOn(contracts, 'acceptContractRequest')
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue(contract1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValueOnce({ ...org1, hasContractRequests: ['ctid'] })
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, cid: 'cid2' })
    jest.spyOn(ContractModel, '_getDoc').mockResolvedValue({ ...contract1, hasContractRequests: ['cid'], _updateStatus: async () => { } } as any as IContractDocument)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue(['123'])
    await contracts.acceptContractRequest('ctid', 'cid', 'uid', {} as any as IAuditLocals, 'token')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('addItem', async () => {
    const spy = jest.spyOn(contracts, 'addItem')
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue(item1)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue(contract1)
    await contracts.addItem({ ctid: 'ctid', oid: 'oid', rw: true, enabled: true }, 'token')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('addItem fail', async () => {
    const spy = jest.spyOn(contracts, 'addItem')
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue({ ...item1, status: ItemStatus.DISABLED })
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue({ ...contract1, items: [{ oid: 'oid', enabled: true, rw: true, uid: '123' } as any as ContractItemType] })
    await expect(contracts.addItem({ ctid: 'ctid', oid: 'oid2',enabled: true, rw: true }, 'token')).rejects.toMatchObject({ status: 400 })
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue({ ...item1 })
    await expect(contracts.addItem({ ctid: 'ctid', oid: 'oid', enabled: true, rw: true }, 'token')).rejects.toMatchObject({ status: 400 })
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it('editItem', async () => {
    const spy = jest.spyOn(contracts, 'editItem')
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue(item1)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue({ ...contract1, items: [{ oid: 'oid', enabled: true, rw: true, uid: '123' } as any as ContractItemType] })
    jest.spyOn(ContractModel, '_getItem').mockResolvedValue({ oid: 'oid', enabled: true, rw: true, uid: '123' } as any as ContractItemType)
    await contracts.editItem('ctid', 'oid', { rw: true }, 'token')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('editItem fail', async () => {
    const spy = jest.spyOn(contracts, 'editItem')
    jest.spyOn(ItemModel, '_getItem').mockRejectedValue(undefined)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue({ ...contract1, items: [{ oid: 'oid', enabled: true, rw: true, uid: '123' } as any as ContractItemType] })
    jest.spyOn(ContractModel, '_getItem').mockResolvedValue({ oid: 'oid', enabled: true, rw: true, uid: '123' } as any as ContractItemType)
    await expect(contracts.editItem('ctid', 'oid', { rw: false, enabled: false }, 'token')).rejects.toMatchObject({ status: 500 })

    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('removeItems', async () => {
    const spy = jest.spyOn(contracts, 'removeItems')
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue(item1)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, hasNodes: ['agid1'] })
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue({ ...contract1, items: [{ oid: 'oid', enabled: true, rw: true, uid: '123' } as any as ContractItemType] })
    jest.spyOn(ContractModel, '_getContractItems').mockResolvedValue(['oid'])
    await contracts.removeItems('ctid', ['oid'], 'cid', 'token')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('removeItems fail', async () => {
    const spy = jest.spyOn(contracts, 'removeItems')
    jest.spyOn(ItemModel, '_getItem').mockResolvedValue(item1)
    jest.spyOn(UserModel, '_getUser').mockResolvedValue(user1)
    jest.spyOn(OrganisationModel, '_getOrganisation').mockResolvedValue({ ...org1, hasNodes: ['agid1'] })
    jest.spyOn(ContractModel, '_getContract').mockResolvedValue({ ...contract1, items: [{ oid: 'oid', enabled: true, rw: true, uid: '123' } as any as ContractItemType] })
    jest.spyOn(ContractModel, '_getContractItems').mockResolvedValue(['oid'])
    await expect(contracts.removeItems('ctid', ['not'], 'cid', 'token')).rejects.toMatchObject({ status: 400 })

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
