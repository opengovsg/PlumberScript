import { LoxClass } from './LoxClass'

export class LoxInstance {
  private klass: LoxClass

  constructor(klass: LoxClass) {
    this.klass = klass
  }

  toString() {
    return `${this.klass.name} instance`
  }
}
