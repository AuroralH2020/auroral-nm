export type JWTPayload = {
    org: string // organisation id
    id: string // UID or AGID
    roles: string // roles in string with commas
    mail: string // email
}

export type JWTDecodedToken = {
    iss: string, 
    aud: string,
    exp: number,
    iat: number,
    sub: string
} & JWTPayload

// TBD revise
export type JWTMailToken = {
    iss: string, // Receive username
    aud: string, // Token purpose
    exp: number,
    iat: number,
    sub: string // Account secret
}
