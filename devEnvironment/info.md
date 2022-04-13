# Development Environment

## Pre-requisites

1. Docker & docker-compose

## Steps

1. Run test dbs
2. Set up .env
>  Use env.example
>> SMTP: https://ethereal.email   
>> Disabled APM and ELK (Unless testing is needed)
3. Run init.db in mongo docker machine
> docker cp .initDevDb.sh
> docker exec -it <mongo> bash
4. Run
> npm run dev

## Important info
1. Openfire must be initialize - use admin:password as credentials
2. Reset password of user jorge.almela@bavenir.eu on first run