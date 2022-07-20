import { Document, Model } from 'mongoose'
import { GtwItemInfo } from '../../types/misc-types'
import { IItem, ItemType } from '../item/types'

export enum ContractType {
    PRIVATE = 'Private',
    COMMUNITY = 'Community',
}

export enum ContractStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    DELETED = 'Deleted'
}

export type ContractItemType = {
    enabled: boolean,
    rw: boolean,
    oid: string,
    userMail: string,
    uid: string,
    cid: string,
    type: ItemType,
}
export interface IContractItemUI extends IItem {
    enabled: boolean,
    rw: boolean,
    companyName: string,
    userMail: string,
}

export interface IContract {
    ctid: string, // Auroral Id
    termsAndConditions: string, // text
    type: ContractType,
    status: ContractStatus,
    organisations: string[], // CIDs of joined organisations  -> organisations pending deleted
    pendingOrganisations: string[], // CIDs of pending organisations
    removedOrganisations: string[], // CIDs of removed organisations
    items: ContractItemType[], // Items shared under contract
    description: string,
    lastUpdated: number,
    created: number
}

export interface IContractUI extends IContract {
    ctid: string, // Auroral Id
    organisationsWithName: { cid: string, name: string }[], // CIDs of joined organisations  -> organisations pending deleted
    pendingOrganisationsWithName: { cid: string, name: string }[], // CIDs of pending organisations
    itemsNumber: number, // Items shared under contract
}

export interface IContractUpdate {
    description?: string
}

export interface IContractItemUpdate {
    rw?: boolean,
    enabled?: boolean
}

export type getContractstOptions = {
    ctid: string[]
    offset: number
    status?: ContractStatus
    type?: ContractType
}
export type companiesContracted = {
    ctid: string,
    contracted: boolean,
    contractRequested: boolean
}
export type agentItemType = {
    oid: string,
    rw: boolean
}

export type agentContractType = {
    cid: string,
    ctid: string | null,
    items: agentItemType[]
}

export type GetAllQuery = {
    ctid?: string | { $in: string[] } | { $contains: string },
    type?: ContractType,
    status: ContractStatus |
            { $ne: ContractStatus }
}

// Input to create a new Item
export interface IContractCreate {
    termsAndConditions: string, // text
    organisations: string[], // CIDs of joined organisations
    pendingOrganisations: string[], // CIDs of pending organisations
    description?: string,
}

export interface IContractCreatePost {
    termsAndConditions: string, // text
    parties: string[], // CIDs of joined organisations
    description?: string,
}

export interface IContractDocument extends IContract, Document {
    _updateContract: (this: IContractDocument, data: IContractUpdate) => Promise<IContractDocument>
    _removeContract: (this: IContractDocument) => Promise<void>
    _updateStatus: (this: IContractDocument,status?: ContractStatus) => Promise<void>

}

export interface IContractModel extends Model<IContractDocument> {
    _getContract: (
        this: IContractModel,
        ctid: string
    ) => Promise<IContract>
    _getContractUI: (
        this: IContractModel,
        ctid: string
    ) => Promise<IContractUI>
    _getDoc: (
        this: IContractModel,
        ctid: string
    ) => Promise<IContractDocument>
    _createContract: (
        this: IContractModel,
        data: IContractCreate
    ) => Promise<IContractDocument>
    _getAllContracts: (
        this: IContractModel,
        params: GetAllQuery,
        offset: number
    ) => Promise<IContractUI[]>
    _removeOrganisationFromContract: (
        this: IContractModel,
        ctid: string,
        cid: string
    ) => Promise<void>
    _removePendingOrganisationFromContract: (
        this: IContractModel,
        ctid: string,
        cid: string
    ) => Promise<void>
    _getContractItemsUI: (
        this: IContractModel,
        ctid: string,
        offset: number
    ) => Promise<ContractItemType[]>
    _getContractItemsGtw: (
        this: IContractModel,
        ctid: string,
    ) => Promise<GtwItemInfo[]>
    _getContractItems: (
        this: IContractModel,
        ctid: string,
    ) => Promise<string[]>
    _removeOrgItemsFromContract: (
        this: IContractModel,
        ctid: string,
        cid: string
    ) => Promise<void>
    _getOrgItemsInContract:(
        this: IContractModel,
        ctid: string,
        cid: string
    ) => Promise<string[]>
    _getItem: (
        this: IContractModel,
        ctid: string,
        oid: string) => Promise<ContractItemType>
    _addItem: (
        this: IContractModel,
        ctid: string,
        item: ContractItemType) => Promise<void>
    _editItem: (
        this: IContractModel,
        ctid: string,
        oid: string,
        data: IContractItemUpdate) => Promise<void>
    _removeItems: (
        this: IContractModel,
        ctid: string,
        oids: string[]) => Promise<void>
    _removeItemFromAllContracts: (
        this: IContractModel,
        oid: string) => Promise<void>
    _orgAcceptsContract:(
        this: IContractModel,
        ctid: string,
        cid: string
    ) => Promise<string[]>
    _getCommonPrivateContracts:(
        this: IContractModel,
        cid1: string,
        cid2: string
    ) => Promise<companiesContracted[]>
    _getNodesInContract:(
        this: IContractModel,
        ctid: string) => Promise<string[]>
    _getItemsInContractByAgid:(
        this: IContractModel,
        ctid: string,
        agid: string) => Promise<agentContractType[]>
    _count:(
        this: IContractModel
        ) => Promise<number>

}

