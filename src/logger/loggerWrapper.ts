import {Logger, LogLevel} from '@vtex/api'
import winston from 'winston'
import {VtexTransport} from './vtex-transport';

export class LoggerWrapper<T extends BaseContext> {
  public static initLogger(options: winston.LoggerOptions = {}) {
    if (LoggerWrapper._logger) {
      return LoggerWrapper._logger
    }

    LoggerWrapper._logger = winston.createLogger({
      defaultMeta: {service: 'seller-setup'},
      exitOnError: false,
      format: winston.format.json({circularValue: '[Circular]'}),
      level: 'debug',
      transports: [],
    })

    return LoggerWrapper._logger
  }
  public static getLogger<T extends BaseContext>(ctx: T, name: string) {
    if (!LoggerWrapper.loggers[name]) {
      LoggerWrapper.loggers[name] = new LoggerWrapper(ctx, name)
    }

    return LoggerWrapper.loggers[name]
  }
  // tslint:disable-next-line:variable-name
  private static _logger: winston.Logger | undefined
  private static loggers: { [key: string]: LoggerWrapper<BaseContext> } = {}

  private readonly logger: winston.Logger
  private readonly name: string
  private readonly ctx: T

  constructor(ctx: T, name: string) {
    const {
      vtex: {workspace, account, requestId, operationId, production},
    } = ctx

    this.ctx = ctx
    this.name = name
    this.logger = LoggerWrapper.initLogger().child({name, workspace, account, requestId, operationId, production})

    this.logger.transports.push(
        new VtexTransport(ctx, {
          format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json({circularValue: '[Circular]', space: 2})
          ),
        })
    )

    if (process.env.VTEX_APP_LINK && this.logger.transports.filter(t => t instanceof winston.transports.Console).length === 0) {
      this.logger.transports.push(
          new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json({circularValue: '[Circular]', space: 2})
            ),
          })
      )
    }
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
    this.logger.log(level, message, ...context)
  }
}