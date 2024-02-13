import { Interpreter } from './Interpreter'
import { LoxInstance } from './LoxInstance'
import { LoxCallable, LoxFunction, LoxObject } from './types'

export class LoxClass extends LoxCallable {
  name: string
  private readonly methods: Record<string, LoxFunction>

  constructor(name: string, methods: Record<string, LoxFunction>) {
    super()
    this.name = name
    this.methods = methods
  }

  findMethod(name: string): LoxFunction | null {
    if (name in this.methods) {
      return this.methods[name]
    }

    return null
  }

  toString() {
    return this.name
  }

  call(interpreter: Interpreter, args: Array<LoxObject>) {
    const instance = new LoxInstance(this)
    return instance
  }

  arity(): number {
    return 0
  }
}
