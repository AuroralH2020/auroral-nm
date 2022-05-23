import { v4 as uuidv4 } from 'uuid'
import { ErrorSource, MyError } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils'
import {  CommunityType, ICommunity, ICommunityCreate, ICommunityDocument, ICommunityModel, ICommunityUIList } from './types'
import { SearchResult } from '../../types/misc-types'

export async function getCommunity(
  this: ICommunityModel, commId: string
): Promise<ICommunity> {
  const record = await this.findOne(
    { commId }
    ).lean().exec()
  if (record) {
    return record
  } else {
    throw new MyError('Community not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.COMMUNITY })
  }
}

export async function getCommunityUI(
  this: ICommunityModel, commId: string
): Promise<ICommunity> {
  const record = await this.aggregate([
    {
      '$match': {
        commId
      }
    }, {
      '$project': {
        'commId': 1, 
        'name': 1, 
        '_id': 0, 
        'description': 1, 
        'domain': 1,
        'organisations': 1, 
        'type': 1
      }
    }
  ]).exec()
  if (record && record[0]) {
    return record[0]
  } else {
    throw new MyError('Community not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.COMMUNITY })
  }
}

export async function getAllCommunitiesUI(
  this: ICommunityModel, type: CommunityType, offset: number, domain: string, cid: string
): Promise<ICommunityUIList[]> {
  // default offset
  offset = offset || 0
  // standardize values to be array
  const typeArray = Array.isArray(type) ? type : [type]
  let domainArray: (string | undefined) []  = Array.isArray(domain) ? domain : [domain]
  // 'undefined' -> undefined
  domainArray = domainArray.map(value => {
    return value === 'Undefined' ? undefined : value as string
  })
  // create filter 
  const filter = {
      'type': { '$in': typeArray },
    } as any

  // add domain to filter 
  if (domain !== undefined) {
    filter.domain = { '$in': domainArray }
  }
  const record = await this.aggregate(
    [
      {
        '$match': filter
      },
      {
        '$match': {
         '$or': [
           {
             'type': 'Partnership',
             'organisations.cid': cid
           },
           {
             'type': 'Community'
           }
         ]
       }
      },
      {
        '$project': {
          'organisationsNum': {
            '$size': '$organisations'
          }, 
          'name': 1, 
          'type': 1,
          '_id': 0, 
          'description': 1, 
          'organisations': 1, 
          'domain': 1, 
          'commId': 1,
          'created': 1
        }
      }, {
        '$unwind': {
          'path': '$organisations', 
          'preserveNullAndEmptyArrays': false
        }
      }, {
        '$project': {
          'nodesNum': {
            '$size': '$organisations.nodes'
          }, 
          'name': 1, 
          'type': 1,
          'domain': 1, 
          'organisationsNum': 1, 
          '_id': 0, 
          'description': 1, 
          'organisations': 1, 
          'commId': 1,
          'created': 1
        }
      }, {
        '$group': {
          '_id': '$commId', 
          'commId': {
            '$first': '$commId'
          }, 
          'name': {
            '$first': '$name'
          }, 
          'type': {
            '$first': '$type'
          }, 
          'description': {
            '$first': '$description'
          }, 
          'organisationsNum': {
            '$first': '$organisationsNum'
          }, 
          'domain': {
            '$first': '$domain'
          }, 
          'nodesNum': {
            '$sum': '$nodesNum'
          },
          'created': {
            '$first': '$created'
          }
        }
      },
      { $sort: { 'created': -1 } },
       {
        '$project': {
          '_id': 0,
          'created': 0
        }
      },
      { $skip: Number(offset) },
      { $limit: 12 }]).exec()
  if (record) {
    return record
  } else {
    throw new MyError('Communities not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.COMMUNITY })
  }
}

export async function createCommunity(
  this: ICommunityModel, data: ICommunityCreate
): Promise<ICommunityDocument> {
  const newContract = {
    ...data,
    commId: uuidv4()
  }
  return this.create(newContract)
}

export async function removeCommunity(
  this: ICommunityModel, commId: string
): Promise<void> {
  const record = await this.deleteOne(
    { commId }
  )
  if (!record.ok) {
    throw new Error('Error adding community to node')
  }
}

export async function addNodeToCommunity(
  this: ICommunityModel, commId: string, cid: string,  agid: string
): Promise<void> {
  const record = await this.updateOne(
    {
      commId,
      'organisations.cid': cid
    },
    {
      $addToSet: {
        'organisations.$.nodes': agid
    },
  }).lean().exec()
  if (!record.ok) {
    throw new Error('Error adding community to node')
  }
}

export async function removeNodeFromCommunity(
  this: ICommunityModel,  commId: string, cid: string, agid: string
): Promise<void> {
  const record = await this.updateOne(
    {
      commId,
      'organisations.cid': cid
    },
    {
      $pull: {
        'organisations.$.nodes': agid
    }
  }).lean().exec()
  if (!record.ok) {
    throw new Error('Error adding community to node')
  }
}

export async function addOrganisationToCommunity(
  this: ICommunityModel, commId: string, org: { name: string, cid: string },  
): Promise<void> {
  const record = await this.updateOne(
    {
      commId,
    },
    {
      $addToSet: {
        'organisations': 
        {
          ...org,
          nodes: []
        }
    },
  }).lean().exec()
  if (!record.ok) {
    throw new Error('Error adding community to node')
  }
}

export async function removeOrgsWithoutNodes(
  this: ICommunityModel, commId: string, cid: string,  
): Promise<void> {
  const record = await this.updateOne(
    {
      commId,
      type: CommunityType.COMMUNITY
    },
    {
      $pull: {
        'organisations': 
        {
          nodes: []
        }
    },
  }).lean().exec()
  if (!record.ok) {
    throw new Error('Error adding community to node')
  }
}

export async function getPartnershipByCids(
  this: ICommunityModel, cid1: string, cid2: string,  
): Promise<void> {
  const record = await this.aggregate([
    {
      '$match': {
        'type': CommunityType.PARTNERSHIP,
        'organisations.cid': cid1
      }
    }, {
      '$match': {
        'organisations.cid': cid2
      }
    }
  ]).exec()
  if (record && record[0]) {
    return (record[0]) 
  } else {
    throw new Error('Error gettting partnership by cid')
  }
}

export async function getOrganisationsInCommunity(
  this: ICommunityModel,  commId: string,
): Promise<string[]> {
  const record = await this.aggregate(
    [
      {
        '$match': {
          commId
        }
      },
      {
        '$group': {
          '_id': 'organisations.cid', 
          'cids': {
            '$first': '$organisations.cid'
          }
        }
      }, {
        '$project': {
          '_id': 0, 
          'organisations': '$cids'
        }
      }
    ]).exec()
    if (record && record[0] && record[0].organisations) {
      return (record[0].organisations) 
    } else {
      throw new Error('Error adding community to node')
    }
}

export async function search(
  this: ICommunityModel,  cid: string, text: string, limit: number, offset: number): Promise<SearchResult[]> {
  const record = await this.aggregate(
    [
      {
        '$match': {
          '$or': [
            {
              'type': CommunityType.COMMUNITY
            }, {
              'type': CommunityType.PARTNERSHIP,
              'organisations.cid': cid
            }
          ]
        }
      },
      {
        '$match': {
          '$or': [
              { 
                'name': {
                '$regex': text, 
                '$options': 'i'
                }
              },
              { 
                'description': {
                '$regex': text, 
                '$options': 'i'
                }
              },
          ]
        }
      },
      {
        '$project': {
          '_id': 0, 
          'type': '$type', 
          'id': '$commId', 
          'name': {
            '$cond': {
              'if': {
                '$eq': [
                  '$type', 'Partnership'
                ]
              }, 
              'then': '$description', 
              'else': '$name'
            }
          }
        }
      }
    ]).sort({ name: -1 }).skip(offset).limit(limit)
    .exec() as unknown as SearchResult[]
    if (record) {
      return record 
    } else {
      throw new Error('Error searching in communities')
    }
}

export async function getCommunitiesByAgid(
  this: ICommunityModel, agid: string
): Promise<{name: string, commId: string, description: string }[]> {
  const record = await this.aggregate([
    {
      '$match': {
        'type': 'Community', 
        'organisations.nodes': agid
      }
    }, {
      '$project': {
        '_id': 0, 
        'commId': 1, 
        'name': 1, 
        'description': 1
      }
    }
  ]).exec()
  if (record) {
    return record
  } else {
    throw new Error('Error gettintg communities by agid')
  }
}
