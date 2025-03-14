export const USAGE_TYPE_SINGLE = 'single'
export const USAGE_TYPE_PERSISTENT = 'persistent'

export interface IResponse {
  count: number
  statusCode: number
  method: string
  tenant: string
  body: any
  handlerName?: string
  url: string
  usageType: string
  uid: string
}

export interface IMatchResult {
  isMatch: boolean
  routeMatch?: { [p: string]: string }
}

export interface IResponseStore {
  asJSON(): Promise<IResponse[]>
  clear(): Promise<void>
  delete(uid: string): Promise<void>
  update(response: IResponse)
  addMany(responses: any[]): Promise<void>
  push(response: IResponse): Promise<void>
  find(
    method: string,
    url: string,
    tenant: string,
  ): Promise<[IResponse, IMatchResult]>
}

export interface IResponseHandler {
  name: string
  init: (config: any) => void
  updateBody: (body: IResponse) => IResponse
}
