const dateTime = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' })
const date = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' })

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

export function formatDate(iso: string): string {
  return date.format(new Date(iso))
}

export function iterationLabel(count: number): string {
  return count === 1 ? '1 iterazione' : `${count} iterazioni`
}
