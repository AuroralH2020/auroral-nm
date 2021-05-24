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
    decoded: JWTDecodedToken | null
    token: string | null
    roles: RolesEnum[]
}
