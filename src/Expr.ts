import { LoxObject } from './types'
import { Token } from './Token'

export interface Expr {
  accept<R>(visitor: ExprVisitor<R>): R
}

export interface ExprVisitor<R> {
  visitBinaryExpr(expr: BinaryExpr): R
  visitGroupingExpr(expr: GroupingExpr): R
  visitLiteralExpr(expr: LiteralExpr): R
  visitUnaryExpr(expr: UnaryExpr): R
  // visitVariableExpr(expr: VariableExpr): R
  // visitAssignExpr(expr: AssignExpr): R
  // visitLogicalExpr(expr: LogicalExpr): R
  // visitCallExpr(expr: CallExpr): R
  // visitGetExpr(expr: GetExpr): R
  // visitSetExpr(expr: SetExpr): R
  // visitThisExpr(expr: ThisExpr): R
  // visitSuperExpr(expr: SuperExpr): R
}

// export interface Stmt {
//   accept<R>(visitor: StmtVisitor<R>): R
// }

// export interface StmtVisitor<R> {
//   visitExpressionStmt(stmt: ExpressionStmt): R
//   visitPrintStmt(stmt: PrintStmt): R
//   visitVarStmt(stmt: VarStmt): R
//   visitBlockStmt(stmt: BlockStmt): R
//   visitIfStmt(stmt: IfStmt): R
//   visitWhileStmt(stmt: WhileStmt): R
//   visitFunctionStmt(stmt: FunctionStmt): R
//   visitReturnStmt(stmt: ReturnStmt): R
//   visitClassStmt(stmt: ClassStmt): R
// }

// export type SyntaxVisitor<RE, RS> = ExprVisitor<RE> & StmtVisitor<RS>

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
  value: LoxObject

  constructor(value: LoxObject) {
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

// export class VariableExpr implements Expr {
//   name: Token

//   constructor(name: Token) {
//     this.name = name
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitVariableExpr(this)
//   }
// }

// export class AssignExpr implements Expr {
//   name: Token
//   value: Expr

//   constructor(name: Token, value: Expr) {
//     this.name = name
//     this.value = value
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitAssignExpr(this)
//   }
// }

// export class LogicalExpr implements Expr {
//   left: Expr
//   operator: Token
//   right: Expr

//   constructor(left: Expr, operator: Token, right: Expr) {
//     this.left = left
//     this.operator = operator
//     this.right = right
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitLogicalExpr(this)
//   }
// }

// export class CallExpr implements Expr {
//   callee: Expr
//   paren: Token // Closing parenthesis
//   args: Expr[]

//   constructor(callee: Expr, paren: Token, args: Expr[]) {
//     this.callee = callee
//     this.paren = paren
//     this.args = args
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitCallExpr(this)
//   }
// }

// export class GetExpr implements Expr {
//   object: Expr
//   name: Token

//   constructor(object: Expr, name: Token) {
//     this.object = object
//     this.name = name
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitGetExpr(this)
//   }
// }

// export class SetExpr implements Expr {
//   object: Expr
//   name: Token
//   value: Expr

//   constructor(object: Expr, name: Token, value: Expr) {
//     this.object = object
//     this.name = name
//     this.value = value
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitSetExpr(this)
//   }
// }

// export class ThisExpr implements Expr {
//   keyword: Token

//   constructor(keyword: Token) {
//     this.keyword = keyword
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitThisExpr(this)
//   }
// }

// export class SuperExpr implements Expr {
//   keyword: Token
//   method: Token

//   constructor(keyword: Token, method: Token) {
//     this.keyword = keyword
//     this.method = method
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitSuperExpr(this)
//   }
// }

// export class ExpressionStmt implements Stmt {
//   expression: Expr

//   constructor(expression: Expr) {
//     this.expression = expression
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitExpressionStmt(this)
//   }
// }

// export class PrintStmt implements Stmt {
//   expression: Expr

//   constructor(expression: Expr) {
//     this.expression = expression
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitPrintStmt(this)
//   }
// }

// export class VarStmt implements Stmt {
//   name: Token
//   initializer: Expr | null

//   constructor(name: Token, initializer: Expr | null) {
//     this.name = name
//     this.initializer = initializer
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitVarStmt(this)
//   }
// }

// export class BlockStmt implements Stmt {
//   statements: Stmt[]

//   constructor(statements: Stmt[]) {
//     this.statements = statements
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitBlockStmt(this)
//   }
// }

// export class IfStmt implements Stmt {
//   condition: Expr
//   thenBranch: Stmt
//   elseBranch: Stmt | null

//   constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
//     this.condition = condition
//     this.thenBranch = thenBranch
//     this.elseBranch = elseBranch
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitIfStmt(this)
//   }
// }

// export class WhileStmt implements Stmt {
//   condition: Expr
//   body: Stmt

//   constructor(condition: Expr, body: Stmt) {
//     this.condition = condition
//     this.body = body
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitWhileStmt(this)
//   }
// }

// export class FunctionStmt implements Stmt {
//   name: Token
//   params: Token[]
//   body: Stmt[]

//   constructor(name: Token, params: Token[], body: Stmt[]) {
//     this.name = name
//     this.params = params
//     this.body = body
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitFunctionStmt(this)
//   }
// }

// export class ReturnStmt implements Stmt {
//   keyword: Token
//   value: Expr | null

//   constructor(keyword: Token, value: Expr | null) {
//     this.keyword = keyword
//     this.value = value
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitReturnStmt(this)
//   }
// }

// export class ClassStmt implements Stmt {
//   name: Token
//   superclass: VariableExpr | null
//   methods: FunctionStmt[]

//   constructor(
//     name: Token,
//     superclass: VariableExpr | null,
//     methods: FunctionStmt[],
//   ) {
//     this.name = name
//     this.superclass = superclass
//     this.methods = methods
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitClassStmt(this)
//   }
// }
