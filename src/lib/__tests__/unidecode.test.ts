import { describe, expect, it } from 'vitest'

import { PlumberScript } from '../../PlumberScript'

const plumber = new PlumberScript()

describe('UNIDECODE', () => {
  it.each([
    {
      arg: "King George’s",
      expectedOutput: "King George's",
    },
    {
      arg: "\u{5317}\u{4EB0}",
      expectedOutput: 'Bei Jing ',
    },
    {
      arg: "aéà)àçé",
      expectedOutput: 'aea)ace',
    },
    {
      arg: "に間違いがないか、再度確認してください。再読み込みしてください。",
      expectedOutput: 'niJian Wei iganaika, Zai Du Que Ren sitekudasai. Zai Du miIp misitekudasai. ',
    },
  ])('transliterates Unicode text into US-ASCII', ({ arg, expectedOutput }) => {
    const result = plumber.evaluate(`UNIDECODE("${arg}")`)
    expect(result).toEqual(expectedOutput)
  })

  it('returns null if arguments are not strings', () => {
    const result = plumber.evaluate(`UNIDECODE(123)`)
    expect(result).toBeNull()
  })
})
