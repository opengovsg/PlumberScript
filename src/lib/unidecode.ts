import unidecode from 'unidecode'

import { Interpreter } from '../Interpreter'
import { PlumberCallable, PlumberObject } from '../ast/types'

/**
 * This function takes UTF-8 data and tries to represent it in US-ASCII characters
 * (i.e., the universally displayable characters between 0x00 and 0x7F). The
 * representation is almost always an attempt at transliteration -- i.e., conveying,
 * in Roman letters,the pronunciation expressed by the text in some other writing system.
 */
export class UnidecodeFunction extends PlumberCallable {
  arity(): number {
    return 1
  }

  call(_: Interpreter, args: Array<PlumberObject>): PlumberObject {
    const [ input ] = args

    if (
      typeof input !== 'string'
    ) {
      return null
    }

    return unidecode(input)
  }

  toString(): string {
    return "<native function 'UNIDECODE'>"
  }
}
