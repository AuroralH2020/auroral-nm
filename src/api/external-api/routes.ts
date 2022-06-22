// Express router
import { Router } from 'express'
// Controllers
import * as extCtrl from './controllers/external'

const ExternalRouter = Router()

ExternalRouter
//  AUTH
.post('/auth', extCtrl.checkExternalAuth)

export { ExternalRouter }
