import {
  AssignExpr,
  BinaryExpr,
  BlockStmt,
  CallExpr,
  ClassStmt,
  Expr,
  ExpressionStmt,
  FunctionStmt,
  GetExpr,
  GroupingExpr,
  IfStmt,
  LiteralExpr,
  LogicalExpr,
  PrintStmt,
  ReturnStmt,
  SetExpr,
  Stmt,
  SuperExpr,
  SyntaxVisitor,
  ThisExpr,
  UnaryExpr,
  VarStmt,
  VariableExpr,
  WhileStmt,
} from './Expr'

export class AstPrinter implements SyntaxVisitor<string, string> {
  // Print AST as S-expressions
  stringify(target: Expr | Stmt | Stmt[]): string {
    if (target instanceof Array) {
      return target.map((stmt) => stmt.accept(this)).join('\n')
    } else {
      return target.accept(this)
    }
  }

  private parenthesize(name: string, ...exprs: Expr[]) {
    let result = ''

    result += `(${name}`
    for (const expr of exprs) {
      result += ` ${expr.accept(this)}`
    }
    result += ')'

    return result
  }

  private indent(lines: string) {
    return lines
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize('group', expr.expression)
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    if (expr.value === null) return 'nil'
    if (typeof expr.value === 'string') return `"${expr.value}"`
    return expr.value.toString()
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right)
  }

  visitVariableExpr(expr: VariableExpr): string {
    return expr.name.lexeme
  }

  visitAssignExpr(expr: AssignExpr): string {
    const name = new VariableExpr(expr.name)
    return this.parenthesize('assign', name, expr.value)
  }

  visitLogicalExpr(expr: LogicalExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitCallExpr(expr: CallExpr): string {
    return this.parenthesize('call', expr.callee, ...expr.args)
  }

  visitGetExpr(expr: GetExpr): string {
    return this.parenthesize(`get ${expr.name.lexeme}`, expr.object)
  }

  visitSetExpr(expr: SetExpr): string {
    return this.parenthesize(`set ${expr.name.lexeme}`, expr.object, expr.value)
  }

  visitThisExpr(expr: ThisExpr): string {
    return this.parenthesize(expr.keyword.lexeme)
  }

  visitSuperExpr(expr: SuperExpr): string {
    return this.parenthesize(`get ${expr.method.lexeme} (super)`)
  }

  visitPrintStmt(stmt: PrintStmt): string {
    return this.parenthesize('print', stmt.expression)
  }

  visitExpressionStmt(stmt: ExpressionStmt): string {
    return this.parenthesize('expression', stmt.expression)
  }

  visitVarStmt(stmt: VarStmt): string {
    const name = new VariableExpr(stmt.name)
    if (stmt.initializer) {
      return this.parenthesize('var', name, stmt.initializer)
    } else {
      return this.parenthesize('var', name)
    }
  }

  visitBlockStmt(stmt: BlockStmt): string {
    let result = '(block'
    stmt.statements.forEach((innerStmt) => {
      result += '\n' + this.indent(this.stringify(innerStmt))
    })
    result += ')'

    return result
  }

  visitIfStmt(stmt: IfStmt): string {
    let result = `(if ${this.stringify(stmt.condition)}\n`

    const thenBranchResult = this.stringify(stmt.thenBranch)
    result += this.indent(thenBranchResult)

    if (stmt.elseBranch !== null) {
      result += '\n'
      const elseBranchResult = this.stringify(stmt.elseBranch)
      result += this.indent(elseBranchResult)
    }
    result += ')'

    return result
  }

  visitWhileStmt(stmt: WhileStmt): string {
    let result = `(while ${this.stringify(stmt.condition)}\n`
    const bodyResult = this.stringify(stmt.body)
    result += this.indent(bodyResult) + ')'

    return result
  }

  visitFunctionStmt(stmt: FunctionStmt): string {
    const paramsResult =
      stmt.params.length > 0
        ? ` (params ${stmt.params.map((p) => p.lexeme).join(' ')})`
        : ''
    let result = `(fun ${stmt.name.lexeme}${paramsResult}\n`
    result += this.indent(this.stringify(new BlockStmt(stmt.body))) + ')'

    return result
  }

  visitReturnStmt(stmt: ReturnStmt): string {
    return stmt.value !== null
      ? this.parenthesize(stmt.keyword.lexeme, stmt.value)
      : this.parenthesize(stmt.keyword.lexeme)
  }

  visitClassStmt(stmt: ClassStmt): string {
    let result = `(class ${stmt.name.lexeme}`
    if (stmt.superclass !== null) result += ' ' + stmt.superclass.name.lexeme

    stmt.methods.forEach((method) => {
      result += '\n' + this.indent(this.stringify(method))
    })
    result += ')'

    return result
  }
}
