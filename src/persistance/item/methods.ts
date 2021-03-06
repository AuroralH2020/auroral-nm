import { IItemDocument, IItemUpdate, ItemPrivacy, ItemStatus } from './types'

export async function updateItem(this: IItemDocument, data: IItemUpdate): Promise<IItemDocument> {
    this.name = data.name ? data.name : this.name
    this.agid = data.agid ? data.agid : this.agid
    this.avatar = data.avatar ? data.avatar : this.avatar
    this.status = data.status ? data.status : this.status
    this.description = data.description ? data.description : this.description
    this.accessLevel = typeof data.accessLevel === 'number' ? data.accessLevel : this.accessLevel
    this.labels = data.labels ? data.labels : this.labels
    this.lastUpdated = new Date().getTime()
    await this.save()
    return this
}

export async function removeItem(this: IItemDocument): Promise<void> {
    this.description = undefined
    this.status = ItemStatus.DELETED
    this.accessLevel = ItemPrivacy.PRIVATE
    this.avatar = ''
    this.lastUpdated = new Date().getTime()
    await this.save()
}
