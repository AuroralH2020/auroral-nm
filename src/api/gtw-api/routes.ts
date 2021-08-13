// Express router
import { Router } from 'express'
// Middlewares
import { guard, addOrigin } from '../middlewares/index'
// Controllers
import * as miscCtrl from './controllers/misc'
import * as agentCtrl from './controllers/agent'
import * as itemsCtrl from './controllers/items'
// Types
import { Interfaces } from '../../types/locals-types'

const GtwRouter = Router()

GtwRouter
.get('/handshake', guard, addOrigin(Interfaces.GATEWAY), miscCtrl.handshake)
.get('/counters', addOrigin(Interfaces.GATEWAY), guard, miscCtrl.getCounters)
.post('/counters', addOrigin(Interfaces.GATEWAY), guard, miscCtrl.sendCounters)
.get('/items/:oid', addOrigin(Interfaces.GATEWAY), guard, itemsCtrl.neighbourhood)
.post('/items/registration', addOrigin(Interfaces.GATEWAY), guard, itemsCtrl.registration)
.post('/items/remove', addOrigin(Interfaces.GATEWAY), guard, itemsCtrl.deleteItems)
.put('/items/modify', addOrigin(Interfaces.GATEWAY), guard, itemsCtrl.updateItem) // Update item
.delete('/agent/:agid', addOrigin(Interfaces.GATEWAY), guard, agentCtrl.deleteAgent)

// .put('/items/update', addOrigin(Interfaces.GATEWAY), guard, itemsCtrl.updateItemContent) // Update only TDs non critial properties
// .post('/items/td', guard, controllers.td)
// .post('/items/searchItems', guard, controllers.searchItems)
// // agent
// .get('/agent/:agid/items', guard, controllers.getAgentItems) // change to post if depends on update or use query

export { GtwRouter }
