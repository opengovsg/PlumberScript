import { describe, expect, it } from 'vitest'

import { PlumberScript } from '../../PlumberScript'

const plumber = new PlumberScript()

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
    const result = plumber.evaluate(`STR_REPLACE_ALL(${args.map(arg => `"${arg}"`).join(',')})`)
    expect(result).toEqual(expectedOutput)
  })

  it('returns null if arguments are not strings', () => {
    const result = plumber.evaluate(`STR_REPLACE_ALL("aa a",1,"test")`)
    expect(result).toBeNull()
  })

  // TODO: test interpretation in another PR; need refactoring away from
  // console.log
})
