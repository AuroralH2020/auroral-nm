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
	CS: {
		URL: process.env.CS_URL!, 
		SECRET_KEY: process.env.CS_SECRET_KEY!
	},
	MONGO: {
		URL: process.env.MONGO_URL!, 
		PORT: process.env.MONGO_PORT!,
		DB: process.env.MONGO_DB!
	}
}
