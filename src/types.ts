import { Environment } from './Environment'
import { Interpreter } from './Interpreter'
import { FunctionStmt } from './Stmt'

export abstract class LoxCallable {
  abstract arity(): number
  abstract call(interpreter: Interpreter, args: Array<LoxObject>): LoxObject
}

export class LoxFunction extends LoxCallable {
  private readonly declaration: FunctionStmt

  constructor(declaration: FunctionStmt) {
    super()
    this.declaration = declaration
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }

  arity(): number {
    return this.declaration.params.length
  }

  call(interpreter: Interpreter, args: Array<LoxObject>): LoxObject {
    const environment = new Environment(interpreter.globals)

    for (const [i, param] of this.declaration.params.entries()) {
      environment.define(param.lexeme, args[i])
    }

    interpreter.executeBlock(this.declaration.body, environment)
    return null
  }
}

export type LoxObject = LoxCallable | string | number | null | boolean
