// Express router
import { Router } from 'express'
// Controllers
import * as extCtrl from './controllers/external'

const ExternalRouter = Router()

ExternalRouter
//  AUTH
.post('/auth', extCtrl.checkExternalAuth)
// Enhanced deployment script API
.post('/node', extCtrl.createNode) // Create node
.post('/nodes', extCtrl.getNodes) // Get node
.post('/node/:agid/delete', extCtrl.removeNode) // Remove node
.put('/node/:agid', extCtrl.pushNodePubkey)
// Remove node

export { ExternalRouter }
