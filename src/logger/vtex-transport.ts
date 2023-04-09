import {IOContext, Logger, LogLevel} from '@vtex/api'
import TransportStream from 'winston-transport'

declare global {
  interface BaseContext {
    vtex: IOContext
  }

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
    setImmediate(() => {
      this.logger.log(info.toString(), this.mapLogLevel(info.level))
      console.log('Logged', info)
      this.emit('logged', info)
      next(null, true)
    })
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