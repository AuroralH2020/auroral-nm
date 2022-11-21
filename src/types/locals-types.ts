// Types and Ifaces for res.locals

import { JWTDecodedToken } from './jwt-types'
import { RolesEnum } from './roles'
import { SourceType } from './misc-types'

export enum Interfaces {
    UI = 'UI',
    GATEWAY = 'Gateway'
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

export type ILocals = {
    origin: IOriginLocals
    decoded: JWTDecodedToken
    token: string
    roles: RolesEnum[]
    audit: IAuditLocals
    reqId: string
}

export type ILocalsGtw = {
    origin: IOriginLocals
    decoded: JWTDecodedToken | null
    token: string | null
    audit: IAuditLocals
    reqId: string

}
