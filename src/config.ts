import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()

if (
	!process.env.NODE_ENV || !process.env.IP
	|| !process.env.PORT
) {
	logger.error('Please provide valid .env configuration')
	process.exit()
}

export const Config = {
	HOME_PATH: process.cwd(),
	NODE_ENV: process.env.NODE_ENV!,
	IP: process.env.IP!,
	PORT: process.env.PORT!,
	SECRET_TOKEN: process.env.SECRET_TOKEN!,
	SCHEDULER_ENABLED: process.env.SCHEDULER_ENABLED,
	SESSIONS: {
		ENABLED: process.env.SESSIONS_ENABLED === 'true' ? true : false,
		DURATION: process.env.SESSIONS_DURATION ? Number(process.env.SESSION_DURATION) : 7200 // Defaults to 2 hour
	},
	CS: {
		URL: process.env.CS_URL!, 
		SECRET_KEY: process.env.CS_SECRET_KEY!
	},
	XMPP_CLIENT: {
		URL: process.env.XMPP_CLIENT_URL!,
		PASSWORD: process.env.XMPP_PASSWORD || 'changeme',
		DOMAIN: process.env.XMPP_DOMAIN || 'localhost',
		NAME: process.env.XMPP_USERNAME || 'auroral-dev-user'
	},
	MONGO: {
		USER: process.env.MONGO_USER!, 
		PASSWORD: process.env.MONGO_PASSWORD!,
		URL: process.env.MONGO_URL!, 
		PORT: process.env.MONGO_PORT!,
		DB: process.env.MONGO_DB!
	},
	REDIS: {
		PASSWORD: process.env.REDIS_PASSWORD,
		HOST: process.env.REDIS_HOST || 'localhost', 
		PORT: process.env.REDIS_PORT || 6379,
		CACHE: process.env.REDIS_CACHE === 'true' ? true : false,
		CACHE_TTL: process.env.REDIS_CACHE_TTL || 60, // default 60s
	},
	SMTP: {
		HOST: process.env.SMTP_HOST!,
		PORT: process.env.SMTP_PORT!,
		USER: process.env.SMTP_USER!,
		PASSWORD: process.env.SMTP_PASSWORD!,
		MAIL_SERVER: process.env.SMTP_MAIL_SERVER!,
		APPROVER_MAIL: process.env.SMTP_APPROVER_MAIL!,
		SALES_MAIL: process.env.SMTP_SALES_MAIL!
	},
	APM: {
		ACTIVE: process.env.APM_DISABLED === 'true' ? false : true,
		SERVER_URL: process.env.APM_SERVER_URL || 'https://elastic.url',
		TOKEN: process.env.APM_TOKEN || 'secret_token',
		NAME: process.env.APM_NAME || 'test'
	},
	ELK: {
		URL: process.env.ELK_URL || 'https://elastic.url',
		TOKEN: process.env.ELK_TOKEN || 'secret_token'
	},
	SLACK: {
		HOST: process.env.SLACK_HOST || 'https://hooks.slack.com/',
		HOOK: process.env.SLACK_HOOK || 'myhook'
	}
}
