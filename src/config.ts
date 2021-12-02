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
	CS: {
		URL: process.env.CS_URL!, 
		SECRET_KEY: process.env.CS_SECRET_KEY!
	},
	XMPP_CLIENT: {
		URL: process.env.XMPP_CLIENT_URL!,
		NAME: process.env.XMPP_USERNAME!
	},
	MONGO: {
		USER: process.env.MONGO_USER!, 
		PASSWORD: process.env.MONGO_PASSWORD!,
		URL: process.env.MONGO_URL!, 
		PORT: process.env.MONGO_PORT!,
		DB: process.env.MONGO_DB!
	},
	SMTP: {
		HOST: process.env.SMTP_HOST!,
		PORT: process.env.SMTP_PORT!,
		USER: process.env.SMTP_USER!,
		PASSWORD: process.env.SMTP_PASSWORD!,
		MAIL_SERVER: process.env.SMTP_MAIL_SERVER!,
		APPROVER_MAIL: process.env.SMTP_APPROVER_MAIL!,
		SALES_MAIL: process.env.SMTP_SALES_MAIL!
	}
}
