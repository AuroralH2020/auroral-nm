import { v4 as uuidv4 } from 'uuid'
import {
  agentContractType,
  companiesContracted,
  ContractItemType,
  ContractStatus,
  GetAllQuery,
  IContract,
  IContractCreate,
  IContractDocument,
  IContractItemUI,
  IContractItemUpdate,
  IContractModel,
  IContractUI
} from './types'
import { ErrorSource, MyError } from '../../utils/error-handler'
import { HttpStatusCode, obj } from '../../utils'
import { GtwItemInfo } from '../../types/misc-types'

export async function getContract(
  this: IContractModel, ctid: string
): Promise<IContract> {
  const record = await this.findOne(
    // FILTER disabled contracts
    { ctid , status: { $ne: ContractStatus.DELETED } }
    ).lean().exec()
  if (record) {
    return record
  } else {
    // logger.warn('Contract not found')
    throw new MyError('Contract not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.CONTRACT })
  }
}

export async function getContractItems(
    this: IContractModel, ctid: string
): Promise<string[]> {
  const record = await this.aggregate([
    {
      '$match': {
        'ctid': ctid
      }
    }, {
      '$project': {
        'items': '$items.oid',
        _id: 0
      }
    }
  ]).exec()
  if (record[0].items) {
    return record[0].items
  } else {
    // logger.warn('Contract not found')
    throw new MyError('Contract not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.CONTRACT })
  }
}

export async function getContractItemsGtw(
  this: IContractModel, ctid: string
  ): Promise<GtwItemInfo[]> {
    const record = await this.aggregate([
      {
        '$match': {
          'ctid': ctid
        }
      }, {
        '$unwind': {
          'path': '$items', 
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$project': {
          'oid': '$items.oid', 
          'cid': '$items.cid', 
          'enabled': '$items.enabled'
        }
      }, {
        '$match': {
          'enabled': true
        }
      }, {
        '$lookup': {
          'from': 'items', 
          'localField': 'oid', 
          'foreignField': 'oid', 
          'as': 'item'
        }
      }, {
        '$lookup': {
          'from': 'organisations', 
          'localField': 'cid', 
          'foreignField': 'cid', 
          'as': 'organisation'
        }
      }, {
        '$project': {
          '_id': 0, 
          'oid': 1, 
          'cid': 1, 
          'agid': {
            '$first': '$item.agid'
          },
          'name': {
            '$first': '$item.name'
          }, 
          'company': {
            '$first': '$organisation.name'
          }
        }
      }]).exec()
    if (record) {
      return record
    } else {
      // logger.warn('Contract not found')
      throw new MyError('Contract not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.CONTRACT })
    }
  }
export async function getContractUI(
    this: IContractModel, ctid: string
): Promise<IContractUI> {
  const record = await this.aggregate([
    {
      '$match': {
        ctid,
        status: { $ne: ContractStatus.DELETED }
      }
    }, {
      '$lookup': {
        'from': 'organisations',
        'localField': 'organisations',
        'foreignField': 'cid',
        'as': 'organisationsWithName'
      }
    }, {
      '$lookup': {
        'from': 'organisations',
        'localField': 'pendingOrganisations',
        'foreignField': 'cid',
        'as': 'pendingOrganisationsWithName'
      }
    }, {
      '$project': {
        'type': 1,
        'status': 1,
        'organisations': 1,
        'pendingOrganisations': 1,
        'organisationsWithName.cid': 1,
        'organisationsWithName.name': 1,
        'description': 1,
        'pendingOrganisationsWithName.cid': 1,
        'pendingOrganisationsWithName.name': 1,
        // 'items': 1,
        'itemsNumber': {
          '$size': '$items'
        },
        'lastUpdated': 1,
        'created': 1,
        'ctid': 1,
        'termsAndConditions': 1,
        'removedOrganisations': 1,
        '_id': 0
      }
    }
  ]).exec()
  if (record[0]) {
    return record[0]
  } else {
    // logger.warn('Contract not found')
    throw new MyError('Contract not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.CONTRACT })
  }
}

export async function getContractItemsUI(
    this: IContractModel, ctid: string,  offset: number
): Promise<IContractItemUI[]> {
  offset = offset || 0
  const record = await this.aggregate(
    [
      {
        '$match': {
          'ctid': ctid
        }
      }, {
      '$unwind': {
        'path': '$items',
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$lookup': {
        'from': 'items',
        'localField': 'items.oid',
        'foreignField': 'oid',
        'as': 'items2',
        'pipeline': []
      }
    }, {
      '$unwind': {
        'path': '$items2',
        'preserveNullAndEmptyArrays': false
      }
    },
      {
        '$lookup': {
          'from': 'organisations',
          'localField': 'items.cid',
          'foreignField': 'cid',
          'as': 'org',
          'pipeline': []
        }
      }, {
      '$unwind': {
        'path': '$org',
        'preserveNullAndEmptyArrays': false
      }
    },{
      '$project': {
        'name': '$items2.name',
        'rw': '$items.rw',
        'enabled': '$items.enabled',
        '_id': 0,
        'oid': '$items.oid',
        'cid': '$items.cid',
        'uid': '$items2.uid',
        'userMail': '$items.userMail',
        'orgName': '$org.name',
        'description': '$items2.description',
        'avatar': '$items2.avatar',
        'labels': '$items2.labels',
        'type': '$items2.type',
        'accessLevel': '$items2.accessLevel',
        'hasCommunities': '$items2.hasCommunites',
        'hasContracts': '$items2.hasContracts'
      }
    },
    { $skip: Number(offset) },
    { $limit: 12 }
    ]).exec()
  if (record) {
    return record
  } else {
    // logger.warn('Contract not found')
    throw new MyError('Contract not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.CONTRACT })
  }
}

export async function getDoc(
  this: IContractModel, ctid: string
): Promise<IContractDocument> {
  const record = await this.findOne(
    // FILTER disabled contracts
    { ctid , status: { $ne: ContractStatus.DELETED } })
    .exec()
  if (record) {
    return record
  } else {
    // logger.warn('Contract not found')
    throw new MyError('Contract not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.CONTRACT })
  }
}

export async function getAllContracts(
  this: IContractModel, params: GetAllQuery, offset: number
): Promise<IContractUI[]> {
  offset = offset || 0
  const record = await this.aggregate([
        {
          '$match': params
        }, {
        '$lookup': {
          'from': 'organisations',
          'localField': 'organisations',
          'foreignField': 'cid',
          'as': 'organisationsWithName'
        }
      }, {
        '$lookup': {
          'from': 'organisations',
          'localField': 'pendingOrganisations',
          'foreignField': 'cid',
          'as': 'pendingOrganisationsWithName'
        }
      }, {
        '$project': {
          'type': 1,
          'status': 1,
          'ctid': 1,
          'organisationsWithName.cid': 1,
          'organisationsWithName.name': 1,
          'pendingOrganisationsWithName.cid': 1,
          'pendingOrganisationsWithName.name': 1,
          'itemsNumber': {
            '$size': '$items'
          },
          'lastUpdated': 1,
          'created': 1,
          '_id': 0
        } },
    { $skip: offset },
    { $limit: 12 }])
  .exec()
  if (record) {
    return record
  } else {
    // logger.warn('Contract not found')
    throw new MyError('Contract not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.CONTRACT })
  }
}

export async function createContract(
    this: IContractModel, data: IContractCreate
  ): Promise<IContractDocument> {
    const newContract = {
      ...data,
      ctid: uuidv4()
    }
    return this.create(newContract)
}

export async function getOrgItemsInContract(
  this: IContractModel, ctid: string, cid: string
): Promise<string[]> {
  const record = await this.aggregate([
    {
      '$match': {
        'ctid': ctid,
        'items.cid': cid
      }
    }, {
      '$unwind': {
        'path': '$items',
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$match': {
        'items.cid': cid
      }
    }, {
      '$group': {
        '_id': 'items.cid',
        'cid': {
          '$first': '$items.cid'
        },
        'oids': {
          '$push': '$items.oid'
        }
      }
    }, {
      '$project': {
        'cid': 1,
        '_id': 0,
        'oids': 1
      },
    }
  ]).exec()
  if (record.length > 0 && record[0].oids) {
    return record[0].oids
  } else {
    return []
  }
}

export async function removeOrganisationFromContract(
  this: IContractModel, ctid: string, cid: string
): Promise<void> {
  const record = await this.updateOne({ ctid },
      { $pull: { items: { cid },  organisations: cid }, $push: { removedOrganisations: cid } }).exec()
  if (!record.ok) {
    throw new Error('Error removing org from contract')
  }
}

export async function removePendingOrganisationFromContract(
    this: IContractModel, ctid: string, cid: string
): Promise<void> {
  const record = await this.updateOne({ ctid },
      { $pull: { pendingOrganisations: cid } }).exec()
  if (!record.ok) {
    throw new Error('Error removing pending org from contract')
  }
}
export async function orgAcceptsContract(
    this: IContractModel, ctid: string, cid: string
): Promise<void> {
  const record = await this.updateOne({ ctid },{ $push: { organisations: cid  }, $pull: { pendingOrganisations: cid  }  }).exec()
  if (!record.ok) {
    throw new Error('Error accepting contract')
  }
}

export async function removeOrgItemsFromContract(
  this: IContractModel, ctid: string, cid: string
): Promise<void> {
  const record = await this.updateOne({ ctid }, { $pull: { items: { cid: cid } } }).exec()
  if (!record.ok) {
    throw new Error('Error removing org items from contract')
  }
}

export async function getItem(
    this: IContractModel, ctid: string, oid: string
): Promise<ContractItemType> {
  const record = await this.aggregate([
    {
      '$match': {
        'ctid': ctid,
        'items.oid': oid
      }
    }, {
      '$unwind': {
        'path': '$items',
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$project': {
        '_id': 0,
        'oid': '$items.oid',
        'enabled': '$items.enabled',
        'rw': '$items.rw',
        'type': '$items.type',
        'cid': '$items.cid',
        'uid': '$items.uid',
        'userMail': '$items.userMail'
      }
    }, {
      '$match': {
        'oid': oid
      }
    }
  ]).exec()
  if (!record[0]) {
    throw new Error('Error editing item in contract')
  }
  return record[0]
}

export async function addItem(
    this: IContractModel, ctid: string, item: ContractItemType
): Promise<void> {
  const record = await this.updateOne({ ctid }, { $push: { items: { ...item }  } })
      .exec()
  if (!record.ok) {
    throw new Error('Error removing org from contract')
  }
}

export async function editItem(
    this: IContractModel, ctid: string, oid: string,  data: IContractItemUpdate
): Promise<void> {
  const toUpdate = {
    'items.$.rw': data.rw !== undefined ? data.rw : undefined,
    'items.$.enabled': data.enabled !== undefined ? data.enabled : undefined
  }
    const record = await this.updateOne(
        { ctid,'items.oid': oid },
        { $set: obj.cleaner(toUpdate) })
        .exec()
    if (!record.ok) {
      throw new Error('Error editing item in contract')
  }
}

export async function removeItems(
    this: IContractModel, ctid: string, oids: string[]): Promise<void> {
  const record = await this.updateOne(
      { ctid },
      { $pull: { items: { oid: { $in: oids } } } })
      .exec()
  if (!record.ok) {
    throw new Error('Error removing items in contract')
  }
}

export async function removeItemFromAllContracts(
    this: IContractModel, oid: string): Promise<void> {
  const record = await this.updateMany(
      { 'items.oid': oid },
      { $pull: { items: { oid } } })
      .exec()
  if (!record.ok) {
    throw new Error('Error removing item from all  contracts')
  }
}

export async function getCommonPrivateContracts(
    this: IContractModel, cid1: string, cid2: string): Promise<companiesContracted[]> {
  if (cid1 === cid2) {
    return []
  }
  const record = await this.aggregate([
    {
      '$match': {
        'type': 'Private',
        'status': {
          '$ne': 'Deleted'
        },
        '$or': [
          {
            '$and': [
              {
                'organisations': cid1
              }, {
                'organisations': cid2
              }
            ]
          }, {
            '$and': [
              {
                'pendingOrganisations': cid1
              }, {
                'organisations': cid2
              }
            ]
          }, {
            '$and': [
              {
                'organisations': cid1
              }, {
                'pendingOrganisations': cid2
              }
            ]
          }
        ]
      }
    }, {
      '$project': {
        'ctid': 1,
        'contracted': {
          '$setIsSubset': [
            [cid1, cid2], '$organisations'
          ]
        },
        'contractRequested': {
          '$not': {
            '$setIsSubset': [
              [cid1, cid2], '$organisations'
            ]
          }
        },
        '_id': 0
      }
    }
  ]).exec()
  if (!record) {
    throw new Error('Error getting common contracts')
  }
    return record
}

export async function getItemsInContractByAgid(
    this: IContractModel, ctid: string, agid: string
): Promise<agentContractType[]> {
  const record = await this.aggregate([
    {
      '$match': {
        'ctid': ctid
      }
    }, {
      '$unwind': {
        'path': '$items',
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$project': {
        'ctid': 1,
        'oid': '$items.oid',
        'rw': '$items.rw',
        'enabled': '$items.enabled',
        '_id': 0
      }
    }, {
      '$lookup': {
        'from': 'items',
        'localField': 'oid',
        'foreignField': 'oid',
        'as': 'item'
      }
    }, {
      '$unwind': {
        'path': '$item',
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$match': {
        'item.agid': agid,
        'enabled': true
      }
    }, {
      '$project': {
        'ctid': 1,
        'oid': 1,
        'cid': '$item.cid',
        'rw': 1,
        'agid': '$item.agid'
      }
    }, {
      '$group': {
        '_id': '$ctid',
        'ctid': {
          '$first': '$ctid'
        },
        'cid': {
          '$first': '$cid'
        },
        'items': {
          '$push': {
            'oid': '$oid',
            'rw': '$rw'
          }
        }
      }
    }, {
      '$project': {
        '_id': 0
      } }]).exec()
  if (record) {
    return record
  } else {
    return []
  }
}

export async function count(
this: IContractModel): Promise<number> {
  return this.countDocuments({ status: { $ne: ContractStatus.DELETED } }).exec()
}
