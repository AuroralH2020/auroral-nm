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
    origin: IOriginLocals | null
    decoded: JWTDecodedToken
    token: string
    roles: RolesEnum[]
    audit: IAuditLocals
    reqId: string
}

export type ILocalsGtw = {
    origin: IOriginLocals | null
    decoded: {
        iss: string,
        aud: string
    } | null
    token: string | null
    audit: IAuditLocals
    reqId: string

}
