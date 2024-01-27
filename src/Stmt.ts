import { Expr } from './Expr'
import { Token } from './Token'

export interface Stmt {
  accept<R>(visitor: StmtVisitor<R>): R
}

export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: ExpressionStmt): R
  visitPrintStmt(stmt: PrintStmt): R
  visitVarStmt(stmt: VarStmt): R
  visitBlockStmt(stmt: BlockStmt): R
  visitIfStmt(stmt: IfStmt): R
  visitWhileStmt(stmt: WhileStmt): R
  //   visitFunctionStmt(stmt: FunctionStmt): R
  //   visitReturnStmt(stmt: ReturnStmt): R
  //   visitClassStmt(stmt: ClassStmt): R
}

export class ExpressionStmt implements Stmt {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this)
  }
}

export class PrintStmt implements Stmt {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this)
  }
}

export class VarStmt implements Stmt {
  name: Token
  initializer: Expr | null

  constructor(name: Token, initializer: Expr | null) {
    this.name = name
    this.initializer = initializer
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this)
  }
}

export class BlockStmt implements Stmt {
  statements: Stmt[]

  constructor(statements: Stmt[]) {
    this.statements = statements
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this)
  }
}

export class IfStmt implements Stmt {
  condition: Expr
  thenBranch: Stmt
  elseBranch: Stmt | null

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
    this.condition = condition
    this.thenBranch = thenBranch
    this.elseBranch = elseBranch
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this)
  }
}

export class WhileStmt implements Stmt {
  condition: Expr
  body: Stmt

  constructor(condition: Expr, body: Stmt) {
    this.condition = condition
    this.body = body
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this)
  }
}

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
