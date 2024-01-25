import { errorReporter } from './ErrorReporter'
import {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from './Expr'
import { Token } from './Token'
import { TokenType } from './TokenType'
import { RuntimeError } from './error'
import { LoxObject } from './types'

export class Interpreter implements ExprVisitor<LoxObject> {
  interpret(expression: Expr) {
    try {
      const value = this.evaluate(expression)
      console.log(this.stringify(value))
    } catch (error) {
      errorReporter.report(error as Error)
    }
  }

  visitLiteralExpr(expr: LiteralExpr): LoxObject {
    return expr.value
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
}
