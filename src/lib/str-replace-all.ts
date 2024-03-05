import { Interpreter } from '../Interpreter'
import { PlumberCallable, PlumberObject } from '../ast/types'

export class StrReplaceAllFunction extends PlumberCallable {
  arity(argLength: number): boolean {
    return argLength === 3
  }

  call(_: Interpreter, args: Array<PlumberObject>): PlumberObject {
    const [sourceString, pattern, replacement] = args

    // In theory we can be looser and accept numbers, etc and convert them to
    // string. But this opens a large can of worms, so not going to do for now.
    if (
      typeof sourceString !== 'string' ||
      typeof pattern !== 'string' ||
      typeof replacement !== 'string'
    ) {
      return null
    }

    return sourceString.replaceAll(pattern, replacement)
  }

  toString(): string {
    return "<native function 'STR_REPLACE_ALL'>"
  }
}
