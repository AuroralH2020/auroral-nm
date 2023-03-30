// Types and Ifaces for res.locals

import { ItemType } from '../persistance/item/types'
import { ContractType } from '../persistance/contract/types'

export type SmartContractItemType = {
    enabled: boolean
    write: boolean
    object_id: string
    org_id: string
    object_type: ItemType
}

export type SmartContractType = {
    contract_id: string
    contract_type: ContractType
    contract_status: string
    orgs: string[]
    items: SmartContractItemType[]
    last_updated: string
    created: string
}

export type SmartContractUserType = {
    id: string,
    createdTimestamp: number,
    enabled: boolean,
    username: string,
    email: string,
    attributes: {
        cid: string
    }
}
