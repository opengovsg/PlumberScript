import { Environment } from './Environment'
import { Interpreter } from './Interpreter'
import { LoxInstance } from './LoxInstance'
import { FunctionStmt } from './Stmt'

export abstract class LoxCallable {
  abstract arity(): number
  abstract call(interpreter: Interpreter, args: Array<LoxObject>): LoxObject
}

export class LoxFunction extends LoxCallable {
  private readonly declaration: FunctionStmt
  private readonly closure: Environment
  private readonly isInitializer: boolean

  constructor(
    declaration: FunctionStmt,
    closure: Environment,
    isInitializer: boolean,
  ) {
    super()
    this.isInitializer = isInitializer
    this.closure = closure
    this.declaration = declaration
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure)
    environment.define('this', instance)
    return new LoxFunction(this.declaration, environment, this.isInitializer)
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }

  arity(): number {
    return this.declaration.params.length
  }

  call(interpreter: Interpreter, args: Array<LoxObject>): LoxObject {
    const environment = new Environment(this.closure)

    for (const [i, param] of this.declaration.params.entries()) {
      environment.define(param.lexeme, args[i])
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment)
    } catch (thrown) {
      if (thrown instanceof Return) {
        return thrown.value
      } else throw thrown
    }

    if (this.isInitializer) return this.closure.getThis()
    return null
  }
}

export class Return {
  readonly value: LoxObject

  constructor(value: LoxObject) {
    this.value = value
  }
}

export type LoxObject =
  | LoxInstance
  | LoxCallable
  | string
  | number
  | null
  | boolean
