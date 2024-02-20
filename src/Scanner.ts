import { Token } from './ast/Token'
import { TokenType } from './ast/TokenType'
import { PlumberObject } from './ast/types'
import { SyntaxError } from './errors/error'

const keywords: Record<string, TokenType> = {
  and: TokenType.And,
  class: TokenType.Class,
  else: TokenType.Else,
  false: TokenType.False,
  for: TokenType.For,
  fun: TokenType.Fun,
  if: TokenType.If,
  nil: TokenType.Nil,
  or: TokenType.Or,
  print: TokenType.Print,
  return: TokenType.Return,
  super: TokenType.Super,
  this: TokenType.This,
  true: TokenType.True,
  let: TokenType.Let,
  while: TokenType.While,
}

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
      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance()
        } else {
          this.addToken(TokenType.Slash)
        }
        break
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break
      case '\n':
        this.line++
        break
      case '"':
        this.string()
        break
      default:
        if (this.isDigit(c)) {
          this.number()
        } else if (this.isAlpha(c)) {
          this.identifier()
        } else {
          throw new SyntaxError(`Unexpected character: ${c}`, this.line)
        }
        break
    }
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance()

    const text = this.source.substring(this.start, this.current)
    text in keywords
      ? this.addToken(keywords[text])
      : this.addToken(TokenType.Identifier)
  }

  private number(): void {
    while (this.isDigit(this.peek())) this.advance()

    // Look for a fractional part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance()

      while (this.isDigit(this.peek())) this.advance()
    }

    this.addToken(
      TokenType.Number,
      parseFloat(this.source.substring(this.start, this.current)),
    )
  }

  private string(): void {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++
      this.advance()
    }

    if (this.isAtEnd()) {
      throw new SyntaxError('Unterminated string', this.line)
    }

    this.advance() // The closing ".

    // Trim the surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1)
    this.addToken(TokenType.String, value)
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false
    if (this.source.charAt(this.current) !== expected) return false
    this.current++
    return true
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0'
    return this.source.charAt(this.current)
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0'
    return this.source.charAt(this.current + 1)
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c)
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9'
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  private advance(): string {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenType, literal?: PlumberObject): void {
    if (literal === undefined) literal = null
    const text = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }
}
