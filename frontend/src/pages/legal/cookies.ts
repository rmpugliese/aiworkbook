/**
 * Every cookie the app sets, as the cookie policy and the cookie panel list them. Keep in sync
 * with the backend: SESSION_COOKIE and CSRF_COOKIE in app/auth/web.py, "oauth_state" in
 * app/main.py.
 */
export const COOKIES = [
  {
    name: 'session',
    purpose: "Mantiene l'accesso dopo il login.",
    duration: "30 giorni dall'ultimo utilizzo",
    attributes: 'HttpOnly, Secure, SameSite=Lax',
  },
  {
    name: 'csrf_token',
    purpose: 'Protegge dalle richieste contraffatte da altri siti (CSRF).',
    duration: 'Fino alla chiusura del browser',
    attributes: 'Secure, SameSite=Lax',
  },
  {
    name: 'oauth_state',
    purpose: "Solo durante l'accesso con Google: verifica che la risposta di Google sia attesa.",
    duration: '10 minuti',
    attributes: 'HttpOnly, Secure, SameSite=Lax',
  },
] as const
