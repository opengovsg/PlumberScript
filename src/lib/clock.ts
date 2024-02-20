import { LoxCallable, LoxObject } from '../ast/types'

export class LoxClockFunction extends LoxCallable {
  arity(): number {
    return 0
  }

  call(): LoxObject {
    return Date.now().valueOf() / 1000.0
  }

  toString(): string {
    return "<native function 'clock'>"
  }
}
