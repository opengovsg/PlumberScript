import { Interpreter } from '../Interpreter'
import { PlumberCallable, PlumberObject } from '../ast/types'

export class AbsFunction extends PlumberCallable {
  arity(argLength: number): boolean {
    return argLength === 1
  }

  call(_: Interpreter, args: Array<PlumberObject>): PlumberObject {
    const arg = args[0]

    if (typeof arg === 'number') return Math.abs(arg)
    return null
  }

  toString(): string {
    return "<native function 'ABS'>"
  }
}
