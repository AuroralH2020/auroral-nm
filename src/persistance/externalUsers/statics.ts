import { v4 as uuidv4 } from 'uuid'
import { HttpStatusCode } from '../../utils'
import { MyError } from '../../utils/error-handler'
import { IExternalUserDocument, IExternalUserModel, IExternalUserCreate, IExternalUser, IExternalUserUi } from './types'

export async function createExternalUser(
    this: IExternalUserModel, data: IExternalUserCreate
  ): Promise<IExternalUserDocument> {
    return this.create({ ...data, keyid: uuidv4() })
}

export async function removeExternalUser(
    this: IExternalUserModel, keyid: string): Promise<void> {
      const record = await this.remove({ keyid }).exec()
    if (!record.ok) {
      throw new Error('Error removing external user')
    }
    return record
}

export async function getExternalUsersByCid(
    this: IExternalUserModel, cid: string
  ): Promise<IExternalUserUi[]> {
    const record = await this.find({ cid },
      { 
        name: 1,
        keyid: 1,
        ACL: 1,
        domain: 1,
        grantType: 1,
        ttl: 1,
        created: 1,
        _id: 0
      }).exec()
    if (!record) {
      throw new Error('Error retrieving external users by cid')
    }
    return record
}

export async function getByKeyid(
    this: IExternalUserModel, keyid: string
  ): Promise<IExternalUser> {
    const record = await this.findOne({ keyid }).exec()
    if (!record) {
      throw new MyError('Error retrieving external user by keyid:' + keyid, HttpStatusCode.NOT_FOUND)
    }
    return record
}
