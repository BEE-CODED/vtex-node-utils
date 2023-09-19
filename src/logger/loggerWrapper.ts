import winston from 'winston'

import {LogLevel} from '@vtex/api'
import {VtexTransport} from './vtex-transport'

export class LoggerWrapper<T extends BaseContext> {
  public get baseLogger() {
    return this.logger
  }

  public static getLogger<T extends BaseContext>(
      ctx: T,
      name: string,
      defaultContext: Record<string, any> = {}
  ) {
    if (!LoggerWrapper.loggers[name]) {
      LoggerWrapper.loggers[name] = new LoggerWrapper(ctx, name, defaultContext)
    }

    return LoggerWrapper.loggers[name]
  }

  public static initLogger(serviceName: string, options: winston.LoggerOptions & {
    enableConsole: boolean,
  } = {enableConsole: false}) {
    if (!LoggerWrapper._logger) {
      LoggerWrapper._logger = winston.createLogger({
        defaultMeta: {service: serviceName},
        exitOnError: false,
        format: winston.format.combine(
            winston.format.errors({stack: true}),
            winston.format.json({circularValue: '[Circular]'})
        ),
        level: options.level || 'debug',
        transports: options.transports || [],
      })

      if (options.enableConsole) {
        LoggerWrapper._logger.add(
            new winston.transports.Console({
              format: winston.format.combine(
                  winston.format.errors({stack: true}),
                  winston.format.timestamp(),
                  winston.format.colorize()
              ),
              level: LoggerWrapper._logger.level,
            })
        )
      }
    }
  }

  public static resetLogger() {
    delete LoggerWrapper._logger
    for (const key of Object.keys(LoggerWrapper.loggers)) {
      delete LoggerWrapper.loggers[key]
    }
  }

  // tslint:disable-next-line:variable-name
  private static _logger: winston.Logger | undefined
  private static loggers: { [key: string]: LoggerWrapper<BaseContext> } = {}
  private readonly context: Record<string, any> = {}

  private readonly logger: winston.Logger
  constructor(ctx: T, name: string, defaultContext: Record<string, any> = {}) {
    const {
      vtex: {workspace, account, requestId, operationId, production},
    } = ctx

    // This is shallow merging, not yet necessary to have deep merging
    this.context = {
      ...this.context,
      ...defaultContext,
      account,
      name,
      operationId,
      production,
      requestId,
      workspace,
    }

    if (!LoggerWrapper._logger) {
      throw new Error('LoggerWrapper.initLogger(name, options) must be called before getLogger()')
    }
    if (!LoggerWrapper._logger.transports.find(t => t instanceof VtexTransport)) {
      LoggerWrapper._logger.add(
          new VtexTransport(ctx.vtex.logger, {
            format: winston.format.combine(
                winston.format.errors({stack: true}),
                winston.format.timestamp(),
                winston.format.json({circularValue: '[Circular]', space: 2})
            ),
            level: LoggerWrapper._logger.level,
          })
      )
    }
    this.logger = LoggerWrapper._logger
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
    this.logger.log(level, message, {
      ...this.context,
      ...context,
    })
  }
}