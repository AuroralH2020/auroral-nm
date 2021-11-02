import { INodeDocument, INodeUpdate, NodeStatus } from './types'

export async function updateNode(this: INodeDocument, data: INodeUpdate): Promise<INodeDocument> {
    this.name = data.name ? data.name : this.name
    this.key = data.key ? data.key : this.key
    this.visible = data.visible ? data.visible : this.visible
    this.visible = data.visible !== undefined ?  data.visible : this.visible
    this.hasKey = data.key ? true : this.hasKey
    this.lastUpdated = new Date().getTime()
    await this.save()
    return this
}

export async function removeNode(this: INodeDocument): Promise<void> {
    // this.agid // unique Node id
    // this.name // fullName
    // this.cid // unique organisation id
    // this.type
    // this.location: string
    this.status = NodeStatus.DELETED
    this.hasItems = []
    this.itemsCount = 0
    this.hasKey = false
    this.visible = false
    this.key = null
    this.lastUpdated = new Date().getTime()
    // this.created
    await this.save()
}
