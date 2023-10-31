import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()

if (process.env.NODE_ENV === 'test') {
	// console.log('Using test configuration...')
} else if (
	!process.env.NODE_ENV || !process.env.IP
	|| !process.env.PORT
) {
	logger.error('Please provide valid .env configuration')
	process.exit()
}

const normalConfig = {
	HOME_PATH: process.cwd(),
	NODE_ENV: process.env.NODE_ENV!,
	IP: process.env.IP!,
	PORT: process.env.PORT!,
	SECRET_TOKEN: process.env.SECRET_TOKEN!,
	SCHEDULER_ENABLED: process.env.SCHEDULER_ENABLED,
	// default=1, if "true" convert to boolean else use value
	TRUST_PROXY: process.env.TRUST_PROXY ? process.env.TRUST_PROXY=="true"? true :  process.env.TRUST_PROXY : '1',
	SESSIONS: {
		ENABLED: process.env.SESSIONS_ENABLED === 'true' ? true : false,
		DURATION: process.env.SESSIONS_DURATION ? Number(process.env.SESSION_DURATION) : 7200 // Defaults to 2 hour
	},
	CS: {
		URL: process.env.CS_URL!, 
		SECRET_KEY: process.env.CS_SECRET_KEY!
	},
	DLT: {
		ENABLED: process.env.DLT_ENABLED === 'true' ? true : false,
		AUTH_HOST: process.env.DLT_AUTH_HOST!,
		AUTH_PORT: process.env.DLT_AUTH_PORT!,
		MANAGE_HOST: process.env.DLT_MANAGE_HOST!,
		MANAGE_PORT: process.env.DLT_MANAGE_PORT!,
		CONTRACT_HOST: process.env.DLT_CONTRACT_HOST!,
		CONTRACT_PORT: process.env.DLT_CONTRACT_PORT!,
		INTROSPECTION: {
			USER: process.env.DLT_INTROSPECTION_USER! || 'dlt_introspection',
			PASSWORD: process.env.DLT_INTROSPECTION_PASSWORD! || 'changeme'
		}
	},
	KFK: {
		HOST: process.env.KFK_HOST!,
	},
	XMPP_CLIENT: {
		URL: process.env.XMPP_CLIENT_URL!,
		PASSWORD: process.env.XMPP_PASSWORD || 'changeme',
		DOMAIN: process.env.XMPP_DOMAIN || 'redis://localhost',
		NAME: process.env.XMPP_USERNAME || 'auroral-dev-user',
		ENVIRONMENT: process.env.XMPP_ENVIRONMENT || 'auroral'
	},
	MONGO: {
		USER: process.env.MONGO_USER!, 
		PASSWORD: process.env.MONGO_PASSWORD!,
		URL: process.env.MONGO_URL!, 
		PORT: process.env.MONGO_PORT!,
		DB: process.env.MONGO_DB!,
		TLS: process.env.MONGO_TLS_ENABLED === 'true' ? true : false,
		CERT: process.env.MONGO_TLS_CERT!
	},
	REDIS: {
		PASSWORD: process.env.REDIS_PASSWORD,
		HOST: process.env.REDIS_HOST || 'localhost', 
		PORT: process.env.REDIS_PORT || 6379,
		TLS: process.env.REDIS_TLS_ENABLED === 'true' ? true : false,
		CERT: process.env.REDIS_TLS_CERT!,
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
const testConfig = {
	HOME_PATH: process.cwd(),
	NODE_ENV: process.env.NODE_ENV!,
	IP: '0.0.0.0',
	PORT: '4000',
	SECRET_TOKEN: '1234',
	SCHEDULER_ENABLED: false,
	TRUST_PROXY: '',
	SESSIONS: {
		ENABLED:  false,
		DURATION: 7200 
	},
	CS: {
		URL: '', 
		SECRET_KEY: ''
	},
	DLT: {
		ENABLED: false,
		AUTH_HOST: '',
		AUTH_PORT: '',
		MANAGE_HOST: '',
		MANAGE_PORT: '',
		CONTRACT_HOST: '',
		CONTRACT_PORT: '',
		INTROSPECTION: {
			USER: 'dlt_introspection',
			PASSWORD: 'changeme'
		}
	},
	KFK: {
		HOST: '',
	},
	XMPP_CLIENT: {
		URL: '',
		PASSWORD: 'changeme',
		DOMAIN: 'redis://localhost',
		NAME: 'auroral-dev-user',
		ENVIRONMENT: 'auroral'
	},
	MONGO: {
		USER: '',
		PASSWORD: '',
		URL: '',
		PORT:'',
		DB: '',
		TLS: '',
		CERT: '',
	},
	REDIS: {
		PASSWORD: '123',
		HOST: 'redis://localhost', 
		PORT: 6379,
		TLS: false,
		CERT: '',
		CACHE: false,
		CACHE_TTL: 60, // default 60s
	},
	SMTP: {
		HOST: '',
		PORT: '',
		USER: '',
		PASSWORD: '',
		MAIL_SERVER: '',
		APPROVER_MAIL: '',
		SALES_MAIL: '',
	},
	APM: {
		ACTIVE: false,
		SERVER_URL: 'https://elastic.url',
		TOKEN: 'secret_token',
		NAME: 'test'
	},
	ELK: {
		URL: 'https://elastic.url',
		TOKEN: 'secret_token'
	},
	SLACK: {
		HOST: 'https://hooks.slack.com/',
		HOOK: 'myhook'
	}
}
		

export const Config = process.env.NODE_ENV === 'test' ? testConfig : normalConfig 
