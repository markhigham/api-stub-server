import { Router } from 'express'
import * as express from 'express'
import * as path from 'path'

import { LogManager } from '../logger'

const logger = LogManager.getLogger(__filename)

export function createStaticRouter() {
  logger.info('create static routes')
  const router = Router()

  // The front end website is served from the /static folder
  // we re-use node_modules for some of the dependencies which needs some rethinking
  const staticPath = path.join(__dirname + '../../../../static')
  logger.debug(staticPath)

  const nodeModules = path.join(__dirname + '../../../../node_modules')
  logger.debug(nodeModules)

  router.use('/__app/', express.static(staticPath))
  router.use('/node_modules', express.static(nodeModules))

  return router
}
