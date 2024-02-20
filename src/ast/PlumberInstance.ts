import { PlumberClass } from './PlumberClass'
import { Token } from './Token'
import { RuntimeError } from '../errors/error'
import { PlumberObject } from './types'

export class PlumberInstance {
  private klass: PlumberClass
  private readonly fields: Record<string, PlumberObject> = {}

  constructor(klass: PlumberClass) {
    this.klass = klass
  }

  toString() {
    return `${this.klass.name} instance`
  }

  get(name: Token): PlumberObject {
    if (name.lexeme in this.fields) {
      return this.fields[name.lexeme]
    }

    const method = this.klass.findMethod(name.lexeme)
    if (method !== null) return method.bind(this)

    throw new RuntimeError(`Undefined property '${name.lexeme}'.`, name)
  }

  set(name: Token, value: PlumberObject): void {
    this.fields[name.lexeme] = value
  }
}
