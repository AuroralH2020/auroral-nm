// Types and Ifaces for res.locals

import { JWTDecodedToken } from './jwt-types'
import { RolesEnum } from './roles'

export enum Interfaces {
    UI = 'UI',
    API = 'Api',
    GATEWAY = 'Gateway'
}

export type IOriginLocals = {
    interface: Interfaces,
    originIp: string | string[]
    realm: string
}

export type ILocals = {
    origin: IOriginLocals | null
    decoded: JWTDecodedToken
    token: string
    roles: RolesEnum[]
}

export type ILocalsGtw = {
    origin: IOriginLocals | null
    decoded: {
        iss: string,
        aud: string
    } | null
    token: string | null
}
