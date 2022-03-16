/* eslint-disable import/first */
/* eslint-disable no-multi-str */
import * as mailer from '../../src/auth-server/mailer'
import { InvitationType } from '../../src/persistance/invitation/types'
import { RegistrationType } from '../../src/persistance/registration/types'

jest.mock('../../src/utils/logger')
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockReturnValue((mailoptions:any, callback:any) => {})
    })
  }))

describe('Mailer', () => {
    it('recoverPassword', async () => {
        const spy = jest.spyOn(mailer, 'recoverPassword')
        await mailer.recoverPassword('username', 'token')
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('verificationMail', async () => {
        const spy = jest.spyOn(mailer, 'verificationMail')
        await mailer.verificationMail('username', 'token', RegistrationType.COMPANY)
        await mailer.verificationMail('username', 'token', RegistrationType.USER)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('notifyDevOpsOfNewRegistration', async () => {
        const spy = jest.spyOn(mailer, 'notifyDevOpsOfNewRegistration')
        await mailer.notifyDevOpsOfNewRegistration('username', 'company')
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('rejectRegistration', async () => {
        const spy = jest.spyOn(mailer, 'rejectRegistration')
        await mailer.rejectRegistration('username', 'company')
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('invitationMail', async () => {
        const spy = jest.spyOn(mailer, 'invitationMail')
        await mailer.invitationMail('username', 'id', InvitationType.USER)
        await mailer.invitationMail('username', 'id', InvitationType.COMPANY)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('passwordlessLogin', async () => {
        const spy = jest.spyOn(mailer, 'passwordlessLogin')
        await mailer.passwordlessLogin('username', 'token')
        expect(spy).toHaveBeenCalledTimes(1)
    })
})
