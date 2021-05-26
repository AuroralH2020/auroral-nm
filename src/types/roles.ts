/*
user
administrator - Can modify org profile
infrastructure operator - Can request services
service provider - Can have services
device owner - Can have devices
system integrator - Can set up infrastructures (gateways)
devOps - Can control org registrations, webAdmin
superUser - Can use automatic registration in API
*/
export enum RolesEnum {
    ADMIN = 'administrator',
    USER = 'user',
    INFRAS_OPERATOR = 'infrastructure operator',
    SERV_PROVIDER = 'service provider',
    DEV_OWNER = 'device owner',
    SYS_INTEGRATOR = 'system integrator',
    SUPER_USER = 'superUser',
    DEV_OPS = 'devOps'
}

