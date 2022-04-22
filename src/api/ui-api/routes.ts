// Express router
import { Router } from 'express'
// Middlewares
import { jwt, addOrigin, validateBody, createAudit } from '../middlewares/index'
// Controllers
import * as loginCtrl from './controllers/login'
import * as registrationCtrl from './controllers/registration'
import * as statisticsCtrl from './controllers/statistics'
import * as invitationCtrl from './controllers/invitation'
import * as organisationCtrl from './controllers/organisation'
import * as friendingCtrl from './controllers/friending'
import * as userCtrl from './controllers/user'
import * as nodeCtrl from './controllers/node'
import * as notificationCtrl from './controllers/notification'
import * as auditCtrl from './controllers/audit'
import * as itemsCtrl from './controllers/items'
import * as contractsCtrl from './controllers/contracts'
import * as communitiesCtrl from './controllers/communities'
// Types
import { Interfaces } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'
import { RolesEnum } from '../../types/roles'
// Joi schemas
import {
    updateItemSchema,
    updateOrganisationSchema,
    passwordSchema,
    registrationSchema,
    registrationStatusSchema,
    updateNodeSchema,
    updatePasswordSchema,
    updateUserSchema,
    emptyItemSchema,
    editContractSchema, editItemContractSchema, updateDefaultOwnersSchema
} from '../../core/joi-schemas'

const UiRouter = Router()

UiRouter
// AUTH
.post('/login/authenticate', addOrigin(Interfaces.UI), loginCtrl.authenticate)
.post('/login/refresh', addOrigin(Interfaces.UI), jwt(), loginCtrl.refreshToken)
.post('/login/recovery', addOrigin(Interfaces.UI), loginCtrl.sendRecoverPwdMail)
.put('/login/recovery/:token', addOrigin(Interfaces.UI), validateBody(passwordSchema), loginCtrl.processRecoverPwd)
.post('/login/passwordless', addOrigin(Interfaces.UI), loginCtrl.requestPasswordless)
.post('/login/passwordless/:token', addOrigin(Interfaces.UI), loginCtrl.processPasswordless)

.get('/login/remember', addOrigin(Interfaces.UI), jwt(), loginCtrl.rememberCookie)
.post('/login/remember/', addOrigin(Interfaces.UI), loginCtrl.rememberGetToken)
.delete('/login/remember/:sessionId', addOrigin(Interfaces.UI), loginCtrl.rememberDeleteToken)

// REGISTRATION
.get('/registration', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), registrationCtrl.getAllRegistrations)
.get('/registration/company', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), registrationCtrl.getAllCompanyRegistrations)
.post('/registration', addOrigin(Interfaces.UI), validateBody(registrationSchema), createAudit(SourceType.ORGANISATION), registrationCtrl.postRegistration)
// .post('/registration', addOrigin(Interfaces.UI), registrationCtrl.postRegistration)
.get('/registration/:registrationId', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), registrationCtrl.getRegistration)
.put('/registration/:token', addOrigin(Interfaces.UI), validateBody(registrationStatusSchema), createAudit(SourceType.ORGANISATION), registrationCtrl.putRegistration)
.put('/admin-registration/:registrationId', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), validateBody(registrationStatusSchema), createAudit(SourceType.ORGANISATION), registrationCtrl.putAdminRegistration)
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
// Send friendship request to cid by authenticated user
.post('/organisation/:cid/friendship/request', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.processFriendRequest)
// Send friendship request approval to cid from authenticated user
.post('/organisation/:cid/friendship/accept', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.acceptFriendRequest)
// Send friendship request rejection to cid from authenticated user
.post('/organisation/:cid/friendship/reject', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.rejectFriendRequest)
// Send friendship request cancellation to cid from authenticated user
.post('/organisation/:cid/friendship/cancelRequest', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.cancelFriendRequest)
// Send friendship cancellation to cid from authenticated user
.post('/organisation/:cid/friendship/cancel', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.ORGANISATION), friendingCtrl.cancelFriendship)

// USERS
.get('/user/:uid', addOrigin(Interfaces.UI), jwt(), userCtrl.getOne)
.delete('/user/:uid', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), createAudit(SourceType.USER), userCtrl.removeUser)
.get('/users/:cid', addOrigin(Interfaces.UI), jwt(), userCtrl.getMany)
.put('/user/:uid', addOrigin(Interfaces.UI), jwt([RolesEnum.ADMIN]), validateBody(updateUserSchema), createAudit(SourceType.USER), userCtrl.updateUser)
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
.put('/node/:agid/defaultOwner', addOrigin(Interfaces.UI), jwt([RolesEnum.SYS_INTEGRATOR]), validateBody(updateDefaultOwnersSchema), createAudit(SourceType.NODE), nodeCtrl.updateDefaultOwner)

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

// CONTRACTS
.get('/contracts/', addOrigin(Interfaces.UI), jwt(), contractsCtrl.getContracts)
.get('/contract/:ctid', addOrigin(Interfaces.UI), jwt(), contractsCtrl.getContract)
.post('/contract/', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), createAudit(SourceType.CONTRACT), contractsCtrl.createContract)
.put('/contract/:ctid', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), validateBody(editContractSchema), createAudit(SourceType.CONTRACT), contractsCtrl.editContract)
.delete('/contract/:ctid', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), createAudit(SourceType.CONTRACT), contractsCtrl.removeOrgFromContract)
.post('/contract/:ctid/accept', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), createAudit(SourceType.CONTRACT), contractsCtrl.acceptContract)
.get('/contract/:ctid/items', addOrigin(Interfaces.UI), jwt(), contractsCtrl.getContractItems)
.get('/contract/:ctid/items/company', addOrigin(Interfaces.UI), jwt(), contractsCtrl.getCompanyItems)
.post('/contract/:ctid/reject', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), createAudit(SourceType.CONTRACT), contractsCtrl.rejectContract)
.post('/contract/:ctid/invite', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), createAudit(SourceType.CONTRACT), contractsCtrl.inviteOrganisations)
.post('/contract/:ctid/item/:oid', addOrigin(Interfaces.UI), jwt(), createAudit(SourceType.CONTRACT), contractsCtrl.addItem)
.put('/contract/:ctid/item/:oid', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OWNER]), validateBody(editItemContractSchema), createAudit(SourceType.CONTRACT), contractsCtrl.editItem)
.delete('/contract/:ctid/item/:oid', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR, RolesEnum.DEV_OWNER]), createAudit(SourceType.CONTRACT), contractsCtrl.removeItem)
.delete('/contract/:ctid/items/:cid', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR, RolesEnum.DEV_OWNER]), createAudit(SourceType.CONTRACT), contractsCtrl.removeAllCompanyItems)

// COMMUNITIES
.get('/communities/', addOrigin(Interfaces.UI), jwt(), communitiesCtrl.getCommunities)
.get('/community/:commId', addOrigin(Interfaces.UI), jwt(), communitiesCtrl.getCommunity)
.post('/community/', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), communitiesCtrl.createCommunity)
.post('/community/:commId/node/:agid', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), communitiesCtrl.addNodeToCommunity)
.delete('/community/:commId/node/:agid', addOrigin(Interfaces.UI), jwt([RolesEnum.INFRAS_OPERATOR]), communitiesCtrl.removeNodeFromCommunity)

// STATISTICS
.get('/statistics/', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), statisticsCtrl.getStatistics)
.get('/statistics/:date', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), statisticsCtrl.getStatistics)
.post('/statistics/', addOrigin(Interfaces.UI), jwt([RolesEnum.DEV_OPS]), statisticsCtrl.storeStatistics)

export { UiRouter }
