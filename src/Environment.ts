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

  ancestor(distance: number): Environment | null {
    if (distance === 0) return this

    let environment = this.enclosing
    for (let i = 1; i < distance; i++) {
      environment = environment?.enclosing ?? null
    }
    return environment
  }

  getAt(distance: number, name: Token): LoxObject {
    const environment = this.ancestor(distance)

    if (environment === null)
      throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)

    return environment.get(name)
  }

  assignAt(distance: number, name: Token, value: LoxObject) {
    const environment = this.ancestor(distance)

    if (environment === null)
      throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)

    environment.assign(name, value)
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

  getThis(): LoxObject {
    return this.values['this']
  }
}
