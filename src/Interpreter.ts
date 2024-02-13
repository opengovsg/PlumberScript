import { Environment } from './Environment'
import { errorReporter } from './ErrorReporter'
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr'
import { LoxClass } from './LoxClass'
import { LoxInstance } from './LoxInstance'
import {
  BlockStmt,
  ClassStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
  WhileStmt,
} from './Stmt'
import { Token } from './Token'
import { TokenType } from './TokenType'
import { RuntimeError } from './error'
import { LoxClockFunction } from './lib/clock'
import { LoxObject, LoxCallable, LoxFunction, Return } from './types'

export class Interpreter implements ExprVisitor<LoxObject>, StmtVisitor<void> {
  globals = new Environment()
  private environment = this.globals
  private readonly locals: Map<Expr, number> = new Map()

  constructor() {
    this.globals.define('clock', new LoxClockFunction()) // native function clock()
  }

  interpret(statements: Array<Stmt>) {
    try {
      for (const statement of statements) {
        this.execute(statement)
      }
    } catch (error) {
      errorReporter.report(error as Error)
    }
  }

  visitLiteralExpr(expr: LiteralExpr): LoxObject {
    return expr.value
  }

  visitLogicalExpr(expr: LogicalExpr): LoxObject {
    const left = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left
    } else {
      if (!this.isTruthy(left)) return left
    }

    return this.evaluate(expr.right)
  }

  visitSetExpr(expr: SetExpr): LoxObject {
    const object = this.evaluate(expr.object)

    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError('Only instances have fields.', expr.name)
    }

    const value = this.evaluate(expr.value)
    object.set(expr.name, value)

    return value
  }

  visitUnaryExpr(expr: UnaryExpr): LoxObject {
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Bang:
        return !this.isTruthy(right)
      case TokenType.Minus:
        this.checkNumberOperand(expr.operator, right)
        return -(right as number)
    }

    // Unreachable
    return null
  }

  visitVariableExpr(expr: VariableExpr): LoxObject {
    return this.lookUpVariable(expr.name, expr)
  }

  private lookUpVariable(name: Token, expr: Expr): LoxObject {
    const distance = this.locals.get(expr)
    if (distance !== undefined) {
      return this.environment.getAt(distance, name)
    } else {
      return this.globals.get(name)
    }
  }

  checkNumberOperand(operator: Token, operand: LoxObject): void {
    if (typeof operand === 'number') return
    throw new RuntimeError('Operand must be a number.', operator)
  }

  checkNumberOperands(operator: Token, left: LoxObject, right: LoxObject) {
    if (typeof left === 'number' && typeof right === 'number') return
    throw new RuntimeError('Operands must be numbers.', operator)
  }

  private isTruthy(object: LoxObject): boolean {
    if (object === null) return false
    if (typeof object === 'boolean') return object
    return true
  }

  private isEqual(a: LoxObject, b: LoxObject): boolean {
    if (a === null && b === null) return true
    if (a === null) return false
    return a === b
  }

  private stringify(object: LoxObject): string {
    if (object === null) return 'nil'

    if (typeof object === 'number') {
      let text = object.toString()
      if (text.endsWith('.0')) {
        text = text.substring(0, text.length - 2)
      }
      return text
    }

    return object.toString()
  }

  visitGroupingExpr(expr: GroupingExpr): LoxObject {
    return this.evaluate(expr.expression)
  }

  private evaluate(expr: Expr): LoxObject {
    return expr.accept(this)
  }

  private execute(stmt: Stmt) {
    stmt.accept(this)
  }

  resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth)
  }

  executeBlock(statements: Array<Stmt>, environment: Environment) {
    const previous = this.environment
    try {
      this.environment = environment

      for (const statement of statements) {
        this.execute(statement)
      }
    } finally {
      this.environment = previous
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environment))
  }

  visitClassStmt(stmt: ClassStmt): void {
    this.environment.define(stmt.name.lexeme, null)

    const methods: Record<string, LoxFunction> = {}
    for (const method of stmt.methods) {
      const func = new LoxFunction(method, this.environment)
      methods[method.name.lexeme] = func
    }

    const klass = new LoxClass(stmt.name.lexeme, methods)
    this.environment.assign(stmt.name, klass)
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression)
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const func = new LoxFunction(stmt, this.environment)
    this.environment.define(stmt.name.lexeme, func)
  }

  visitIfStmt(stmt: IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch)
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch)
    }
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    let value: LoxObject = null
    if (stmt.value !== null) value = this.evaluate(stmt.value)

    throw new Return(value)
  }

  visitVarStmt(stmt: VarStmt): void {
    let value: LoxObject = null
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer)
    }

    this.environment.define(stmt.name.lexeme, value)
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body)
    }
  }

  visitAssignExpr(expr: AssignExpr): LoxObject {
    const value = this.evaluate(expr.value)

    const distance = this.locals.get(expr)
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value)
    } else {
      this.globals.assign(expr.name, value)
    }

    return value
  }

  visitBinaryExpr(expr: BinaryExpr): LoxObject {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Greater:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) > (right as number)
      case TokenType.GreaterEqual:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) >= (right as number)
      case TokenType.Less:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) < (right as number)
      case TokenType.LessEqual:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) <= (right as number)
      case TokenType.BangEqual:
        return !this.isEqual(left, right)
      case TokenType.EqualEqual:
        return this.isEqual(left, right)
      case TokenType.Minus:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) - (right as number)
      case TokenType.Plus:
        if (typeof left === 'string' && typeof right === 'string')
          return left + right
        if (typeof left === 'number' && typeof right === 'number')
          return left + right
        throw new RuntimeError(
          'Operands must be two numbers or two strings',
          expr.operator,
        )
      case TokenType.Slash:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) / (right as number)
      case TokenType.Star:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) * (right as number)
    }

    //Unreachable
    return null
  }

  visitCallExpr(expr: CallExpr): LoxObject {
    const callee = this.evaluate(expr.callee)
    const args: Array<LoxObject> = []

    for (const arg of expr.args) {
      args.push(this.evaluate(arg))
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError('Can only call functions and classes', expr.paren)
    }

    if (args.length !== callee.arity()) {
      throw new RuntimeError(
        `Expected ${callee.arity()} arguments but got ${args.length}.`,
        expr.paren,
      )
    }

    return callee.call(this, args)
  }

  visitGetExpr(expr: GetExpr): LoxObject {
    const object = this.evaluate(expr.object)
    if (object instanceof LoxInstance) {
      return object.get(expr.name)
    }

    throw new RuntimeError('Only instances have properties.', expr.name)
  }
}
