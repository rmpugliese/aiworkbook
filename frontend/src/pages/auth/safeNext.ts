/** Only same-site paths are accepted as a post-login destination (no open redirects). */
export function safeNext(next: string | null): string {
  // "//host" and "/\host" are read by browsers as another site.
  return next && next.startsWith('/') && !/^\/[/\\]/.test(next) ? next : '/'
}
