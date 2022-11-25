// Types and Ifaces for res.locals

import { JWTGatewayToken, JWTAURORALToken } from './jwt-types'
import { RolesEnum } from './roles'
import { SourceType } from './misc-types'

export enum Interfaces {
    UI = 'UI',
    GATEWAY = 'Gateway',
    EXTERNAL = 'External' // External services
}

export type IOriginLocals = {
    interface: Interfaces,
    originIp: string 
    realm: string
}

export type IAuditsLabelsLocals = {
    ip?: string,
    origin?:  Interfaces,
    source?: SourceType
}

export type IAuditLocals = {
    cid: string,
    reqId: string
    labels: IAuditsLabelsLocals
}

export interface ILocalsBasic {
    origin: IOriginLocals
    token: string
    audit: IAuditLocals
    reqId: string
}

export interface ILocalsGtw extends ILocalsBasic {
    decoded: JWTGatewayToken | null
}

export interface ILocals extends ILocalsBasic {
    roles: RolesEnum[]
    decoded: JWTAURORALToken
}
