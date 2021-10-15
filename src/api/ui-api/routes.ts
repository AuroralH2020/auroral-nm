// Express router
import { Router } from 'express'
// Middlewares
import { jwt, addOrigin, validateBody, createAudit } from '../middlewares/index'
// Controllers
import * as loginCtrl from './controllers/login'
import * as registrationCtrl from './controllers/registration'
import * as invitationCtrl from './controllers/invitation'
import * as organisationCtrl from './controllers/organisation'
import * as friendingCtrl from './controllers/friending'
import * as userCtrl from './controllers/user'
import * as nodeCtrl from './controllers/node'
import * as notificationCtrl from './controllers/notification'
import * as auditCtrl from './controllers/audit'
import * as itemsCtrl from './controllers/items'
// Types
import { Interfaces } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'
import { RolesEnum } from '../../types/roles'
// Joi schemas
import { updateItemSchema, updateOrganisationSchema, passwordSchema, registrationSchema, registrationStatusSchema, updateNodeSchema, updatePasswordSchema, updateUserSchema, emptyItemSchema } from '../../core/joi-schemas'

const UiRouter = Router()

UiRouter
// AUTH
.post('/login/authenticate', addOrigin(Interfaces.UI), loginCtrl.authenticate)
.post('/login/refresh', addOrigin(Interfaces.UI), jwt(), loginCtrl.refreshToken)
.post('/login/recovery', addOrigin(Interfaces.UI), loginCtrl.sendRecoverPwdMail)
.put('/login/recovery/:token', addOrigin(Interfaces.UI), validateBody(passwordSchema), loginCtrl.processRecoverPwd)
// .post('/remember', loginCtrl.rememberCookie)
// .put('/remember/:id', loginCtrl.updateCookie)

// REGISTRATION
.get('/registration', jwt([RolesEnum.DEV_OPS]), addOrigin(Interfaces.UI), registrationCtrl.getAllRegistrations)
.post('/registration', addOrigin(Interfaces.UI), validateBody(registrationSchema), createAudit(SourceType.ORGANISATION), registrationCtrl.postRegistration)
// .post('/registration', addOrigin(Interfaces.UI), registrationCtrl.postRegistration)
.get('/registration/:registrationId', jwt([RolesEnum.DEV_OPS]), addOrigin(Interfaces.UI), registrationCtrl.getRegistration)
.put('/registration/:token', addOrigin(Interfaces.UI), validateBody(registrationStatusSchema), createAudit(SourceType.ORGANISATION), registrationCtrl.putRegistration)
.post('/registration/duplicatesUser', addOrigin(Interfaces.UI), registrationCtrl.findDuplicatesUser)
.post('/registration/duplicatesCompany', addOrigin(Interfaces.UI), registrationCtrl.findDuplicatesCompany)

// INVITATIONS
.get('/invitation/:id', addOrigin(Interfaces.UI), invitationCtrl.getInvitation)
.get('/invitations/all', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), invitationCtrl.getAllInvitations)
.post('/invitation', jwt([RolesEnum.ADMIN]), addOrigin(Interfaces.UI), invitationCtrl.postInvitation)

// ORGANISATIONS
.get('/organisation/:cid', jwt(), addOrigin(Interfaces.UI), organisationCtrl.getOne)
.get('/organisations/:cid', jwt(), addOrigin(Interfaces.UI), organisationCtrl.getMany)
.get('/organisation/:cid/configuration', jwt(), addOrigin(Interfaces.UI), organisationCtrl.getConfiguration)
.put('/organisation/:cid', jwt(), addOrigin(Interfaces.UI), validateBody(updateOrganisationSchema), createAudit(SourceType.ORGANISATION), organisationCtrl.updateOrganisation)
// .delete
// Send friendship request to cid by autenticated user
.post('/organisation/:cid/friendship/request', jwt(), addOrigin(Interfaces.UI), createAudit(SourceType.ORGANISATION), friendingCtrl.processFriendRequest)
// Send friendship request approval to cid from authenticated user
.post('/organisation/:cid/friendship/accept', jwt(), addOrigin(Interfaces.UI), createAudit(SourceType.ORGANISATION), friendingCtrl.acceptFriendRequest)
// Send friendship request rejection to cid from authenticated user
.post('/organisation/:cid/friendship/reject', jwt(), addOrigin(Interfaces.UI), createAudit(SourceType.ORGANISATION), friendingCtrl.rejectFriendRequest)
// Send friendship request cancelation to cid from authenticated user
.post('/organisation/:cid/friendship/cancelRequest', jwt(), addOrigin(Interfaces.UI), createAudit(SourceType.ORGANISATION), friendingCtrl.cancelFriendRequest)
// Send friendship cancelation to cid from authenticated user
.post('/organisation/:cid/friendship/cancel', jwt(), addOrigin(Interfaces.UI), createAudit(SourceType.ORGANISATION), friendingCtrl.cancelFriendship)

