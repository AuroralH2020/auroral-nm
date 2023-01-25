/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as registrations from '../../src/core/registrations'
import * as AuthServer from '../../src/auth-server/auth-server'
import { IItem, ItemPrivacy, ItemStatus } from '../../src/persistance/item/types'
import { UserModel } from '../../src/persistance/user/model'
import { IUserDocument, IUserUI, IUserUIProfile } from '../../src/persistance/user/types'
import { ILocals } from '../../src/types/locals-types'
import { RegistrationModel } from '../../src/persistance/registration/model'
import { IRegistrationDocument, IRegistrationPost, RegistrationStatus, RegistrationType } from '../../src/persistance/registration/types'
import { RolesEnum } from '../../src/types/roles'
import { JWTAURORALToken } from '../../src/types/jwt-types'
import { NotificationModel } from '../../src/persistance/notification/model'
import { InvitationModel } from '../../src/persistance/invitation/model'
import { IInvitation } from '../../src/persistance/invitation/types'

jest.mock('../../src/persistance/organisation/model.ts')
jest.mock('../../src/persistance/contract/model.ts')
jest.mock('../../src/persistance/user/model.ts')
jest.mock('../../src/persistance/account/model.ts')
jest.mock('../../src/persistance/invitation/model.ts')
jest.mock('../../src/persistance/notification/model.ts')
jest.mock('../../src/persistance/audit/model.ts')
jest.mock('../../src/persistance/item/model.ts')
jest.mock('../../src/persistance/node/model.ts')
jest.mock('../../src/microservices/commServer.ts')
jest.mock('../../src/microservices/xmppClient')
jest.mock('../../src/core/contracts.ts')
jest.mock('../../src/core/nodes')
jest.mock('../../src/auth-server/auth-server.ts')
jest.mock('../../src/auth-server/mailer.ts')
jest.mock('../../src/utils/logger')

afterEach(() => {
  jest.clearAllMocks()
})

const user1 = {
  name: 'username1',
  email: '1@1.cz',
  accessLevel: ItemPrivacy.FOR_FRIENDS
} as any as IUserUIProfile

const reg1 = {
  invitationId: 'invId',
  registrationId: 'regId',
  name: 'name',
  surname: 'surname',
  email: 'email',
  occupation: 'occupation',
  password: 'password', 
  roles: [RolesEnum.ADMIN],
  status: RegistrationStatus.VERIFIED,
  type: RegistrationType.COMPANY,
} as IRegistrationPost

