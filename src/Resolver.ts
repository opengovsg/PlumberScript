import { errorReporter } from './ErrorReporter'
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GetExpr,
  GroupingExpr,
  LogicalExpr,
  SetExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr'
import { Interpreter } from './Interpreter'
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
import { ResolvingError } from './error'

type Scope = Record<string, boolean>

enum FunctionType {
  None = 'None',
  Function = 'Function',
}

class Stack extends Array<Scope> {
  isEmpty(): boolean {
    return this.length < 1
  }
  peek(): Scope {
    return this[this.length - 1]
  }
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter
  private readonly scopes: Stack = new Stack()
  private currentFunction = FunctionType.None

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope()
    this.resolve(stmt.statements)
    this.endScope()
  }

  visitClassStmt(stmt: ClassStmt): void {
    this.declare(stmt.name)
    this.define(stmt.name)
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.resolve(stmt.expression)
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name)
    this.define(stmt.name)

    this.resolveFunction(stmt, FunctionType.Function)
  }

  visitIfStmt(stmt: IfStmt): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.thenBranch)
    if (stmt.elseBranch !== null) this.resolve(stmt.elseBranch)
  }

  visitPrintStmt(stmt: PrintStmt): void {
    this.resolve(stmt.expression)
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction === FunctionType.None)
      errorReporter.report(
        new ResolvingError(
          "Can't return from top-level code",
          stmt.keyword.line,
        ),
      )
    if (stmt.value !== null) this.resolve(stmt.value)
  }

  visitVarStmt(stmt: VarStmt): void {
    this.declare(stmt.name)
    if (stmt.initializer !== null) {
      this.resolve(stmt.initializer)
    }
    this.define(stmt.name)
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.body)
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.resolve(expr.value)
    this.resolveLocal(expr, expr.name)
  }

  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolve(expr.left)
    this.resolve(expr.right)
  }

  visitCallExpr(expr: CallExpr): void {
    this.resolve(expr.callee)

    for (const arg of expr.args) {
      this.resolve(arg)
    }
  }

  visitGetExpr(expr: GetExpr): void {
    this.resolve(expr.object)
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolve(expr.expression)
  }

  visitLiteralExpr(): void {
    return
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolve(expr.right)
    this.resolve(expr.left)
  }

  visitSetExpr(expr: SetExpr): void {
    this.resolve(expr.value)
    this.resolve(expr.object)
  }

  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolve(expr.right)
  }

  visitVariableExpr(expr: VariableExpr): void {
    if (
      !this.scopes.isEmpty() &&
      this.scopes.peek()[expr.name.lexeme] === false
    ) {
      // Variable has been declared, but not defined
      errorReporter.report(
        new ResolvingError(
          "Can't read local variable in its own initializer",
          expr.name.line,
        ),
      )
    }
    this.resolveLocal(expr, expr.name)
  }

  resolve(target: Stmt | Expr | Array<Stmt>): void {
    if (target instanceof Array) {
      for (const statement of target) {
        this.resolve(statement)
      }
    } else target.accept(this)
  }

  private resolveFunction(func: FunctionStmt, type: FunctionType) {
    const enclosingFunction = this.currentFunction
    this.currentFunction = type

    this.beginScope()
    for (const param of func.params) {
      this.declare(param)
      this.define(param)
    }
    this.resolve(func.body)
    this.endScope()
    this.currentFunction = enclosingFunction
  }

  private beginScope(): void {
    this.scopes.push({})
  }

  private endScope(): void {
    this.scopes.pop()
  }

  private declare(name: Token): void {
    if (this.scopes.isEmpty()) return

    const scope = this.scopes.peek()

    if (name.lexeme in scope) {
      errorReporter.report(
        new ResolvingError(
          'Already variable with this name in scope',
          name.line,
        ),
      )
    }

    scope[name.lexeme] = false
  }

  private define(name: Token): void {
    if (this.scopes.isEmpty()) return
    const scope = this.scopes.peek()
    scope[name.lexeme] = true
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (name.lexeme in this.scopes[i]) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
        return
      }
    }
  }
}