// USERS
.get('/user/:uid', jwt(), addOrigin(Interfaces.UI), userCtrl.getOne)
.delete('/user/:uid', jwt(), jwt([RolesEnum.ADMIN]), addOrigin(Interfaces.UI),createAudit(SourceType.USER), userCtrl.removeUser)
.get('/users/:cid', jwt(), addOrigin(Interfaces.UI), userCtrl.getMany)
.put('/user/:uid', jwt(), addOrigin(Interfaces.UI), validateBody(updateUserSchema), createAudit(SourceType.USER), userCtrl.updateUser)
.put('/user/password/:uid', jwt(), addOrigin(Interfaces.UI), validateBody(updatePasswordSchema), createAudit(SourceType.USER), userCtrl.updateUserPassword)
// .delete

// NODES
.get('/node/:agid', jwt([RolesEnum.SYS_INTEGRATOR]), addOrigin(Interfaces.UI), nodeCtrl.getNode)
.get('/nodes', jwt([RolesEnum.SYS_INTEGRATOR]), addOrigin(Interfaces.UI), nodeCtrl.getNodes)
.post('/node', jwt([RolesEnum.SYS_INTEGRATOR]), addOrigin(Interfaces.UI), createAudit(SourceType.NODE), nodeCtrl.createNode)
.put('/node/:agid', jwt([RolesEnum.SYS_INTEGRATOR]), addOrigin(Interfaces.UI), validateBody(updateNodeSchema), createAudit(SourceType.NODE), nodeCtrl.updateNode)
.get('/node/:agid/key', jwt([RolesEnum.SYS_INTEGRATOR]), addOrigin(Interfaces.UI), createAudit(SourceType.NODE), nodeCtrl.getKey)
.delete('/node/:agid/key', jwt([RolesEnum.SYS_INTEGRATOR]), addOrigin(Interfaces.UI),createAudit(SourceType.NODE), nodeCtrl.removeKey)
.delete('/node/:agid', jwt([RolesEnum.SYS_INTEGRATOR]), addOrigin(Interfaces.UI),createAudit(SourceType.NODE), nodeCtrl.removeNode)

// ITEMS
.get('/items', jwt(), addOrigin(Interfaces.UI),  itemsCtrl.getMany)
.get('/items/:oid', jwt(), addOrigin(Interfaces.UI), itemsCtrl.getOne)
.put('/items/:oid', jwt(), addOrigin(Interfaces.UI), validateBody(updateItemSchema), createAudit(SourceType.ITEM), itemsCtrl.updateOne)
.delete('/items/:oid', jwt(), addOrigin(Interfaces.UI), createAudit(SourceType.ITEM), itemsCtrl.removeOne)

// NOTIFICATIONS
.get('/notifications/', jwt(), addOrigin(Interfaces.UI), notificationCtrl.getNotifications)
.get('/notifications/refresh', jwt(), addOrigin(Interfaces.UI), notificationCtrl.refreshNotifications)
.put('/notifications/read/:notificationId', jwt(), addOrigin(Interfaces.UI), validateBody(emptyItemSchema), notificationCtrl.setRead)

// AUDITS
.get('/audits/:id', jwt(), addOrigin(Interfaces.UI), auditCtrl.getAudits)

export { UiRouter }
