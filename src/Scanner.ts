import { Lox } from '.'
import { Token } from './Token'
import { TokenType } from './TokenType'
import { LoxObject } from './types'

export class Scanner {
  private source: string
  private tokens: Array<Token> = []
  private start: number = 0
  private current: number = 0
  private line: number = 1

  constructor(source: string) {
    this.source = source
  }

  scanTokens(): Array<Token> {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme
      this.start = this.current
      this.scanToken()
    }
    this.tokens.push(new Token(TokenType.EOF, '', null, this.line))
    return this.tokens
  }

  private scanToken(): void {
    const c = this.advance()
    switch (c) {
      case '(':
        this.addToken(TokenType.LeftParen)
        break
      case ')':
        this.addToken(TokenType.RightParen)
        break
      case '{':
        this.addToken(TokenType.LeftBrace)
        break
      case '}':
        this.addToken(TokenType.RightBrace)
        break
      case ',':
        this.addToken(TokenType.Comma)
        break
      case '.':
        this.addToken(TokenType.Dot)
        break
      case '-':
        this.addToken(TokenType.Minus)
        break
      case '+':
        this.addToken(TokenType.Plus)
        break
      case ';':
        this.addToken(TokenType.Semicolon)
        break
      case '*':
        this.addToken(TokenType.Star)
        break
      case '!':
        this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang)
        break
      case '=':
        this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal)
        break
      case '<':
        this.addToken(this.match('=') ? TokenType.LessEqual : TokenType.Less)
        break
      case '>':
        this.addToken(
          this.match('=') ? TokenType.GreaterEqual : TokenType.Greater,
        )
        break
      default:
        Lox.error(this.line, 'Unexpected character.')
        break
    }
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false
    if (this.source.charAt(this.current) != expected) return false
    this.current++
    return true
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  private advance(): string {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenType, literal?: LoxObject): void {
    if (literal === undefined) literal = null
    const text = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }
}
