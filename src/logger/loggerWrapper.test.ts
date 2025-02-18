import {describe, expect, it} from '@jest/globals'
import * as winston from 'winston'
import {LoggerWrapper} from './loggerWrapper'
import {VtexTransport} from './vtex-transport'

import {IOContext, Logger} from '@vtex/api'

interface BaseContext {
    vtex: IOContext
}

describe('logger wrapper', () => {
    let context = {} as Partial<BaseContext['vtex']>, ctx = {} as BaseContext
    let vtexLoggerMock: jest.SpyInstance
    const numLoggers = 5 * 1000


    beforeAll(cb => {
        context = {
            account: 'test-account',
            workspace: 'test-workspace',
            requestId: 'test-request-id',
            operationId: 'test-operation-id',
            production: false,
        }

        ctx = {
            vtex: {
                ...context,
                logger: new Logger(ctx as any),
            },
        } as BaseContext

        vtexLoggerMock = jest
            .spyOn(ctx.vtex.logger, 'log')
            .mockImplementation((message: string, level: string) => {
                console.log('Mocked logger call', message, level)
            })


        LoggerWrapper.initLogger('test-service-name', {level: 'debug', enableConsole: true})

        cb()
    })

    afterEach(cb => {
        vtexLoggerMock.mockReset()
        cb()
    })

    it('should init logger with console transport', () => {
        const logger = LoggerWrapper.getLogger(ctx, 'test-logger')
        expect(logger.baseLogger.transports.length).toBeGreaterThanOrEqual(1)
        expect(logger.baseLogger.transports.filter(t => t instanceof winston.transports.Console).length).toBe(1)
    })

    it('should init logger with vtex Logger', () => {
        const logger = LoggerWrapper.getLogger(ctx, 'test-logger')
        expect(logger.baseLogger.transports.length).toBeGreaterThanOrEqual(1)
        expect(logger.baseLogger.transports.filter(t => t instanceof VtexTransport).length).toBe(1)
    })

    it(`should not crash when getting ${numLoggers} loggers`, () => {
        const loggers = []
        for (let i = 0; i < numLoggers; i++) {
            const logger = LoggerWrapper.getLogger(ctx, `test-logger-${i}`)
            logger.info('test message ' + i)
            loggers.push(logger)
            if (i > 0) {
                expect(loggers[i].baseLogger).toStrictEqual(loggers[0].baseLogger)
            }
        }

        expect(ctx.vtex.logger.log).toBeCalledTimes(numLoggers)
        expect(loggers.length).toBe(numLoggers)
    })

    // it('should init logger with no transports', () => {
    //   expect(logger.transports.length).toBe(0)
    // })

    it('should add VtexTransport to logger when getting named logger', cb => {
        const namedLogger = LoggerWrapper.getLogger(ctx, 'test-logger')
        expect(namedLogger.baseLogger.transports.length).toBeGreaterThanOrEqual(1)

        const vtexTransport = namedLogger.baseLogger.transports.find(t => t instanceof VtexTransport)
        expect(vtexTransport).toBeDefined()

        vtexLoggerMock.mockClear()
        let lastVtexMessage: any
        const localVtexLoggerMock = jest
            .spyOn(ctx.vtex.logger, 'log')
            .mockImplementation((message: string, level: string) => {
                console.log('Mocked logger call', message, level)
                lastVtexMessage = message
            })

        let lastConsoleMessage: any
        const consoleLogMock = jest
            .spyOn(winston.transports.Console.prototype, 'log')
            .mockImplementation((message?: any, ...optionalParams: any[]) => {
                console.log('Mocked Console call', message, optionalParams)
                lastConsoleMessage = message
            })

        namedLogger.debug('test message', {test: 'test'})
        expect(localVtexLoggerMock).toBeCalledTimes(1)
        expect(consoleLogMock).toBeCalledTimes(1)

        expect(localVtexLoggerMock).lastCalledWith(expect.any(String), 'debug')

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

        cb()
    })
})