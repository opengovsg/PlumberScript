import { describe, expect, it } from 'vitest'

import { PlumberScript } from '../PlumberScript'

describe('PlumberScript', () => {

  it('is able to hold state between evaluations', () => {
    const plumber = new PlumberScript()
    const statement1 = plumber.evaluate(`let x = 1;`)
    const statement2 = plumber.evaluate(`let y = 2;`)
    const expression = plumber.evaluate(`x + y`)

    expect(statement1).toBeNull()
    expect(statement2).toBeNull()
    expect(expression).toEqual(3)
  })
})
