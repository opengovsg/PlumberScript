import { Token } from './Token'

export class ParseError extends Error {}

export class CliError extends Error {
  name = 'CliError'
  message: string

  constructor(message: string) {
    super()
    this.message = message
  }
}

export class SyntaxError extends Error {
  name = 'SyntaxError'
  message: string
  line?: number
  where?: string

  constructor(message: string, line?: number, where?: string) {
    super()
    this.message = message
    this.line = line
    this.where = where
  }
}

export class ResolvingError extends SyntaxError {
  name = 'ResolvingError'
}

export class RuntimeError extends Error {
  name = 'RuntimeError'
  message: string
  token: Token

  constructor(message: string, token: Token) {
    super()
    this.message = message
    this.token = token
  }
}
