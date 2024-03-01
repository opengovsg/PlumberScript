import { describe, expect, it } from 'vitest'

import { PlumberScript } from '../../PlumberScript'

const plumber = new PlumberScript()

describe('POWER', () => {
  it.each([
    {
      args: [999, 0],
      expectedOutput: 1,
    },
    {
      args: [2, 3],
      expectedOutput: 8,
    },
    {
      args: [-2, -3],
      expectedOutput: -0.125,
    }
  ])('evaluates correctly', ({ args, expectedOutput }) => {
    const result = plumber.evaluate(`POWER(${args.join(',')})`)
    expect(result).toEqual(expectedOutput)
  })

  it('returns null if arguments are not numbers', () => {
    const result = plumber.evaluate(`POWER("invalid", "input")`)
    expect(result).toBeNull()
  })

  it('throws on wrong number of input arguments', () => {
    expect(() => plumber.evaluate(`POWER("wrong","number","of","arguments")`)).toThrowError()
  })
})
