/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as communities from '../../src/core/communities'
import { CommunityModel } from '../../src/persistance/community/model'
import { cs } from '../../src/microservices/commServer'
import { csGroup } from '../../src/types/cs-types'
import { CommunityType, ICommunity, ICommunityCreate, ICommunityDocument } from '../../src/persistance/community/types'
import { IItem, ItemPrivacy, ItemStatus } from '../../src/persistance/item/types'
import { IOrganisationUI, OrganisationStatus, UISkins } from '../../src/persistance/organisation/types'
import { IUserUIProfile } from '../../src/persistance/user/types'
import { OrganisationModel } from '../../src/persistance/organisation/model'

jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/persistance/community/model.ts')
jest.mock('../../src/persistance/node/model.ts')
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

const community1 = {
  commId: 'commId1',
  name: 'community1',
  description: 'community1 description',
  type: 'Community',
  organisations: [{
    cid: 'cid1',
    name: 'org1',
    nodes: ['node1']
  }],
} as any as ICommunityDocument

describe('Contracts', () => {
  it('createOne', async () => {
      const spy = jest.spyOn(communities, 'createOne')
      jest.spyOn(CommunityModel, '_createCommunity').mockResolvedValue(community1)
      jest.spyOn(cs, 'postGroup').mockImplementation(() => Promise.resolve())
      jest.spyOn(cs, 'addUserToGroup').mockImplementation(() => Promise.resolve())
      const response1 = await communities.createOne(community1 as ICommunityCreate)
      expect(response1).toBeUndefined()
      await expect(communities.createOne({ name: 'toFail', type: CommunityType.COMMUNITY, organisations: [{ cid: 'cid1', name: 'org1', nodes: [] }] })).rejects.toMatchObject({ status: 500 })
      const response2 = await communities.createOne({ ...community1,type: CommunityType.PARTNERSHIP })
      expect(response2).toBeUndefined()
      expect(spy).toHaveBeenCalledTimes(3)
  })
  it('removeOne', async () => {
      const spy = jest.spyOn(communities, 'removeOne')
      jest.spyOn(CommunityModel, '_getCommunity').mockResolvedValue(community1)
      jest.spyOn(cs, 'deleteUserFromGroup').mockImplementation(() => Promise.resolve())
      jest.spyOn(cs, 'deleteGroup').mockImplementation(() => Promise.resolve())
      const response1 = await communities.removeOne('commId1')
      expect(response1).toBeUndefined()
      // fail
      // jest.spyOn(CommunityModel, '_getCommunity').mockImplementation(async () => { 
      //   throw new Error('MOCK')
      // })
      // TBD
      
      expect(spy).toHaveBeenCalledTimes(1)
  })
  it('addNode', async () => {
    const spy = jest.spyOn(communities, 'addNode')
    jest.spyOn(CommunityModel, '_getOrganisationsInCommunity').mockResolvedValue(['org1'])
    jest.spyOn(CommunityModel, '_getCommunityUI').mockResolvedValue(community1)
    jest.spyOn(OrganisationModel,'_getOrganisation').mockResolvedValue({ name: 'org1', nodes: ['node1'] } as any as IOrganisationUI)
    const response1 = await communities.addNode('commId1','org2','node2')
    expect(response1).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('removeNode', async () => {
    const spy = jest.spyOn(communities, 'removeNode')
    jest.spyOn(cs, 'deleteUserFromGroup').mockImplementation(() => Promise.resolve())
    jest.spyOn(CommunityModel, '_getOrganisationsInCommunity').mockResolvedValue(['org1'])
    const response1 = await communities.removeNode('commId1','org2','node2')
    expect(response1).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('removePartneship', async () => {
    const spy = jest.spyOn(communities, 'removePartneship')
    const response1 = await communities.removePartneship('commId1','org2')
    expect(response1).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
