// Express router
import { Router } from 'express'
// Middlewares
import { jwt, addOrigin, validateBody, createAudit } from '../middlewares/index'
// Controllers
import * as loginCtrl from './controllers/auth'

// Types
import { Interfaces } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'
// Joi schemas
import {
    passwordSchema,
} from '../../core/joi-schemas'

const AuthRouter = Router()

AuthRouter
// AUTH
// @UPD routes??
.post('/token', addOrigin(Interfaces.UI), createAudit(SourceType.USER), loginCtrl.authenticate)
.post('/token/refresh', addOrigin(Interfaces.UI), jwt(), loginCtrl.refreshToken)
.post('/token/introspect', addOrigin(Interfaces.EXTERNAL), loginCtrl.introspection)
// .post('/token/revoke', addOrigin(Interfaces.UI), jwt(), @TBD)
.post('/password/recovery', addOrigin(Interfaces.UI), loginCtrl.sendRecoverPwdMail)
.put('/password/recovery/:token', addOrigin(Interfaces.UI), validateBody(passwordSchema), loginCtrl.processRecoverPwd)
.post('/login/passwordless', addOrigin(Interfaces.UI), loginCtrl.requestPasswordless)
.post('/login/passwordless/:token', addOrigin(Interfaces.UI), loginCtrl.processPasswordless)
.get('/login/remember', addOrigin(Interfaces.UI), jwt(), loginCtrl.rememberCookie)
.post('/login/remember', addOrigin(Interfaces.UI), loginCtrl.rememberGetToken)
.delete('/login/remember/:sessionId', addOrigin(Interfaces.UI), loginCtrl.rememberDeleteToken)
.get('/logout', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.USER), loginCtrl.logout)

export { AuthRouter }
