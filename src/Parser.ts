import { BinaryExpr, Expr, GroupingExpr, LiteralExpr, UnaryExpr } from './Expr'
import { Token } from './Token'
import { TokenType } from './TokenType'
import { SyntaxError } from './error'

/**
 * Recursive descent parser.
 *
 * Operator precedence (C-style, from lowest to highest):
 *
 * | Name       | Operators | Associates |
 * |------------|-----------|------------|
 * | Equality   | == !=     | Left       |
 * | Comparison | > >= < <= | Left       |
 * | Term       | - +       | Left       |
 * | Factor     | / *       | Left       |
 * | Unary      | ! -       | Right      |
 *
 * Language grammar (in pseudo-Backus-Naur Form):
 *
 * - expression -> equality ;
 * - equality -> comparison ( ("!="|"==") comparison )* ;
 * - term -> factor ( ("-"|"+") factor )* ;
 * - factor -> unary ( ("/"|"*") unary )* | primary ;
 * - primary -> NUMBER | STRING | "true" | "false" | "nil" | "(" expression ")" ;
 */

export class Parser {
  private tokens: Array<Token>
  private current: number = 0

  constructor(tokens: Array<Token>) {
    this.tokens = tokens
  }

  parse(): Expr {
    return this.expression()
  }

  private expression(): Expr {
    return this.equality()
  }

  private equality(): Expr {
    let expr: Expr = this.comparison()
    while (this.match(TokenType.BangEqual, TokenType.EqualEqual)) {
      const operator: Token = this.previous()
      const right: Expr = this.comparison()
      expr = new BinaryExpr(expr, operator, right)
    }
    return expr
  }

  private comparison(): Expr {
    let expr: Expr = this.term()

    while (
      this.match(
        TokenType.Greater,
        TokenType.GreaterEqual,
        TokenType.Less,
        TokenType.LessEqual,
      )
    ) {
      const operator: Token = this.previous()
      const right: Expr = this.term()
      expr = new BinaryExpr(expr, operator, right)
    }
    return expr
  }

  private term(): Expr {
    let expr: Expr = this.factor()

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator: Token = this.previous()
      const right = this.factor()
      expr = new BinaryExpr(expr, operator, right)
    }
    return expr
  }

  private factor(): Expr {
    let expr: Expr = this.unary()

    while (this.match(TokenType.Slash, TokenType.Star)) {
      const operator: Token = this.previous()
      const right: Expr = this.unary()
      expr = new BinaryExpr(expr, operator, right)
    }
    return expr
  }

  private unary(): Expr {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator: Token = this.previous()
      const right: Expr = this.unary()
      return new UnaryExpr(operator, right)
    }
    return this.primary()
  }

  private primary(): Expr {
    if (this.match(TokenType.False)) return new LiteralExpr(false)
    if (this.match(TokenType.True)) return new LiteralExpr(true)
    if (this.match(TokenType.Nil)) return new LiteralExpr(null)

    if (this.match(TokenType.Number, TokenType.String))
      return new LiteralExpr(this.previous().literal)

    if (this.match(TokenType.LeftParen)) {
      const expr = this.expression()
      this.consume(TokenType.RightParen, "Expect ')' after expression.")
      return new GroupingExpr(expr)
    }

    throw this.error(this.peek(), 'Expect expression.')
  }

  private match(...types: Array<TokenType>): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()

    throw this.error(this.peek(), message)
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private previous(): Token {
    return this.tokens[this.current - 1]
  }

  private error(token: Token, message: string): SyntaxError {
    return token.type === TokenType.EOF
      ? new SyntaxError(message, token.line, 'end')
      : new SyntaxError(message, token.line, `'${token.lexeme}'`)
  }

  private synchronize(): void {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.Semicolon) return

      switch (this.peek().type) {
        case TokenType.Class:
        case TokenType.For:
        case TokenType.Fun:
        case TokenType.If:
        case TokenType.Print:
        case TokenType.Return:
        case TokenType.Var:
        case TokenType.While:
          return
      }
      this.advance()
    }
  }
}
