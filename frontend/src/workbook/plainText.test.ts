import { describe, expect, it } from 'vitest'

import { plainText } from './plainText'

describe('plainText', () => {
  it('removes bold, italics and headings but keeps the words', () => {
    expect(plainText('**Metriche**: il *volume* delle __chiamate__')).toBe(
      'Metriche: il volume delle chiamate',
    )
    expect(plainText('## Rischi\nTesto')).toBe('Rischi\nTesto')
  })

  it('keeps simple lists, normalised to dashes, and trims trailing spaces', () => {
    expect(plainText('- **Uno**  \n* due\n  + tre')).toBe('- Uno\n- due\n  - tre')
  })

  it('leaves ordinary text alone', () => {
    const text = 'Ridurre del 15% le chiamate, 3 * 4 = 12, file_name_v2.'
    expect(plainText(text)).toBe(text)
  })
})
