/** The date of the current terms; it must match TERMS_VERSION in backend/app/legal.py. */
export const TERMS_VERSION_LABEL = '5 novembre 2026 (rev. 2)'

export const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Termini' },
  { to: '/cookies', label: 'Cookie' },
  { to: '/ai', label: "Uso dell'AI" },
] as const
