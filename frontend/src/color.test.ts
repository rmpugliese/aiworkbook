import { describe, expect, it } from 'vitest'

import { contrastWithWhite, isHexColor } from './color'
import { brandColors } from './theme'

describe('brand colour', () => {
  it('measures the contrast with white text like the backend does', () => {
    expect(contrastWithWhite('#000000')).toBeCloseTo(21)
    expect(contrastWithWhite('#ffffff')).toBeCloseTo(1)
    expect(contrastWithWhite('#1d4f7a')).toBeGreaterThan(4.5)
    expect(contrastWithWhite('#ffcc00')).toBeLessThan(4.5)
  })

  it('accepts only #rrggbb', () => {
    expect(isHexColor('#1d4f7a')).toBe(true)
    expect(isHexColor('#1D4F7A')).toBe(true)
    expect(isHexColor('#fff')).toBe(false)
    expect(isHexColor('blue')).toBe(false)
  })

  it('builds ten shades with the brand colour as the main one', () => {
    const shades = brandColors('#1d4f7a')
    expect(shades).toHaveLength(10)
    expect(shades[6]).toBe('#1d4f7a')
    expect(new Set(shades).size).toBe(10)
  })
})
