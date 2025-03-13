import * as clone from 'clone'

import { config } from './config'
import { IResponse } from './interfaces'
import * as moment from "moment";

const baselineTimer = new Date()

export class ResponseInterpolator {
  static interpolate(
    response: IResponse,
    matchResult: { [p: string]: string },
    tenant: string = '',
  ): any {
    const now = new Date()
    const ticks = now.getTime() - baselineTimer.getTime()
    const seconds = moment(now).diff(moment(baselineTimer), 'seconds')
    const count = String(++response.count)

    const body = clone(response.body)

    if (config.echoRouteParams) {
      Object.assign(body, matchResult)
    }

    const json = JSON.stringify(body)
    let replaced = json.replace(/{{\$ticks}}/g, ticks.toString())
    replaced = replaced.replace(/{{\$seconds}}/g, seconds.toString())
    replaced = replaced.replace(/{{\$count}}/g, count)
    replaced = replaced.replace(/{{\$uid}}/g, response.uid)
    replaced = replaced.replace(/{{\$tenant}}/g, tenant)
    return JSON.parse(replaced)
  }
}
