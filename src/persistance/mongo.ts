import mongoose from 'mongoose'
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

    mongoose.connect(uri, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })

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
