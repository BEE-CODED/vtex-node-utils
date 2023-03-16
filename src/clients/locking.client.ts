import { InstanceOptions, IOContext, MasterData } from '@vtex/api'
import {DocumentResponse} from '@vtex/clients/build/clients/masterData/MasterDataEntity'
import { RESOURCE_LOCKS_ENTITY, RESOURCE_LOCKS_SCHEMA } from '../constants'

export class LockingClient extends MasterData {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        VtexIdclientAutCookie: context.authToken,
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public async acquire(
      namespace: string,
      key: string,
      payload: any,
      reason: string,
      ttl: number = 10
  ): Promise<DocumentResponse> {
    return this.createDocument({
      dataEntity: RESOURCE_LOCKS_ENTITY,
      fields: {
        details: payload,
        id: `${namespace}-${key}`,
        reason,
        ttl,
      },
      schema: RESOURCE_LOCKS_SCHEMA,
    })
  }

  public async release(lockId: string) {
    return this.deleteDocument({
      dataEntity: RESOURCE_LOCKS_ENTITY,
      id: lockId,
    })
  }
}
