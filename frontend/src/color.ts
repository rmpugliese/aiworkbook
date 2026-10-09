/** The same rule as the backend: white text on the brand colour needs a 4.5:1 contrast. */
export const MIN_CONTRAST = 4.5

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const c = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05)
}
