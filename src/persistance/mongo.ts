import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { Config } from '../config'
import { logger } from '../utils/logger'

let database: mongoose.Connection

export const mongo = {
  connect: () => {
    let uri: string = ''
    
    if (Config.MONGO.USER) {
      uri = `mongodb://${Config.MONGO.USER}:${Config.MONGO.PASSWORD}@${Config.MONGO.URL}:${Config.MONGO.PORT}/${Config.MONGO.DB}?retryWrites=true&w=majority`
    } else {
      uri = `mongodb://${Config.MONGO.URL}:${Config.MONGO.PORT}/${Config.MONGO.DB}?retryWrites=true&w=majority`
    }

    if (database) {
      return
    }

    if (Config.MONGO.TLS) {
      mongoose.connect(uri, {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        ssl: true,
        sslValidate: true,
        tlsAllowInvalidHostnames: true,
        sslCA: [fs.readFileSync(path.join(Config.HOME_PATH, Config.MONGO.CERT))]
      })
    } else {
      mongoose.connect(uri, {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
        useCreateIndex: true
      })
    }

    database = mongoose.connection

    database.once('open', async () => {
      logger.info(`Connected to Mongo! On ${Config.MONGO.URL}:${Config.MONGO.PORT} and database ${Config.MONGO.DB}`)
    })

    database.on('error', () => {
      logger.error('Error connecting to database')
    })
  },
  disconnect: () => {
    if (!database) {
     return
    }
    mongoose.disconnect()
  }
}
