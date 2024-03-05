import { Interpreter } from '../Interpreter'
import { PlumberCallable, PlumberObject } from '../ast/types'

export class PowerFunction extends PlumberCallable {
  arity(argLength: number): boolean {
    return argLength === 2
  }

  call(_: Interpreter, args: Array<PlumberObject>): PlumberObject {
    const [ base, exponent ] = args

    if (typeof base !== 'number' || typeof exponent !== 'number') return null
    return Math.pow(base, exponent)
  }

  toString(): string {
    return "<native function 'POWER'>"
  }
}
