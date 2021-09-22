import Joi from 'joi'
// import JoiPassword from 'joi-password'
/**
 * Joi schema for regisdtration in UI 
 */
export const registrationSchema = Joi.object({
    name: Joi.string().required(),
    surname: Joi.string().required(),
    email: Joi.string().required(),
    // Pattern: min 8 characters, at least one uppercase, at least one lowercase
    // eslint-disable-next-line no-control-regex
    password: Joi.string().min(8).pattern(new RegExp('(?=^.{8,}$)(?=.*\d)(?=.*[!@#$%^&*]*)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$')).required()
    .messages({
        'string.pattern.base': '"password" should have minimum 8 characters with at least 1 uppercase character and 1 digit (0-9)',
        'string.empty': '"password" cannot be an empty field',
        'string.min': '"password" should have a minimum length of 8',
        'any.required': '"password" is a required field'
      }),
    occupation: Joi.string().required(),
    companyName: Joi.string(), // Not required
    companyLocation: Joi.string(),
    status: Joi.string().required(),
    termsAndConditions: Joi.bool().required(),
    type: Joi.string().required()
})

