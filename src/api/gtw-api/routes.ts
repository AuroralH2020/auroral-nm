// Express router
import { Router } from 'express'
// Middlewares
import { guard, addOrigin, createAudit } from '../middlewares/index'
// Controllers
import * as miscCtrl from './controllers/misc'
import * as agentCtrl from './controllers/agent'
import * as itemsCtrl from './controllers/items'
// Types
import { Interfaces } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'

const GtwRouter = Router()

GtwRouter
.get('/handshake', addOrigin(Interfaces.GATEWAY), guard(), miscCtrl.handshake)
.get('/counters', addOrigin(Interfaces.GATEWAY), guard(), miscCtrl.getCounters)
.post('/counters', addOrigin(Interfaces.GATEWAY), guard(), miscCtrl.sendCounters)
.get('/items/:oid', addOrigin(Interfaces.GATEWAY), guard(), itemsCtrl.neighbourhood)
.post('/items/register', addOrigin(Interfaces.GATEWAY), guard(), createAudit(Interfaces.GATEWAY, SourceType.ITEM), itemsCtrl.registration)
.post('/items/remove', addOrigin(Interfaces.GATEWAY), guard(), createAudit(Interfaces.GATEWAY, SourceType.ITEM), itemsCtrl.deleteItems)
.put('/items/modify', addOrigin(Interfaces.GATEWAY), guard(), createAudit(Interfaces.GATEWAY, SourceType.ITEM), itemsCtrl.updateItem) // Update item
.delete('/agent/:agid', addOrigin(Interfaces.GATEWAY), guard(), createAudit(Interfaces.GATEWAY, SourceType.NODE), agentCtrl.deleteAgent)
.get('/agent/:agid/items', addOrigin(Interfaces.GATEWAY), guard(),createAudit(Interfaces.GATEWAY, SourceType.NODE), agentCtrl.getAgentItems) // change to post if depends on update or use query
// .post('/items/td', addOrigin(Interfaces.GATEWAY), guard(), agentCtrl.getTd) // Remove once Gateway is updated, deprecated use

// .put('/items/update', addOrigin(Interfaces.GATEWAY), guard(), itemsCtrl.updateItemContent) // Update only TDs non critial properties
// .post('/items/searchItems', guard(), controllers.searchItems)
// // agent

export { GtwRouter }
