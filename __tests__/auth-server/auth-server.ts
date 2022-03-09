import * as auth from '../../src/auth-server/auth-server'
import { AccountModel } from '../../src/persistance/account/model'

describe('Authentication server', () => {
    it('Hash password and verify hash', async () => {
        const spy = jest.spyOn(auth, 'hashPassword')
        const response1 = await auth.hashPassword('mygreatpassword')
        expect(typeof response1).toBe('string')
        jest.spyOn(AccountModel, '_getHash').mockResolvedValue(response1)
        const response2 = await auth.comparePassword('myuser', 'mygreatpassword')
        expect(response2).toBe(true)
        expect(spy).toHaveBeenCalledTimes(1)
    })
})
