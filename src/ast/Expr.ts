import { PlumberObject } from './types'
import { Token } from './Token'

export interface Expr {
  accept<R>(visitor: ExprVisitor<R>): R
}

export interface ExprVisitor<R> {
  visitBinaryExpr(expr: BinaryExpr): R
  visitGroupingExpr(expr: GroupingExpr): R
  visitLiteralExpr(expr: LiteralExpr): R
  visitUnaryExpr(expr: UnaryExpr): R
  visitVariableExpr(expr: VariableExpr): R
  visitAssignExpr(expr: AssignExpr): R
  visitLogicalExpr(expr: LogicalExpr): R
  visitCallExpr(expr: CallExpr): R
  visitGetExpr(expr: GetExpr): R
  visitSetExpr(expr: SetExpr): R
  visitThisExpr(expr: ThisExpr): R
  visitSuperExpr(expr: SuperExpr): R
}

export class BinaryExpr implements Expr {
  left: Expr
  operator: Token
  right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this)
  }
}

export class GroupingExpr implements Expr {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this)
  }
}

export class LiteralExpr implements Expr {
  value: PlumberObject

  constructor(value: PlumberObject) {
    this.value = value
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this)
  }
}

export class UnaryExpr implements Expr {
  operator: Token
  right: Expr

  constructor(operator: Token, right: Expr) {
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this)
  }
}

export class VariableExpr implements Expr {
  name: Token

  constructor(name: Token) {
    this.name = name
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this)
  }
}

export class AssignExpr implements Expr {
  name: Token
  value: Expr

  constructor(name: Token, value: Expr) {
    this.name = name
    this.value = value
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this)
  }
}

export class LogicalExpr implements Expr {
  left: Expr
  operator: Token
  right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLogicalExpr(this)
  }
}

export class CallExpr implements Expr {
  callee: Expr
  paren: Token // Closing parenthesis, location used for error reporting
  args: Expr[]

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    this.callee = callee
    this.paren = paren
    this.args = args
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this)
  }
}

export class GetExpr implements Expr {
  object: Expr
  name: Token

  constructor(object: Expr, name: Token) {
    this.object = object
    this.name = name
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGetExpr(this)
  }
}

export class SetExpr implements Expr {
  object: Expr
  name: Token
  value: Expr

  constructor(object: Expr, name: Token, value: Expr) {
    this.object = object
    this.name = name
    this.value = value
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitSetExpr(this)
  }
}

export class ThisExpr implements Expr {
  keyword: Token

  constructor(keyword: Token) {
    this.keyword = keyword
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitThisExpr(this)
  }
}

export class SuperExpr implements Expr {
  keyword: Token
  method: Token

  constructor(keyword: Token, method: Token) {
    this.keyword = keyword
    this.method = method
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitSuperExpr(this)
  }
}
