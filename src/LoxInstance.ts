import { LoxClass } from './LoxClass'
import { Token } from './Token'
import { RuntimeError } from './error'
import { LoxObject } from './types'

export class LoxInstance {
  private klass: LoxClass
  private readonly fields: Record<string, LoxObject> = {}

  constructor(klass: LoxClass) {
    this.klass = klass
  }

  toString() {
    return `${this.klass.name} instance`
  }

  get(name: Token): LoxObject {
    if (name.lexeme in this.fields) {
      return this.fields[name.lexeme]
    }

    const method = this.klass.findMethod(name.lexeme)
    if (method) return method

    throw new RuntimeError(`Undefined property '${name.lexeme}'.`, name)
  }

  set(name: Token, value: LoxObject): void {
    this.fields[name.lexeme] = value
  }
}
