import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr'
import {
  BlockStmt,
  ClassStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from './Stmt'
import { Token } from './Token'
import { TokenType } from './TokenType'
import { errorReporter } from './ErrorReporter'
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
 * - program -> declaration* EOF ;
 * - declaration -> classDecl | funDecl | varDecl | statement ;
 * - classDecl -> "class" IDENTIFIER "{" function* "}" ;
 * - funDecl -> "fun" function ;
 * - function -> IDENTIFIER "(" parameters? ")" block ;
 * - parameters -> IDENTIFIER ( "," IDENTIFIER )* ;
 * - varDecl -> "var" IDENTIFIER ( "=" expression )? ";" ;
 * - statement -> block | exprStmt | forStmt | ifStmt | whileStmt | printStmt | returnStmt ;
 * - block -> "{" declaration* "}" ;
 * - exprStmt -> expression ";" ;
 * - forStmt -> "for" "(" ( varDecl | exprStmt | ";") expression? ";" expression? ")" statement;
 * - ifStmt -> "if" "(" expression ")" statement ( "else" statement )? ;
 * - whileStmt -> "while" "(" expression ")" statement ;
 * - printStmt -> "print" expression ";" ;
 * - returnStmt -> "return" expression? ";" ;
 * - expression -> assignment ;
 * - assignment -> IDENTIFIER "=" assignment | logic_or ;
 * - logic_or -> logic_and ( "or" logic_and )* ;
 * - logic_and -> equality ( "and" equality )* ;
 * - equality -> comparison ( ("!="|"==") comparison )* ;
 * - term -> factor ( ("-"|"+") factor )* ;
 * - factor -> unary ( ("/"|"*") unary )* | primary ;
 * - unary -> ( "!" | "-" ) unary | call ;
 * - call -> primary ( "(" arguments? ")" )* ;
 * - arguments -> expression ( "," expression )* ;
 * - primary -> NUMBER | STRING | "true" | "false" | "nil" | "(" expression ")" | IDENTIFIER ;
 */

export class Parser {
  private tokens: Array<Token>
  private current: number = 0

  constructor(tokens: Array<Token>) {
    this.tokens = tokens
  }

  parse(): Array<Stmt> {
    const statements: Array<Stmt> = []
    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration())
      } catch (error) {
        errorReporter.report(error as Error)
        this.synchronize()
      }
    }

    return statements
  }

  private expression(): Expr {
    return this.assignment()
  }

  private declaration(): Stmt {
    if (this.match(TokenType.Class)) return this.classDeclaration()
    if (this.match(TokenType.Fun)) return this.funDeclaration('function')
    if (this.match(TokenType.Var)) return this.varDeclaration()
    return this.statement()
  }

  private classDeclaration(): Stmt {
    const name = this.consume(TokenType.Identifier, 'Expect class name.')
    this.consume(TokenType.LeftBrace, "Expect '{' before class body.")

    const methods: Array<FunctionStmt> = []
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      methods.push(this.funDeclaration('method'))
    }

    this.consume(TokenType.RightBrace, "Expect '}' after class body.")

    return new ClassStmt(name, methods)
  }

  private statement(): Stmt {
    if (this.match(TokenType.For)) return this.forStatement()
    if (this.match(TokenType.If)) return this.ifStatement()
    if (this.match(TokenType.Print)) return this.printStatement()
    if (this.match(TokenType.Return)) return this.returnStatement()
    if (this.match(TokenType.While)) return this.whileStatement()
    if (this.match(TokenType.LeftBrace)) return new BlockStmt(this.block())
    return this.expressionStatement()
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'for'.")

    let initializer
    if (this.match(TokenType.Semicolon)) {
      initializer = null
    } else if (this.match(TokenType.Var)) {
      initializer = this.varDeclaration()
    } else {
      initializer = this.expressionStatement()
    }

    let condition = null
    if (!this.check(TokenType.Semicolon)) {
      condition = this.expression()
    }
    this.consume(TokenType.Semicolon, "Expect ';' after loop condition")

    let increment = null
    if (!this.check(TokenType.RightParen)) {
      increment = this.expression()
    }
    this.consume(TokenType.RightParen, "Expect ')' after for clauses.")

    let body = this.statement()

    if (increment !== null) {
      body = new BlockStmt([body, new ExpressionStmt(increment)])
    }

    if (condition === null) condition = new LiteralExpr(true)
    body = new WhileStmt(condition, body)

    if (initializer !== null) {
      body = new BlockStmt([initializer, body])
    }

    return body
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'if'.")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after if condition.")

    const thenBranch = this.statement()
    let elseBranch: Stmt | null = null

    if (this.match(TokenType.Else)) {
      elseBranch = this.statement()
    }

    return new IfStmt(condition, thenBranch, elseBranch)
  }

  private printStatement(): Stmt {
    const value: Expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after value.")
    return new PrintStmt(value)
  }

  private returnStatement(): Stmt {
    const keyword = this.previous()
    let value: Expr | null = null
    if (!this.check(TokenType.Semicolon)) {
      value = this.expression()
    }

    this.consume(TokenType.Semicolon, "Expect ';' after return value.")
    return new ReturnStmt(keyword, value)
  }

  private varDeclaration(): Stmt {
    const name: Token = this.consume(
      TokenType.Identifier,
      'Expect variable name.',
    )

    let initializer: Expr | null = null
    if (this.match(TokenType.Equal)) {
      initializer = this.expression()
    }

    this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.")
    return new VarStmt(name, initializer)
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'while'")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after condition")
    const body = this.statement()

    return new WhileStmt(condition, body)
  }

  private expressionStatement(): Stmt {
    const expr: Expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after value.")
    return new ExpressionStmt(expr)
  }

  private funDeclaration(kind: string): FunctionStmt {
    const name = this.consume(TokenType.Identifier, `Expect ${kind} name.`)
    this.consume(TokenType.LeftParen, `Expect '(' after ${kind} name.`)
    const parameters: Array<Token> = []

    if (!this.check(TokenType.RightParen)) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.")
        }
        parameters.push(
          this.consume(TokenType.Identifier, 'Expect parameter name.'),
        )
      } while (this.match(TokenType.Comma))
    }
    this.consume(TokenType.RightParen, "Expect ')' after parameters.")
    this.consume(TokenType.LeftBrace, `Expect '{' before ${kind} body.`)

    const body = this.block()

    return new FunctionStmt(name, parameters, body)
  }

  private block(): Array<Stmt> {
    const statements: Array<Stmt> = []

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }

    this.consume(TokenType.RightBrace, "Expect '}' after block.")
    return statements
  }

  private assignment(): Expr {
    const expr = this.or()

    if (this.match(TokenType.Equal)) {
      const equals = this.previous()
      const value = this.assignment()

      if (expr instanceof VariableExpr) {
        const name = expr.name
        return new AssignExpr(name, value)
      }
      this.error(equals, 'Invalid assignment target.')
    }

    return expr
  }

  private or(): Expr {
    let expr = this.and()

    while (this.match(TokenType.Or)) {
      const operator = this.previous()
      const right = this.and()
      expr = new LogicalExpr(expr, operator, right)
    }

    return expr
  }

  private and(): Expr {
    let expr = this.equality()

    while (this.match(TokenType.And)) {
      const operator = this.previous()
      const right = this.equality()
      expr = new LogicalExpr(expr, operator, right)
    }

    return expr
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
    return this.call()
  }

  private finishCall(callee: Expr): Expr {
    const args: Array<Expr> = []
    if (!this.check(TokenType.RightParen)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.")
        }
        args.push(this.expression())
      } while (this.match(TokenType.Comma))
    }

    const paren = this.consume(
      TokenType.RightParen,
      "Expect ')' after arguments.",
    )

    return new CallExpr(callee, paren, args)
  }

  private call(): Expr {
    let expr = this.primary()

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.match(TokenType.LeftParen)) {
        expr = this.finishCall(expr)
      } else {
        break
      }
    }
    return expr
  }

  private primary(): Expr {
    if (this.match(TokenType.False)) return new LiteralExpr(false)
    if (this.match(TokenType.True)) return new LiteralExpr(true)
    if (this.match(TokenType.Nil)) return new LiteralExpr(null)

    if (this.match(TokenType.Number, TokenType.String))
      return new LiteralExpr(this.previous().literal)

    if (this.match(TokenType.Identifier))
      return new VariableExpr(this.previous())

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
