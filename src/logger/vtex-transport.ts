import {Logger, LogLevel} from '@vtex/api'
import TransportStream from 'winston-transport'

declare global {
  interface LogInfo {
    level: 'debug'|'info'|'warn'|'error',
    message: string,
    splat: any[],

    [key: string]: any,
  }
}

export class VtexTransport<T extends BaseContext> extends TransportStream {
  private readonly ctx: T
  private readonly logger: Logger
  constructor(ctx: T, opts: TransportStream.TransportStreamOptions) {
    super(opts)

    this.ctx = ctx
    this.logger = ctx.vtex.logger
  }

  public log(info: LogInfo, next: (err: any, result: any) => void) {
    // setImmediate(() => {
      // @ts-ignore
    this.logger.log(info[Symbol.for('message')], this.mapLogLevel(info[Symbol.for('level')]))
    next(null, true)
    // })
  }

  private mapLogLevel(level: LogInfo['level']): LogLevel {
    switch (level) {
      case 'debug':
        return LogLevel.Debug
      case 'warn':
        return LogLevel.Warn
      case 'error':
        return LogLevel.Error
      case 'info':
      default:
        return LogLevel.Info
    }
  }
}