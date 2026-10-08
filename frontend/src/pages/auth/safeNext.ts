/** Only same-site paths are accepted as a post-login destination (no open redirects). */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}
