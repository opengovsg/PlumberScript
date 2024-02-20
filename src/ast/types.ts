import { Environment } from '../Environment'
import { Interpreter } from '../Interpreter'
import { PlumberInstance } from './PlumberInstance'
import { FunctionStmt } from './Stmt'

export abstract class PlumberCallable {
  abstract arity(): number
  abstract call(interpreter: Interpreter, args: Array<PlumberObject>): PlumberObject
}

export class PlumberFunction extends PlumberCallable {
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

  bind(instance: PlumberInstance): PlumberFunction {
    const environment = new Environment(this.closure)
    environment.define('this', instance)
    return new PlumberFunction(this.declaration, environment, this.isInitializer)
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }

  arity(): number {
    return this.declaration.params.length
  }

  call(interpreter: Interpreter, args: Array<PlumberObject>): PlumberObject {
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
  readonly value: PlumberObject

  constructor(value: PlumberObject) {
    this.value = value
  }
}

export type PlumberObject =
  | PlumberInstance
  | PlumberCallable
  | string
  | number
  | null
  | boolean
