import {describe, expect, it} from '@jest/globals'
import * as winston from 'winston'
import {LoggerWrapper} from './loggerWrapper'
import {VtexTransport} from './vtex-transport'

import {IOContext, Logger, LogLevel} from '@vtex/api'

interface BaseContext {
  vtex: IOContext
}

describe('logger wrapper', () => {

  beforeAll(cb => {
    LoggerWrapper.initLogger('test-service-name', {level: 'debug', enableConsole: true})
    cb()
  })

  beforeEach(() => {
  })

  // it('should init logger with console transport', () => {
  //   expect(logger.transports.length).toBeGreaterThanOrEqual(1)
  //   expect(logger.transports.filter(t => t instanceof winston.transports.Console).length).toBe(1)
  // })

  // it('should init logger with no transports', () => {
  //   expect(logger.transports.length).toBe(0)
  // })

  it('should add VtexTransport to logger when getting named logger', cb => {
    const context = {
      account: 'test-account',
      workspace: 'test-workspace',
      requestId: 'test-request-id',
      operationId: 'test-operation-id',
      production: false,
    }

    const ctx = {
      vtex: {
        ...context,
      },
    } as BaseContext
    ctx.vtex.logger = new Logger(ctx as any)

    const namedLogger = LoggerWrapper.getLogger(ctx, 'test-logger')
    expect(namedLogger.baseLogger.transports.length).toBeGreaterThanOrEqual(1)

    let lastVtexMessage: any
    const vtexLoggerMock = jest
        .spyOn(ctx.vtex.logger, 'log')
        .mockImplementation((message: string, level: string) => {
          // console.log('Mocked logger call', message, level)
          lastVtexMessage = message
        })

    let lastConsoleMessage: any
    const consoleLogMock = jest
        .spyOn(winston.transports.Console.prototype, 'log')
        .mockImplementation((message: string) => {
          // console.log('Mocked Console call', message)
          lastConsoleMessage = message
        })

    namedLogger.debug('test message', {test: 'test'})
    expect(vtexLoggerMock).toBeCalledTimes(1)
    expect(consoleLogMock).toBeCalledTimes(1)

    const parsedLastMessage = JSON.parse(lastVtexMessage)
    expect(parsedLastMessage).toStrictEqual(expect.objectContaining({
      message: 'test message',
      test: 'test',
      service: 'test-service-name',
      name: 'test-logger',
      level: 'debug',
      ...context,
    }))
    expect(parsedLastMessage).toHaveProperty('timestamp')
    expect(parsedLastMessage).toHaveProperty('level', 'debug')


    const transports = namedLogger.baseLogger.transports
    expect(transports.filter(t => t instanceof VtexTransport).length).toBe(1)

    cb()
  })
})