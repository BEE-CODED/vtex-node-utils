import {LogLevel} from '@vtex/api'
import winston from 'winston'
import {VtexTransport} from './vtex-transport'

export class LoggerWrapper<T extends BaseContext> {

  public get baseLogger() {
    return this.logger
  }

  public static getLogger<T extends BaseContext>(ctx: T, name: string) {
    if (!LoggerWrapper.loggers[name]) {
      LoggerWrapper.loggers[name] = new LoggerWrapper(ctx, name)
    }

    return LoggerWrapper.loggers[name]
  }

  public static initLogger(serviceName: string, options: winston.LoggerOptions & {
    enableConsole: boolean
  } = {enableConsole: false}) {
    if (!LoggerWrapper._logger) {
      LoggerWrapper._logger = winston.createLogger({
        defaultMeta: {service: serviceName},
        exitOnError: false,
        format: winston.format.json({circularValue: '[Circular]'}),
        level: options.level || 'info',
        transports: options.transports || [],
      })

      if (options.enableConsole) {
        LoggerWrapper._logger.add(
            new winston.transports.Console({
              format: winston.format.combine(
                  winston.format.timestamp(),
                  // winston.format.json({circularValue: '[Circular]', space: 2}),
                  winston.format.colorize()
              ),
              level: LoggerWrapper._logger.level,
            })
        )
      }
    }
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

    if (!LoggerWrapper._logger) {
      throw new Error('LoggerWrapper.initLogger(name, options) must be called before getLogger()')
    }
    this.logger = LoggerWrapper._logger.child({name, workspace, account, requestId, operationId, production})

    this.logger.add(
        new VtexTransport(ctx, {
          format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json({circularValue: '[Circular]', space: 2})
          ),
          level: LoggerWrapper._logger.level,
        })
    )
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
    this.logger.log(level, message, context)
  }
}