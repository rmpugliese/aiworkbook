import {
  Badge,
  Button,
  Card,
  createTheme,
  darken,
  lighten,
  Modal,
  Paper,
  type MantineColorsTuple,
} from '@mantine/core'

/** A sober slate blue: the main colour when the consultant has not chosen one. */
export const DEFAULT_BRAND = '#1d4f7a'

const FONT =
  '"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

/** Ten shades around the brand colour, which sits at index 6 (Mantine's default shade). */
export function brandColors(hex: string): MantineColorsTuple {
  return [
    lighten(hex, 0.93),
    lighten(hex, 0.84),
    lighten(hex, 0.68),
    lighten(hex, 0.5),
    lighten(hex, 0.32),
    lighten(hex, 0.16),
    hex,
    darken(hex, 0.12),
    darken(hex, 0.24),
    darken(hex, 0.36),
  ]
}

export function buildTheme(brand: string = DEFAULT_BRAND) {
  return createTheme({
    primaryColor: 'brand',
    primaryShade: 6,
    colors: { brand: brandColors(brand) },
    fontFamily: FONT,
    headings: {
      fontFamily: FONT,
      fontWeight: '650',
      sizes: {
        h1: { fontSize: '1.75rem', lineHeight: '1.25' },
        h2: { fontSize: '1.375rem', lineHeight: '1.3' },
        h3: { fontSize: '1.125rem', lineHeight: '1.35' },
      },
    },
    defaultRadius: 'md',
    cursorType: 'pointer',
    components: {
      Button: Button.extend({ defaultProps: { radius: 'md' } }),
      Card: Card.extend({ defaultProps: { withBorder: true, radius: 'md', padding: 'lg' } }),
      Paper: Paper.extend({ defaultProps: { radius: 'md' } }),
      Badge: Badge.extend({ defaultProps: { radius: 'sm', variant: 'light' } }),
      Modal: Modal.extend({ defaultProps: { radius: 'md', centered: true } }),
    },
  })
}
