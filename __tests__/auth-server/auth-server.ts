/* eslint-disable no-multi-str */
import crypto from 'bcrypt'
import * as auth from '../../src/auth-server/auth-server'
import { AccountModel } from '../../src/persistance/account/model'
import { IAccountDocument } from '../../src/persistance/account/types'

describe('Authentication server', () => {
    it('Hash password and verify hash', async () => {
        const spy = jest.spyOn(auth, 'hashPassword')
        const response1 = await auth.hashPassword('mygreatpassword')
        expect(typeof response1).toBe('string')
        jest.spyOn(AccountModel, '_getHash').mockResolvedValue(response1)
        const response2 = await auth.comparePassword('myuser', 'mygreatpassword')
        expect(response2).toBe(true)
        try {
            await auth.comparePassword('myuser', 'test')
        } catch (error) {
            expect(error.message).toMatch('Wrong password')
        }
        // expect(spy).toHaveBeenCalledTimes(1)
    })
    it('signMailToken', async () => {
        const spy = jest.spyOn(auth, 'signMailToken')
        jest.spyOn(AccountModel.prototype, '_updateTempSecret').mockResolvedValue('tempsecret')
        jest.spyOn(AccountModel, '_getDoc').mockResolvedValue({ _updateTempSecret: () => {} } as IAccountDocument)
        const response1 = await auth.signMailToken('username', 'validate')
        expect(typeof response1).toBe('string')
        await expect(auth.signMailToken('username', 'asd')).rejects.toThrow()
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('signAppToken and verifyToken', async () => {
        const spy1 = jest.spyOn(auth, 'signAppToken')
        const spy2 = jest.spyOn(auth, 'signAppToken')
        jest.spyOn(AccountModel, '_getAccount').mockResolvedValue({ username: '', uid: '', cid: '', roles: [], lastUpdated: 123, created: 123 })
        const response1 = await auth.signAppToken('username')
        expect(typeof response1).toBe('string')
        const response2 = await auth.verifyToken(response1)
        expect(response2.iss).toMatch('username')
        expect(spy1).toHaveBeenCalledTimes(1)
        expect(spy2).toHaveBeenCalledTimes(1)
    })
    it('checkTempSecret', async () => {
        const spy = jest.spyOn(auth, 'checkTempSecret')
        jest.spyOn(AccountModel, '_getDoc').mockResolvedValue({ tempSecret: 'secret', _updateTempSecret: () => {} } as IAccountDocument)
        await expect(auth.checkTempSecret('username','asdas')).rejects.toMatchObject({ status: 401 })
        const response1 = await auth.checkTempSecret('username','secret')
        expect(response1).toBe(true)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('generateSecret', async () => {
        const spy = jest.spyOn(auth, 'generateSecret')
        const response1 = await auth.generateSecret()
        expect(typeof response1).toBe('string')
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('verifyHash', async () => {
        const spy = jest.spyOn(auth, 'verifyHash')
        jest.spyOn(crypto, 'compare').mockImplementation(async () => {
            return false
        })
        const response1 = await auth.verifyHash('secret', 'hash')
        expect(response1).toBe(false)
        expect(spy).toHaveBeenCalledTimes(1)
    })
})