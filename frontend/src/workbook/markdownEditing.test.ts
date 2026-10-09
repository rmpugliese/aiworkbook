import { describe, expect, it } from 'vitest'

import { applyFormat, withLineBreaks } from './markdownEditing'

describe('markdown editing', () => {
  it('keeps single line breaks and paragraphs', () => {
    expect(withLineBreaks('uno\ndue\n\ntre')).toBe('uno  \ndue\n\ntre')
  })

  it('wraps the selection in bold or italics, or inserts a placeholder', () => {
    expect(applyFormat('bold', 'ridurre i costi', 8, 15)).toEqual({
      text: 'ridurre **i costi**',
      start: 10,
      end: 17,
    })
    const empty = applyFormat('italic', 'a ', 2, 2)
    expect(empty.text).toBe('a *testo in corsivo*')
    expect(empty.text.slice(empty.start, empty.end)).toBe('testo in corsivo')
  })

  it('turns the selected lines into a list', () => {
    expect(applyFormat('bullets', 'intro\nuno\ndue', 6, 13).text).toBe('intro\n- uno\n- due')
    expect(applyFormat('numbers', 'uno\ndue', 0, 7).text).toBe('1. uno\n2. due')
  })

  it('inserts a table as its own block, with the first header selected', () => {
    const edit = applyFormat('table', 'Misure:\ndopo', 8, 8)
    expect(edit.text).toBe(
      'Misure:\n\n| Colonna 1 | Colonna 2 | Colonna 3 |\n| --- | --- | --- |\n|  |  |  |\n\ndopo',
    )
    expect(edit.text.slice(edit.start, edit.end)).toBe('Colonna 1')
  })
})
