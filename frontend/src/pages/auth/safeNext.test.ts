import { describe, expect, it } from 'vitest'

import { safeNext } from './safeNext'

describe('safeNext', () => {
  it('keeps paths on this site', () => {
    expect(safeNext('/projects/3?task=1.a.b')).toBe('/projects/3?task=1.a.b')
  })

  it('refuses anything that could lead to another site', () => {
    for (const next of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'evil',
      null,
    ]) {
      expect(safeNext(next)).toBe('/')
    }
  })
})
