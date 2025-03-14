import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as bearerToken from 'express-bearer-token'

import { config } from './config'
import { MemoryStore } from './datastores/memoryStore'
import {
  IResponseHandler,
  IResponseStore,
  USAGE_TYPE_SINGLE,
} from './interfaces'
import { ResponseInterpolator } from './interpolator'
import { LogManager } from './logger'
import { Response } from './response'
import { createManagementRouter } from './routes/admin'
import { createStaticRouter } from './routes/static'

const logger = LogManager.getLogger(__filename)

const handlers: Record<string, IResponseHandler>[] = []

const serverDetails = {
  host: '',
  port: 0,
}

// Set to > 0 if we should record incoming requests
// a value of 0 means no recording
let recordingCounter = 0

function tenantMiddleware(req, res, next) {
  // req.tenant = req.token || ''
  next()
}

const app = express()
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(bodyParser.json({ limit: '50mb' }))

app.use(bearerToken())
app.use(tenantMiddleware)

const responseCollection: IResponseStore = new MemoryStore()

app.get('/favicon.ico', (req, res) => {
  res.sendStatus(404)
})

app.get('/__info', (req, res) => {
  res.status(200).send(config)
})

const staticRouter = createStaticRouter()
app.use('/', staticRouter)

const managementRouter = createManagementRouter(responseCollection, '/__app')
app.use('/__response', managementRouter)

app.use((req, res, next) => {
  const method = req.method
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  )

  if (method == 'OPTIONS') {
    res.status(200).send('aah yes... options')
    res.end()
    return
  }

  next()
})

app.all('*', async (req: any, res) => {
  const method = req.method
  const url = req.url
  const tenant = req.tenant || ''

  logger.debug(`looking for ${method} ${url} on tenant ${tenant}`)

  const [response, matchResult] = await responseCollection.find(
    method,
    url,
    tenant,
  )

  if (response && response.usageType == USAGE_TYPE_SINGLE) {
    logger.info('delete single use')
    await responseCollection.delete(response.uid)
  }

  if (response) {
    let body = ResponseInterpolator.interpolate(
      response,
      matchResult.routeMatch,
      tenant,
    )

    if (response.handlerName) {
      logger.info(`${response.url} uses handler ${response.handlerName}`)
      const handler: IResponseHandler = handlers[response.handlerName]

      if (handler) {
        logger.info('found handler')
        body = handler.updateBody(body)
        response.body = body
        responseCollection.update(response)
      }
    }

    logger.info(`${response.statusCode} ${method} ${req.url} ${tenant}`)
    res.status(response.statusCode).send(body)
    return
  }

  // Not found
  if (recordingCounter != 0) {
    recordingCounter--
    logger.debug(`recordCount ${recordingCounter}`)
    const stubbedResponse = req.body
    const payload = new Response(
      req.method,
      req.url,
      req.body,
      'persistent',
      tenant,
    )

    responseCollection.push(payload)
    res.sendStatus(200)
    return
  }

  const failMessage = `404 - Not found. Try the web ui at http://${serverDetails.host}:${serverDetails.port}/__app/`
  logger.info(`404, ${method}, ${url}`)
  res.status(404).send(failMessage)
})

function start(port: number, host: string): Promise<void> {
  logger.debug(`starting ${host}:${port}`)
  return new Promise((resolve, reject) => {
    app.listen(port, host, () => {
      logger.info(`started on http://${host}:${port}`)
      serverDetails.host = host
      serverDetails.port = port
      resolve()
    })
  })
}

export class Api {
  start(port, host) {
    return start(port, host)
  }

  registerHandler(handler: IResponseHandler) {
    logger.info(`registering handler "${handler.name}"`)
    handler.init(this)
    handlers[handler.name] = handler
  }

  stop(): Promise<any> {
    // this is really hacking and i'm quite embarrassed about it
    // TODO - use stoppable
    console.log('quitting')
    return Promise.resolve()
  }

  upload(savedData) {
    return responseCollection.addMany(savedData)
  }

  startRecording(limit) {
    logger.info(`recording ${limit} requests`)
    recordingCounter = limit
  }
}
