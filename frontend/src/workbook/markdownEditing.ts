/** Markdown text helpers: line breaks, and the edits behind the formatting toolbar. */

/**
 * A single line break stays a line break, as in the texts written before Markdown (and as the
 * backend renders them in the PDF). Markdown turns "two spaces + newline" into a break.
 */
export function withLineBreaks(text: string): string {
  return text.replace(/([^\n])\n(?=[^\n])/g, '$1  \n')
}

/** One line of Markdown as plain text, for previews: no emphasis marks, list bullets or pipes. */
export function plainPreview(text: string): string {
  return text
    .replace(/(\*\*|__|\*|_|`|~~)(.+?)\1/g, '$2')
    .replace(/^\s*(#{1,6}|[-*+]|\d+\.|>)\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export type Edit = { text: string; start: number; end: number }

export type FormatAction = 'bold' | 'italic' | 'bullets' | 'numbers' | 'table'

const TABLE = '| Colonna 1 | Colonna 2 | Colonna 3 |\n| --- | --- | --- |\n|  |  |  |'

function wrap(text: string, start: number, end: number, mark: string, placeholder: string): Edit {
  const selected = text.slice(start, end) || placeholder
  const next = text.slice(0, start) + mark + selected + mark + text.slice(end)
  return { text: next, start: start + mark.length, end: start + mark.length + selected.length }
}

function prefixLines(text: string, start: number, end: number, numbered: boolean): Edit {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const lineEnd = text.indexOf('\n', end) === -1 ? text.length : text.indexOf('\n', end)
  const lines = text.slice(lineStart, lineEnd).split('\n')
  const prefixed = lines
    .map((line, index) => `${numbered ? `${index + 1}.` : '-'} ${line}`)
    .join('\n')
  const next = text.slice(0, lineStart) + prefixed + text.slice(lineEnd)
  return { text: next, start: lineStart + prefixed.length, end: lineStart + prefixed.length }
}

function insertBlock(text: string, start: number, end: number, block: string): Edit {
  const before = text.slice(0, start).replace(/\n*$/, '')
  const after = text.slice(end).replace(/^\n*/, '')
  const head = before ? `${before}\n\n` : ''
  const next = head + block + (after ? `\n\n${after}` : '')
  // Put the cursor in the first header cell, ready to type.
  const cursor = head.length + 2
  return { text: next, start: cursor, end: cursor + 'Colonna 1'.length }
}

export function applyFormat(action: FormatAction, text: string, start: number, end: number): Edit {
  switch (action) {
    case 'bold':
      return wrap(text, start, end, '**', 'testo in grassetto')
    case 'italic':
      return wrap(text, start, end, '*', 'testo in corsivo')
    case 'bullets':
      return prefixLines(text, start, end, false)
    case 'numbers':
      return prefixLines(text, start, end, true)
    case 'table':
      return insertBlock(text, start, end, TABLE)
  }
}
