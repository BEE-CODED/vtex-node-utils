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

export class VtexTransport extends TransportStream {
  constructor(private readonly logger: Logger, opts: TransportStream.TransportStreamOptions) {
    super(opts)
  }

  public log(logInfo: LogInfo, next: (err: any, result: any) => void) {
    setImmediate(() => {
      this.emit('logged', logInfo)
    })
    // @ts-ignore
    this.logger.log(logInfo[Symbol.for('message')] || logInfo.message, this.mapLogLevel(logInfo[Symbol.for('level') || logInfo.level]))
    next(null, true)
  }

  private mapLogLevel(logLevel: LogInfo['level']): LogLevel {
    switch (logLevel) {
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