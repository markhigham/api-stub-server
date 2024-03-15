import * as uuid from 'uuid'

import { IResponse, USAGE_TYPE_PERSISTENT } from './interfaces'

export class Response implements IResponse {
  body: any
  statusCode: number = 200
  count: number = 0
  tenant: string
  method: string
  url: string
  usageType: string
  uid: string

  constructor(
    method: string,
    url: string,
    body: any,
    usageType: string = USAGE_TYPE_PERSISTENT,
    tenant: string = '',
    statusCode: number = 200,
  ) {
    this.usageType = usageType

    this.method = method.toLowerCase()
    this.url = url
    this.body = body
    this.tenant = tenant.toLowerCase()
    this.statusCode = statusCode
    this.uid = uuid.v4()
  }
}
