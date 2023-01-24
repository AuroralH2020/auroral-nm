// Express router
import { Router } from 'express'
// Middlewares
import { guard, addOrigin, createAudit, validateBody } from '../middlewares/index'
// Controllers
import * as miscCtrl from './controllers/misc'
import * as agentCtrl from './controllers/agent'
import * as discoveryCtrl from './controllers/discovery'
import * as itemsCtrl from './controllers/items'
// Types
import { Interfaces } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'
import { createItemSchema, updateItemGtwSchema } from '../../core/joi-schemas'

const GtwRouter = Router()

GtwRouter
.get('/handshake', addOrigin(Interfaces.GATEWAY), guard(), miscCtrl.handshake)
.get('/counters', addOrigin(Interfaces.GATEWAY), guard(), miscCtrl.getCounters)
.post('/counters', addOrigin(Interfaces.GATEWAY), guard(), miscCtrl.sendCounters)
.post('/info', addOrigin(Interfaces.GATEWAY), guard(), miscCtrl.sendNodeInfo)
.get('/items/:oid', addOrigin(Interfaces.GATEWAY), guard(), itemsCtrl.neighbourhood)
.post('/items/register', addOrigin(Interfaces.GATEWAY), guard(), createAudit(SourceType.ITEM), validateBody(createItemSchema), itemsCtrl.registration)
.post('/items/remove', addOrigin(Interfaces.GATEWAY), guard(), createAudit(SourceType.ITEM), itemsCtrl.deleteItems)
.put('/items/modify', addOrigin(Interfaces.GATEWAY), guard(), createAudit(SourceType.ITEM), validateBody(updateItemGtwSchema), itemsCtrl.updateItem) // Update item
.get('/items/agid/:oid', addOrigin(Interfaces.GATEWAY), guard(), itemsCtrl.getAgidByOid) // Get AGID by OID
.delete('/agent/:agid', addOrigin(Interfaces.GATEWAY), guard(), createAudit(SourceType.NODE), agentCtrl.deleteAgent)
.get('/agent/:agid/items', addOrigin(Interfaces.GATEWAY), guard(),createAudit(SourceType.NODE), agentCtrl.getAgentItems) // change to post if depends on update or use query
.get('/agent/privacy', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getPrivacy) 
.get('/agent/cid/:reqid', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getCid) 
.get('/agent/partners', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getPartners) 
.get('/agent/partner/:cid', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getPartner)
.get('/agent/contract/items/:cid', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getContractedItemsByCid)
.get('/agent/key/:agid', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getAgentPubkey)

// DISCOVERY
.get('/agent/communities', addOrigin(Interfaces.GATEWAY), guard(), discoveryCtrl.getCommunities)
.get('/discovery/nodes/organisation', addOrigin(Interfaces.GATEWAY), guard(), discoveryCtrl.getNodesInOrganisation)
.get('/discovery/nodes/organisation/:cid', addOrigin(Interfaces.GATEWAY), guard(), discoveryCtrl.getNodesInOrganisation)
.get('/discovery/nodes/community/:commId', addOrigin(Interfaces.GATEWAY), guard(), discoveryCtrl.getNodesInCommunity)
.get('/discovery/items/organisation', addOrigin(Interfaces.GATEWAY), guard(), discoveryCtrl.getItemsInOrganisation)
.get('/discovery/items/contract/:ctid', addOrigin(Interfaces.GATEWAY), guard(), discoveryCtrl.getItemsInContract)
.get('/discovery/items/contract/:ctid/origin/:oid', addOrigin(Interfaces.GATEWAY), guard(), discoveryCtrl.getItemsInContract)

// .get('/agent/relationship/:reqid', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getRelationship) 
// .post('/items/td', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getTd) // Remove once Gateway is updated, deprecated use
// .put('/items/update', addOrigin(Interfaces.GATEWAY), guard(), itemsCtrl.updateItemContent) // Update only TDs non critial properties
// .post('/items/searchItems', guard(), controllers.searchItems)
// // agent

export { GtwRouter }
