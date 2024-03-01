import { Token } from '../ast/Token'

export abstract class PlumberError extends Error {
  name: string
  message: string
  line?: number
  where?: string

  constructor(name: string, message: string) {
    super()
    this.name = name
    this.message = message
  }

  toString(): string {
    let header = ''
    if (this instanceof SyntaxError && this.line) {
      header += `[${this.name} (line ${this.line}`
      if (this.where) header += ` at ${this.where}`
      header += ')'
    } else if (this instanceof RuntimeError) {
      header += `[${this.name} (line ${this.token.line})`
    } else if (this instanceof CliError) {
      header += `[${this.name}`
    } else {
      header += '[CliError'
    }
    header += ']'

    return `${header} ${this.message}`
  }
}

export class CliError extends PlumberError {
  constructor(message: string) {
    super('CliError', message)
  }
}

export class SyntaxError extends PlumberError {
  constructor(message: string, line?: number, where?: string) {
    super('SyntaxError', message)
    this.line = line
    this.where = where
  }
}

export class ResolvingError extends SyntaxError {
  name = 'ResolvingError'
}

export class RuntimeError extends PlumberError {
  token: Token

  constructor(message: string, token: Token) {
    super('RuntimeError', message)
    this.token = token
  }
}
