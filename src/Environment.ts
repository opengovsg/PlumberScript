import { Token } from './ast/Token'
import { RuntimeError } from './errors/error'
import { PlumberObject } from './ast/types'

export class Environment {
  enclosing: Environment | null
  private values: Record<string, PlumberObject> = {}

  constructor(enclosing?: Environment) {
    if (enclosing) this.enclosing = enclosing
    else this.enclosing = null
  }

  define(name: string, value: PlumberObject): void {
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

  getAt(distance: number, name: Token): PlumberObject {
    const environment = this.ancestor(distance)

    if (environment === null)
      throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)

    return environment.get(name)
  }

  assignAt(distance: number, name: Token, value: PlumberObject) {
    const environment = this.ancestor(distance)

    if (environment === null)
      throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)

    environment.assign(name, value)
  }

  assign(name: Token, value: PlumberObject): void {
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

  get(name: Token): PlumberObject {
    if (name.lexeme in this.values) return this.values[name.lexeme]
    if (this.enclosing !== null) return this.enclosing.get(name)

    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }

  getThis(): PlumberObject {
    return this.values['this']
  }
}
