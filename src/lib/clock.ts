import { PlumberCallable, PlumberObject } from '../ast/types'

export class LoxClockFunction extends PlumberCallable {
  arity(): number {
    return 0
  }

  call(): PlumberObject {
    return Date.now().valueOf() / 1000.0
  }

  toString(): string {
    return "<native function 'clock'>"
  }
}
