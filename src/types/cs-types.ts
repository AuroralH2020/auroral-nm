import { KeyValue } from './misc-types'

export type csUser = {
    username: string,
    name?: string,
    email?: string,
    password: string | null,
    properties?: KeyValue[]
}

export type csSession = {
    sessionId: string,
    username: string,
    resource?: string,
    node: string,
    sessionStatus: string,
    presenceStatus: string,
    presenceMessage: string,
    priority: number,
    hostAddress: string,
    hostName: string,
    creationDate: number,
    lastActionDate: number,
    secure: boolean
}

export type csUserGroups = {
    groupname: string[]
}

export type csSessionCount = {
    localSessions: number,
    clusterSessions: number
}

export type csUserRoster = {
    rosterItem: csRosterItem[]
}

export type csRosterItem = {
    jid: string,
    nickname?: string,
    subscriptionType?: number,
    groups: string[]
}

export type csGroup = {
    name: string,
    description: string,
    admins?: string[],
    members: string[]
}
