import { TokenType } from './TokenType'
import { PlumberObject } from './types'

export class Token {
  type: TokenType
  lexeme: string
  literal: PlumberObject
  line: number

  constructor(
    type: TokenType,
    lexeme: string,
    literal: PlumberObject,
    line: number,
  ) {
    this.type = type
    this.lexeme = lexeme
    this.literal = literal
    this.line = line
  }

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`
  }
}
