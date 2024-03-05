import { Environment } from './Environment'
import { errorReporter } from './errors/ErrorReporter'
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
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from './ast/Expr'
import { PlumberClass } from './ast/PlumberClass'
import { PlumberInstance } from './ast/PlumberInstance'
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
} from './ast/Stmt'
import { Token } from './ast/Token'
import { TokenType } from './ast/TokenType'
import { RuntimeError } from './errors/error'
import { AbsFunction } from './lib/abs'
import {
  PlumberObject,
  PlumberCallable,
  PlumberFunction,
  Return,
} from './ast/types'
import { PowerFunction } from './lib/power'
import { StrReplaceAllFunction } from './lib/str-replace-all'

export class Interpreter
  implements ExprVisitor<PlumberObject>, StmtVisitor<void>
{
  globals = new Environment()
  private environment = this.globals
  private readonly locals: Map<Expr, number> = new Map()

  constructor() {
    this.globals.define('ABS', new AbsFunction())
    this.globals.define('POWER', new PowerFunction())
    this.globals.define('STR_REPLACE_ALL', new StrReplaceAllFunction())
  }

  interpret(target: Array<Stmt>) {
    try {
      for (const statement of target) {
        this.execute(statement)
      }
    } catch (error) {
      errorReporter.report(error as Error)
    }
  }

  visitLiteralExpr(expr: LiteralExpr): PlumberObject {
    return expr.value
  }

  visitLogicalExpr(expr: LogicalExpr): PlumberObject {
    const left = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left
    } else {
      if (!this.isTruthy(left)) return left
    }

    return this.evaluate(expr.right)
  }

  visitSetExpr(expr: SetExpr): PlumberObject {
    const object = this.evaluate(expr.object)

    if (!(object instanceof PlumberInstance)) {
      throw new RuntimeError('Only instances have fields.', expr.name)
    }

    const value = this.evaluate(expr.value)
    object.set(expr.name, value)

    return value
  }

  visitSuperExpr(expr: SuperExpr): PlumberObject {
    const distance = this.locals.get(expr)

    if (distance === undefined)
      throw new RuntimeError("Invalid 'super' usage", expr.keyword)

    const superclass = this.environment.getAt(distance, expr.keyword)
    if (!(superclass instanceof PlumberClass)) {
      // Unreachable
      throw new RuntimeError("Invalid 'super' usage", expr.keyword)
    }

    const object = this.environment.enclosing?.getThis()
    if (!(object instanceof PlumberInstance)) {
      // Unreachable
      throw new RuntimeError("Invalid 'super' usage", expr.keyword)
    }

    const method = superclass.findMethod(expr.method.lexeme)
    if (method === null) {
      throw new RuntimeError(
        `Undefined property ${expr.method.lexeme}.`,
        expr.method,
      )
    }

    return method.bind(object)
  }

  visitThisExpr(expr: ThisExpr): PlumberObject {
    return this.lookUpVariable(expr.keyword, expr)
  }

  visitUnaryExpr(expr: UnaryExpr): PlumberObject {
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

  visitVariableExpr(expr: VariableExpr): PlumberObject {
    return this.lookUpVariable(expr.name, expr)
  }

  private lookUpVariable(name: Token, expr: Expr): PlumberObject {
    const distance = this.locals.get(expr)
    if (distance !== undefined) {
      return this.environment.getAt(distance, name)
    } else {
      return this.globals.get(name)
    }
  }

  checkNumberOperand(operator: Token, operand: PlumberObject): void {
    if (typeof operand === 'number') return
    throw new RuntimeError('Operand must be a number.', operator)
  }

  checkNumberOperands(
    operator: Token,
    left: PlumberObject,
    right: PlumberObject,
  ) {
    if (typeof left === 'number' && typeof right === 'number') return
    throw new RuntimeError('Operands must be numbers.', operator)
  }

  private isTruthy(object: PlumberObject): boolean {
    if (object === null) return false
    if (typeof object === 'boolean') return object
    return true
  }

  private isEqual(a: PlumberObject, b: PlumberObject): boolean {
    if (a === null && b === null) return true
    if (a === null) return false
    return a === b
  }

  stringify(object: PlumberObject): string {
    if (object === null) return 'null'

    if (typeof object === 'number') {
      let text = object.toString()
      if (text.endsWith('.0')) {
        text = text.substring(0, text.length - 2)
      }
      return text
    }

    return object.toString()
  }

  visitGroupingExpr(expr: GroupingExpr): PlumberObject {
    return this.evaluate(expr.expression)
  }

  evaluate(expr: Expr): PlumberObject {
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
    let superclass: PlumberObject | null = null
    if (stmt.superclass !== null) {
      superclass = this.evaluate(stmt.superclass)
      if (!(superclass instanceof PlumberClass)) {
        throw new RuntimeError(
          'Superclass must be a class',
          stmt.superclass.name,
        )
      }
    }

    this.environment.define(stmt.name.lexeme, null)

    if (stmt.superclass !== null) {
      this.environment = new Environment(this.environment)
      this.environment.define('super', superclass)
    }

    const methods: Record<string, PlumberFunction> = {}
    for (const method of stmt.methods) {
      const func = new PlumberFunction(
        method,
        this.environment,
        method.name.lexeme === 'init',
      )
      methods[method.name.lexeme] = func
    }

    const klass = new PlumberClass(stmt.name.lexeme, superclass, methods)

    if (superclass !== null && this.environment.enclosing !== null) {
      this.environment = this.environment.enclosing
    }

    this.environment.assign(stmt.name, klass)
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression)
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const func = new PlumberFunction(stmt, this.environment, false)
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
    let value: PlumberObject = null
    if (stmt.value !== null) value = this.evaluate(stmt.value)

    throw new Return(value)
  }

  visitVarStmt(stmt: VarStmt): void {
    let value: PlumberObject = null
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

  visitAssignExpr(expr: AssignExpr): PlumberObject {
    const value = this.evaluate(expr.value)

    const distance = this.locals.get(expr)
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value)
    } else {
      this.globals.assign(expr.name, value)
    }

    return value
  }

  visitBinaryExpr(expr: BinaryExpr): PlumberObject {
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

  visitCallExpr(expr: CallExpr): PlumberObject {
    const callee = this.evaluate(expr.callee)
    const args: Array<PlumberObject> = []

    for (const arg of expr.args) {
      args.push(this.evaluate(arg))
    }

    if (!(callee instanceof PlumberCallable)) {
      throw new RuntimeError('Can only call functions and classes', expr.paren)
    }

    if (!callee.arity(args.length)) {
      throw new RuntimeError(
        `Incorrect number of arguments provided: ${args.length}.`,
        expr.paren,
      )
    }

    return callee.call(this, args)
  }

  visitGetExpr(expr: GetExpr): PlumberObject {
    const object = this.evaluate(expr.object)
    if (object instanceof PlumberInstance) {
      return object.get(expr.name)
    }

    throw new RuntimeError('Only instances have properties.', expr.name)
  }
}
