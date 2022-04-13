#!/usr/bin/env bash

echo 'Creating application user and db'

HASH=$2b$10$iHF8jIKV3bHQQpc1k7bYy.rvwqIjm0IE.ZJ8CNFtRskJUyNvTToXC
MONGO_PORT=27017
MONGO_INITDB_DATABASE=auroraldb

echo 'Adding first user and organisation'

mongo ${MONGO_INITDB_DATABASE} \
        --host localhost \
        --port ${MONGO_PORT} \
        --eval "db.accounts.insert({roles: ['user','administrator','system integrator','devOps'], \
                tempSecret: 'T0rcqGomL+qwJc8nyvYsDg==', \
                lastUpdated: 1628075357507, \
                created: 1627827321840, \
                verified: true, \
                username: 'jorge.almela@bavenir.eu', \
                passwordHash: '${HASH}', \
                cid: '904b7c42-7b4b-4637-aa38-e96a55ff4288', \
                uid: '19951f90-6d59-4648-ae06-08e15549f1f1'});"

mongo ${MONGO_INITDB_DATABASE} \
        --host localhost \
        --port ${MONGO_PORT} \
        --eval "db.users.insert({roles: ['user','administrator','system integrator','devOps'], \
                status: 'active', \
                lastUpdated: 1628075357507, \
                created: 1627827321840, \
                email: 'jorge.almela@bavenir.eu', \
                firstName: 'J', \
                lastName: 'A', \
                hasNotifications: [], \
                hasAudits: [], \
                hasItems: [], \
                hasContracts: [], \
                accessLevel: '1', \
                name: 'J A', \
                occupation: 'Main Admin', \
                cid: '904b7c42-7b4b-4637-aa38-e96a55ff4288', \
                uid: '19951f90-6d59-4648-ae06-08e15549f1f1'});"

mongo ${MONGO_INITDB_DATABASE} \
        --host localhost \
        --port ${MONGO_PORT} \
        --eval "db.organisations.insert({status: 'active', \
                lastUpdated: 1628075357507, \
                created: 1627827321840, \
                skinColor: 'green', \
                hasNotifications: [], \
                hasAudits: [], \
                hasUsers: ['19951f90-6d59-4648-ae06-08e15549f1f1'], \
                hasNodes: [], \
                knows: [], \
                knowsRequestsFrom: [], \
                knowsRequestsTo: [], \
                name: 'bAvenir', \
                location: 'AAA', \
                notes: 'test', \
                cid: '904b7c42-7b4b-4637-aa38-e96a55ff4288'});"
