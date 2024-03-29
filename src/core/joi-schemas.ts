import Joi from 'joi'
import { UserVisibility } from '../persistance/user/types'
import { RegistrationStatus, RegistrationType } from '../persistance/registration/types'
import { ItemStatus, ItemPrivacy, ItemDomainType, ItemType } from '../persistance/item/types'
import { RolesEnum } from '../types/roles'

// For registration in the UI
export const registrationSchema = Joi.object({
  name: Joi.string().required(),
  surname: Joi.string().required(),
  email: Joi.string().required(),
  // Pattern: min 8 characters, at least one uppercase, at least one lowercase
  // eslint-disable-next-line no-control-regex
  password: Joi.string().min(8).pattern(new RegExp('(?=^.{8,}$)(?=.*[0-9])(?=.*[!@#$%^&*]*)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$')).required()
    .messages({
      'string.pattern.base': '"password" should have minimum 8 characters with at least 1 uppercase character and 1 digit (0-9)',
      'string.empty': '"password" cannot be an empty field',
      'string.min': '"password" should have a minimum length of 8',
      'any.required': '"password" is a required field'
    }),
  type: Joi.string().allow(...Object.values(RegistrationType)).required(),
  occupation: Joi.string().required(),
  companyName: Joi.alternatives().conditional('type', { is: RegistrationType.COMPANY, then: Joi.string().required() }),
  companyLocation: Joi.alternatives().conditional('type', { is: RegistrationType.COMPANY, then: Joi.string().required() }),
  invitationId: Joi.string().allow(null, ''), // Required for Users only
  termsAndConditions: Joi.bool().allow(null, ''), // Added in server + validation in UI
  // Not used - backward compatibility
  roles: Joi.array().optional(), // Added in server
  status: Joi.string().optional(), // Added in server
  cid: Joi.string().optional(), // Added in server
})

export const passwordSchema = Joi.object({
  password: Joi.string().required(),
})

export const registrationStatusSchema = Joi.object({
  status: Joi.valid(...Object.values(RegistrationStatus)).required()
})

export const updateOrganisationSchema = Joi.object({
  name: Joi.string(),
  businessId: Joi.string(),
  location: Joi.string(),
  skinColor: Joi.string(),
  avatar: Joi.string(),
  notes: Joi.string()
})

export const updateUserSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  contactMail: Joi.string(),
  occupation: Joi.string(),
  location: Joi.string(),
  avatar: Joi.string(),
  accessLevel: Joi.valid(...Object.values(UserVisibility)),
  roles: Joi.array().items(Joi.valid(...Object.values(RolesEnum)))
})

export const updatePasswordSchema = Joi.object({
  newPwd: Joi.string().required(),
  oldPwd: Joi.string().required()
})

export const updateNodeSchema = Joi.object({
  name: Joi.string(),
  key: Joi.string(),
  visible: Joi.boolean()
  // location: Joi.string()
})

export const updateDefaultOwnersSchema = Joi.object({
  Device: Joi.string().allow(null, ''),
  Service: Joi.string().allow(null, ''),
  Marketplace: Joi.string().allow(null, '')
})

export const updateItemLabelsSchema = Joi.object({
  domain: Joi.valid(...Object.values(ItemDomainType))
})

export const updateItemSchema = Joi.object({
  oid: Joi.string(),
  name: Joi.string(), // fullName
  agid: Joi.string(),
  avatar: Joi.string(),
  accessLevel: Joi.valid(...Object.values(ItemPrivacy)),
  status: Joi.valid(...Object.values(ItemStatus)),
  description: Joi.string(),
  labels: updateItemLabelsSchema
})

export const updateItemGtwSchema = Joi.object({
    agid: Joi.string(),
    items: Joi.array().items(Joi.object(
        {
            oid: Joi.string().required(),
            name: Joi.string(),
            adapterId: Joi.string(),
            avatar: Joi.string(),
            groups: Joi.array(),
            version: Joi.string(),
            description: Joi.string(),
            labels: updateItemLabelsSchema
        }))
})

export const createItemSchema = Joi.object({
  agid: Joi.string(),
  items: Joi.array().items(Joi.object(
    {
      oid: Joi.string(),
      name: Joi.string(),
      avatar: Joi.string(),
      type: Joi.valid(...Object.values(ItemType)),
      domain: Joi.valid(...Object.values(ItemDomainType)),
      adapterId: Joi.string(),
      labels: updateItemLabelsSchema
    }))
})

export const editContractSchema = Joi.object({
    description: Joi.string(),
})

export const editItemContractSchema = Joi.object({
    rw: Joi.boolean(),
    enabled: Joi.boolean()
})

export const emptyItemSchema = Joi.object({
})
