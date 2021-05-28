export type JWTPayload = {
    org: string // organisation id
    uid: string // user id
    roles: string // roles in string with commas
}

export type JWTDecodedToken = {
    iss: string, // Receive username
    aud: string,
    exp: number,
    iat: number,
    sub: string
} & JWTPayload

export type JWTMailToken = {
    iss: string, // Receive username
    aud: string, // Token purpose
    exp: number,
    iat: number,
    sub: string // Account secret
}
