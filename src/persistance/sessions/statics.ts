import { v4 as uuidv4 } from 'uuid'
import { ISession, ISessionCreate, ISessionDocument, ISessionModel } from './types'

export async function getSession(
  this: ISessionModel, sessionId: string
): Promise<ISession> {
  const record = await this.findOne({ sessionId }, {}).lean().exec()
  if (record) {
    return record
  } else {
    throw new Error('Session not found')
  }
}

export async function getDoc(
  this: ISessionModel, sessionId: string
): Promise<ISessionDocument> {
  const record = await this.findOne({ sessionId }).exec()
  if (record) {
    return record
  } else {
    throw new Error('Session not found')
  }
}

export async function createSession(
  this: ISessionModel, data: ISessionCreate
): Promise<ISessionDocument> {
  const newItem = {
    ...data,
    sessionId: uuidv4()
  }
  return this.create(newItem)
}

export async function deleteSession(
  this: ISessionModel, sessionId: string
): Promise<void> {
    this.findOne({ sessionId }, {}).remove().exec()
}
