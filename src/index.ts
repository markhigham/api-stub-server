import 'source-map-support/register'

import { Api } from './lib/api'
import { config } from './lib/config'
import { LogManager } from './lib/logger'

const logger = LogManager.getLogger(__filename)

const api = new Api()

api.start(config.port, config.host).then(() => {
  logger.info(`Server started on ${config.host}:${config.port}`)
})
