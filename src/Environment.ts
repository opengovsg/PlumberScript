import { Token } from './Token'
import { RuntimeError } from './error'
import { LoxObject } from './types'

export class Environment {
  enclosing: Environment | null
  private values: Record<string, LoxObject> = {}

  constructor(enclosing?: Environment) {
    if (enclosing) this.enclosing = enclosing
    else this.enclosing = null
  }

  define(name: string, value: LoxObject): void {
    this.values[name] = value
  }

  assign(name: Token, value: LoxObject): void {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value
      return
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value)
      return
    }

    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }

  get(name: Token): LoxObject {
    if (name.lexeme in this.values) return this.values[name.lexeme]
    if (this.enclosing !== null) return this.enclosing.get(name)

    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }
}
