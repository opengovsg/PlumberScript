import { Interpreter } from '../Interpreter'
import { PlumberInstance } from './PlumberInstance'
import { PlumberCallable, PlumberFunction, PlumberObject } from './types'

export class PlumberClass extends PlumberCallable {
  name: string
  readonly superclass: PlumberClass | null
  private readonly methods: Record<string, PlumberFunction>

  constructor(name: string, superclass: PlumberClass | null, methods: Record<string, PlumberFunction>) {
    super()
    this.superclass = superclass
    this.name = name
    this.methods = methods
  }

  findMethod(name: string): PlumberFunction | null {
    if (name in this.methods) {
      return this.methods[name]
    }

    if (this.superclass !== null) {
      return this.superclass.findMethod(name)
    }

    return null
  }

  toString() {
    return this.name
  }

  call(interpreter: Interpreter, args: Array<PlumberObject>) {
    const instance = new PlumberInstance(this)
    const initializer = this.findMethod('init')
    if (initializer !== null) {
      initializer.bind(instance).call(interpreter, args)
    }

    return instance
  }

  arity(): number {
    const initializer = this.findMethod('init')
    if (initializer === null) return 0
    return initializer.arity()
  }
}
