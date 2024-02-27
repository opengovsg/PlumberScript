import { describe, expect, it } from 'vitest'

import { PlumberScript } from '../../PlumberScript'

const plumber = new PlumberScript()

describe('ABS', () => {
  it.each([
    {
      arg: 1,
      expectedOutput: 1,
    },
    {
      arg: 0,
      expectedOutput: 0,
    },
    {
      arg: -1,
      expectedOutput: 1,
    }
  ])('evaluates numbers correctly', ({ arg, expectedOutput }) => {
    const result = plumber.evaluate(`ABS(${arg})`)
    expect(result).toEqual(expectedOutput)
  })

  it('returns null if argument is not numbers', () => {
    const result = plumber.evaluate(`ABS("invalid input")`)
    expect(result).toBeNull()
  })

  it('throws on wrong number of input arguments', () => {
    expect(() => plumber.evaluate(`ABS("wrong","number","of","arguments")`)).toThrowError()
  })
})
