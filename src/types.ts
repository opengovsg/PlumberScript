import { Interpreter } from './Interpreter'

export abstract class LoxCallable {
  abstract arity(): number
  abstract call(interpreter: Interpreter, args: Array<LoxObject>): LoxObject
}

export type LoxObject = LoxCallable | string | number | null | boolean
