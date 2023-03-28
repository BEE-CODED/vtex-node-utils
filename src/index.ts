import {IOContext} from '@vtex/api'

declare global {
  interface BaseContext {
    vtex: IOContext
  }
}

export * from './logger/loggerWrapper'
