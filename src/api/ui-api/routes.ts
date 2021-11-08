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
.get('/registration', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), registrationCtrl.getAllRegistrations)
.get('/registration/company', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), registrationCtrl.getAllCompanyRegistrations)
.post('/registration', addOrigin(Interfaces.UI), validateBody(registrationSchema), createAudit(SourceType.ORGANISATION), registrationCtrl.postRegistration)
// .post('/registration', addOrigin(Interfaces.UI), registrationCtrl.postRegistration)
.get('/registration/:registrationId', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), registrationCtrl.getRegistration)
.put('/registration/:token', addOrigin(Interfaces.UI), validateBody(registrationStatusSchema), createAudit(SourceType.ORGANISATION), registrationCtrl.putRegistration)
.post('/registration/duplicatesUser', addOrigin(Interfaces.UI), registrationCtrl.findDuplicatesUser)
.post('/registration/duplicatesCompany', addOrigin(Interfaces.UI), registrationCtrl.findDuplicatesCompany)

// INVITATIONS
.get('/invitation/:id', addOrigin(Interfaces.UI), invitationCtrl.getInvitation)
.get('/invitation/:id/resend', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), invitationCtrl.resendInvitation)
.get('/invitations/all', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), invitationCtrl.getAllInvitations)
.post('/invitation', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), invitationCtrl.postInvitation)

// ORGANISATIONS
.get('/organisation/:cid', addOrigin(Interfaces.UI), jwt(), organisationCtrl.getOne)
.get('/organisations/:cid', addOrigin(Interfaces.UI), jwt(), organisationCtrl.getMany)
.get('/organisation/:cid/configuration', addOrigin(Interfaces.UI), jwt(), organisationCtrl.getConfiguration)
.put('/organisation/:cid', addOrigin(Interfaces.UI), jwt(), validateBody(updateOrganisationSchema), createAudit(SourceType.ORGANISATION), organisationCtrl.updateOrganisation)
.delete('/organisation', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), createAudit(SourceType.ORGANISATION), organisationCtrl.removeOrganisation)
// Send friendship request to cid by autenticated user
.post('/organisation/:cid/friendship/request', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.processFriendRequest)
// Send friendship request approval to cid from authenticated user
.post('/organisation/:cid/friendship/accept', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.acceptFriendRequest)
// Send friendship request rejection to cid from authenticated user
.post('/organisation/:cid/friendship/reject', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.rejectFriendRequest)
// Send friendship request cancelation to cid from authenticated user
.post('/organisation/:cid/friendship/cancelRequest', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.cancelFriendRequest)
// Send friendship cancelation to cid from authenticated user
.post('/organisation/:cid/friendship/cancel', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.cancelFriendship)

// USERS
.get('/user/:uid', addOrigin(Interfaces.UI), jwt(), userCtrl.getOne)
.delete('/user/:uid', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), createAudit(SourceType.USER), userCtrl.removeUser)
.get('/users/:cid', addOrigin(Interfaces.UI), jwt(), userCtrl.getMany)
.put('/user/:uid', addOrigin(Interfaces.UI), jwt(), validateBody(updateUserSchema), createAudit(SourceType.USER), userCtrl.updateUser)
.put('/user/password/:uid', addOrigin(Interfaces.UI), jwt(), validateBody(updatePasswordSchema), createAudit(SourceType.USER), userCtrl.updateUserPassword)
// .delete

// NODES
.get('/node/:agid', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]), nodeCtrl.getNode)
.get('/nodes', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]), nodeCtrl.getNodes)
.post('/node', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]), createAudit(SourceType.NODE), nodeCtrl.createNode)
.put('/node/:agid', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]), validateBody(updateNodeSchema), createAudit(SourceType.NODE), nodeCtrl.updateNode)
.get('/node/:agid/key', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]),createAudit(SourceType.NODE), nodeCtrl.getKey)
.delete('/node/:agid/key', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]), createAudit(SourceType.NODE), nodeCtrl.removeKey)
.delete('/node/:agid', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]), createAudit(SourceType.NODE), nodeCtrl.removeNode)

// ITEMS
.get('/items',  addOrigin(Interfaces.UI), jwt(), itemsCtrl.getMany)
.get('/items/company/:cid', addOrigin(Interfaces.UI), jwt(), itemsCtrl.getByCompany)
.get('/items/user/:uid', addOrigin(Interfaces.UI), jwt(), itemsCtrl.getByUser)
.get('/items/:oid', addOrigin(Interfaces.UI), jwt(), itemsCtrl.getOne)
.put('/items/:oid', addOrigin(Interfaces.UI), jwt(), validateBody(updateItemSchema), createAudit(SourceType.ITEM), itemsCtrl.updateOne)
.delete('/items/:oid', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ITEM), itemsCtrl.removeOne)

// NOTIFICATIONS
.get('/notifications/', addOrigin(Interfaces.UI), jwt(), notificationCtrl.getNotifications)
.get('/notifications/refresh', addOrigin(Interfaces.UI), jwt(), notificationCtrl.refreshNotifications)
.put('/notifications/read/:notificationId', addOrigin(Interfaces.UI), jwt(), validateBody(emptyItemSchema), notificationCtrl.setRead)

// AUDITS
.get('/audits/:id', addOrigin(Interfaces.UI), jwt(), auditCtrl.getAudits)

export { UiRouter }
