import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from './ast/Expr'
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
} from './ast/Stmt'
import { Token } from './ast/Token'
import { TokenType } from './ast/TokenType'
import { errorReporter } from './errors/ErrorReporter'
import { SyntaxError } from './errors/error'

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
 * SYNTAX GRAMMAR (in pseudo Backus-Naur Form):
 * Start with the first rule that matches an entire program (or single REPL entry).
 * 
 * - program -> declaration* EOF ;
 * 
 * DECLARATIONS
 * A program is a series of declarations, which are the statements that bind new
 * identifiers or any of the other statement types.
 * 
 * - declaration -> classDecl | funDecl | varDecl | statement ;
 * - classDecl -> "class" IDENTIFIER ( "<" IDENTIFIER )? "{" function* "}" ;
 * - funDecl -> "function" function ;
 * - letDecl -> "let" IDENTIFIER ( "=" expression )? ";" ;
 * 
 * STATEMENTS
 * The remaining statement rules produce side effects, but do not introduce bindings.
 * - statement -> exprStmt | forStmt | ifStmt | printStmt | returnStmt | whileStmt | block ;
 * - exprStmt -> expression ";" ;
 * - forStmt -> "for" "(" ( varDecl | exprStmt | ";") expression? ";" expression? ")" statement;
 * - ifStmt -> "if" "(" expression ")" statement ( "else" statement )? ;
 * - printStmt -> "print" expression ";" ;
 * - returnStmt -> "return" expression? ";" ;
 * - whileStmt -> "while" "(" expression ")" statement ;
 * - block -> "{" declaration* "}" ;
 * 
 * EXPRESSIONS
 * Expressions produce values. There are a number of unary and binary operators with
 * different levels of precedence. Here, we use a separate rule for each precedence level
 * to make it explicit.
 * 
 * - expression -> assignment ;
 * 
 * - assignment -> ( call "." )? IDENTIFIER "=" assignment | logic_or ;
 * 
 * - logic_or -> logic_and ( "or" logic_and )* ;
 * - logic_and -> equality ( "and" equality )* ;
 * - equality -> comparison ( ("!="|"==") comparison )* ;
 * - comparison -> term ( ( ">" | ">=" | "<" | "<=") term )* ;
 * - term -> factor ( ("-"|"+") factor )* ;
 * - factor -> unary ( ("/"|"*") unary )* | primary ;
 * 
 * - unary -> ( "!" | "-" ) unary | call ;
 * - call -> primary ( "(" arguments? ")" | "." IDENTIFIER)* ;
 * - primary -> NUMBER | STRING | "true" | "false" | "null" | "(" expression ")" | IDENTIFIER | "super" "." IDENTIFIER ;
 * 
 * UTILITY RULES
 * In order to keep the above rules a little cleaner, some of the grammar is split
 * out into a few reused helper rules:
 * 
 * - function -> IDENTIFIER "(" parameters? ")" block ;
 * - parameters -> IDENTIFIER ( "," IDENTIFIER )* ;
 * - arguments -> expression ( "," expression )* ;
 * 
 * LEXICAL GRAMMAR
 * The lexical grammar is used by the scanner to group characters into tokens.
 * Where the syntax is context-free, the lexical grammar is regular - note that
 * there are no recursive rules.
 * 
 * NUMBER -> DIGIT+ ("." DIGIT+ )? ;
 * STRING -> "\"" <any char except "\"">* "\"" ;
 * IDENTIFIER -> ALPHA ( ALPHA | DIGIT )* ;
 * ALPHA -> "a" ... "z" | "A" ... "Z" | "_" ;
 * DIGIT -> "0" ... "9" ;
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

  parseRepl(): [Stmt[], Expr | null] {
    // In the REPL, users can input zero or more statements (ending with ';')
    // followed by an expression (without the ';'). The interpreter executes
    // all the statements. If there is a trailing expression at the end, the
    // parser resets and captures this for the interpreter to execute later.

    let cursor = this.current
    const statements: Stmt[] = []
    try {
      while (!this.isAtEnd()) {
        statements.push(this.declaration())
        cursor = this.current
      }
      return [statements, null]
    } catch (error) {
      this.current = cursor
      return [statements, this.expression()]
    }
  }

  private expression(): Expr {
    return this.assignment()
  }

  private declaration(): Stmt {
    if (this.match(TokenType.Class)) return this.classDeclaration()
    if (this.match(TokenType.Function)) return this.functionDeclaration('function')
    if (this.match(TokenType.Let)) return this.letDeclaration()
    return this.statement()
  }

  private classDeclaration(): Stmt {
    const name = this.consume(TokenType.Identifier, 'Expect class name.')

    let superclass: VariableExpr | null = null
    if (this.match(TokenType.Less)) {
      this.consume(TokenType.Identifier, 'Expect superclass name.')
      superclass = new VariableExpr(this.previous())
    }

    this.consume(TokenType.LeftBrace, "Expect '{' before class body.")

    const methods: Array<FunctionStmt> = []
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      methods.push(this.functionDeclaration('method'))
    }

    this.consume(TokenType.RightBrace, "Expect '}' after class body.")

    return new ClassStmt(name, superclass, methods)
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
    } else if (this.match(TokenType.Let)) {
      initializer = this.letDeclaration()
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

  private letDeclaration(): Stmt {
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

  private functionDeclaration(kind: string): FunctionStmt {
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
      } else if (expr instanceof GetExpr) {
        const get = expr
        return new SetExpr(get.object, get.name, value)
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
      } else if (this.match(TokenType.Dot)) {
        const name = this.consume(
          TokenType.Identifier,
          "Expect property name after '.'.",
        )
        expr = new GetExpr(expr, name)
      } else {
        break
      }
    }
    return expr
  }

  private primary(): Expr {
    if (this.match(TokenType.False)) return new LiteralExpr(false)
    if (this.match(TokenType.True)) return new LiteralExpr(true)
    if (this.match(TokenType.Null)) return new LiteralExpr(null)

    if (this.match(TokenType.Number, TokenType.String))
      return new LiteralExpr(this.previous().literal)

    if (this.match(TokenType.Super)) {
      const keyword = this.previous()
      this.consume(TokenType.Dot, "Expect '.' after 'super'.")
      const method = this.consume(TokenType.Identifier, "Expect superclass method name.")
      return new SuperExpr(keyword, method)
    }

    if (this.match(TokenType.This)) return new ThisExpr(this.previous())

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
        case TokenType.Function:
        case TokenType.If:
        case TokenType.Print:
        case TokenType.Return:
        case TokenType.Let:
        case TokenType.While:
          return
      }
      this.advance()
    }
  }
}
