// Types and Ifaces for res.locals

// import { DecodedJwtToken } from './jwt-types'

export type IOriginLocals = {
    originIp: string | string[]
    realm: string
}

export type ILocals = {
    origin: IOriginLocals | null
    // decoded: DecodedJwtToken | null
    token: string | null
}
