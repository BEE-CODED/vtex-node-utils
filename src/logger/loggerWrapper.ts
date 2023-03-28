import {Logger, LogLevel} from '@vtex/api'

export class LoggerWrapper<T extends BaseContext> {
  public static getLogger<T extends BaseContext>(ctx: T, name: string) {
    return new LoggerWrapper<T>(ctx, name)
  }

  private readonly vtexLogger: Logger
  private readonly name: string
  private readonly ctx: T

  constructor(ctx: T, name: string) {
    const {vtex: {logger}} = ctx
    this.vtexLogger = logger
    this.name = name

    this.ctx = ctx
  }

  public debug(message: string, context: any = {}) {
    return this.log(message, context, LogLevel.Debug)
  }

  public info(message: string, context: any = {}) {
    return this.log(message, context, LogLevel.Info)
  }

  public warn(message: string, context: any = {}) {
    return this.log(message, context, LogLevel.Warn)
  }

  public error(message: string, context: any = {}) {
    return this.log(message, context, LogLevel.Error)
  }

  public log(message: string, context: any, level: LogLevel) {
    const {
      vtex: {workspace, account, requestId, operationId, production},
    } = this.ctx

    const log = {
      message,
      name: this.name,
      workspace,
      account,
      requestId,
      operationId,
      production,
      ...context,
    }

    this.vtexLogger.log(log, level)
    console[level](log)
  }
}