describe('registrations', () => {
  it('registerNewOrganisation', async () => {
    const spy = jest.spyOn(registrations, 'registerNewOrganisation')
    jest.spyOn(RegistrationModel, '_createRegistration').mockResolvedValue({ ...reg1 } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_getUserByRole').mockResolvedValue([user1])
    await registrations.registerNewOrganisation(reg1)
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('registerInvitedUserOrOrganisation', async () => {
    const spy = jest.spyOn(registrations, 'registerInvitedUserOrOrganisation')
    jest.spyOn(InvitationModel, '_getInvitation').mockResolvedValue({ sentBy: { uid: '', email: '', organisation: '', cid: '' }, roles: RolesEnum.ADMIN } as any as  IInvitation)
    jest.spyOn(RegistrationModel, '_createRegistration').mockResolvedValue({ ...reg1 } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_getUserByRole').mockResolvedValue([user1])
    await registrations.registerInvitedUserOrOrganisation(reg1)
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('registerAfterVerification', async () => {
    const spy = jest.spyOn(registrations, 'registerAfterVerification')
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_createUser').mockResolvedValue({ ...user1 } as IUserDocument)
    jest.spyOn(AuthServer, 'verifyToken').mockResolvedValue({ iss: '123', aud: 'aaa', purpose: 'validate' } as JWTAURORALToken)
    await expect(registrations.registerAfterVerification(RegistrationStatus.VERIFIED, 'token', { audit: {} } as ILocals)).rejects.toThrow()
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1, status: RegistrationStatus.PENDING, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(AuthServer, 'verifyToken').mockResolvedValue({ iss: '123', aud: 'validate', purpose: 'validate' } as any as  JWTAURORALToken)
    await registrations.registerAfterVerification(RegistrationStatus.PENDING, 'token', { audit: {} } as ILocals)

    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1,type: RegistrationType.USER, status: RegistrationStatus.PENDING, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_getUserByRole').mockResolvedValue([{ ...user1 } as IUserUI])
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue([])
    jest.spyOn(InvitationModel, '_getInvitation').mockResolvedValue({ sentBy: { uid: '', email: '', organisation: '', cid: '' } } as IInvitation)
    await registrations.registerAfterVerification(RegistrationStatus.PENDING, 'token', { audit: {} } as ILocals)
    
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1,type: 'test', status: RegistrationStatus.PENDING, _updateStatus: async () => {} } as any as IRegistrationDocument)
    await expect(registrations.registerAfterVerification(RegistrationStatus.PENDING, 'token', { audit: {} } as ILocals)).rejects.toThrow()
    expect(spy).toHaveBeenCalledTimes(4)
  })
  it('sendVerificationMail', async () => {
    const spy = jest.spyOn(registrations, 'sendVerificationMail')
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_getUserByRole').mockResolvedValue([user1])
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue([])
    await registrations.sendVerificationMail(RegistrationStatus.PENDING, 'regid', {} as ILocals)
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('resendVerificationMail', async () => {
    const spy = jest.spyOn(registrations, 'resendVerificationMail')
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_getUserByRole').mockResolvedValue([user1])
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue([])
    await registrations.resendVerificationMail(RegistrationStatus.PENDING, 'regid', {} as ILocals)
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('declineRegistration', async () => {
    const spy = jest.spyOn(registrations, 'declineRegistration')
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_getUserByRole').mockResolvedValue([user1])
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue([])
    await registrations.declineRegistration(RegistrationStatus.PENDING, 'regid', {} as ILocals)
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('registerAfterMasterVerification', async () => {
    const spy = jest.spyOn(registrations, 'registerAfterMasterVerification')
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_createUser').mockResolvedValue({ ...user1 } as IUserDocument)
    jest.spyOn(AuthServer, 'verifyToken').mockResolvedValue({ iss: '123', aud: 'aaa' } as JWTAURORALToken)
    await expect(registrations.registerAfterMasterVerification(RegistrationStatus.VERIFIED, 'token', { audit: {} } as ILocals)).rejects.toThrow()
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1, status: RegistrationStatus.PENDING, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(AuthServer, 'verifyToken').mockResolvedValue({ iss: '123', aud: 'validate' } as JWTAURORALToken)
    await registrations.registerAfterMasterVerification(RegistrationStatus.PENDING, 'token', { audit: {} } as ILocals)

    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1,type: RegistrationType.USER, status: RegistrationStatus.PENDING, _updateStatus: async () => {} } as any as IRegistrationDocument)
    jest.spyOn(UserModel, '_getUserByRole').mockResolvedValue([{ ...user1 } as IUserUI])
    jest.spyOn(NotificationModel, '_findNotifications').mockResolvedValue([])
    jest.spyOn(InvitationModel, '_getInvitation').mockResolvedValue({ sentBy: { uid: '', email: '', organisation: '', cid: '' } } as IInvitation)
    await registrations.registerAfterMasterVerification(RegistrationStatus.PENDING, 'token', { audit: {} } as ILocals)
    
    jest.spyOn(RegistrationModel, '_getDoc').mockResolvedValue({ ...reg1,type: 'test', status: RegistrationStatus.PENDING, _updateStatus: async () => {} } as any as IRegistrationDocument)
    await expect(registrations.registerAfterMasterVerification(RegistrationStatus.PENDING, 'token', { audit: {} } as ILocals)).rejects.toThrow()
    expect(spy).toHaveBeenCalledTimes(4)
  })
})
