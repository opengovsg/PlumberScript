import { describe, expect, it } from 'vitest'

import { StrReplaceAllFunction } from '../str-replace-all'
import { type Interpreter } from '../../Interpreter'

const STUB_INTERPRETER = {} as unknown as Interpreter
const fn = new StrReplaceAllFunction()

describe('STR_REPLACE_ALL', () => {
  it.each([
    {
      args: ['aa a', 'a', 'test'],
      expectedOutput: 'testtest test',
    },
    {
      args: ['aa a', 'aa', 'test'],
      expectedOutput: 'test a',
    },
  ])('replaces all occurances of the substring', ({ args, expectedOutput }) => {
    const result = fn.call(STUB_INTERPRETER, args)
    expect(result).toEqual(expectedOutput)
  })

  it('returns null if arguments are not strings', () => {
    const result = fn.call(STUB_INTERPRETER, ['aa a', 1, 'test'])
    expect(result).toBeNull()
  })

  // TODO: test interpretation in another PR; need refactoring away from
  // console.log
})
