import { Interpreter } from './Interpreter'
import { LoxInstance } from './LoxInstance'
import { LoxCallable, LoxObject } from './types'

export class LoxClass extends LoxCallable {
  name: string

  constructor(name: string) {
    super()
    this.name = name
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
