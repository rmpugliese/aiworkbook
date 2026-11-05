export const CHART_DAYS = 30

export type SignupDay = { date: Date; count: number }

export type SignupStats = {
  total: number
  confirmed: number
  last7Days: number
  last30Days: number
  /** Sign-ups per local day, oldest first, ending today. */
  days: SignupDay[]
}

type Account = { created_at: string; email_verified_at: string | null }

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Local calendar days between two dates (0 = same day), robust to daylight saving changes. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000)
}

/** Sign-up numbers, counted by calendar day in the browser's time zone. */
export function signupStats(users: Account[], now = new Date()): SignupStats {
  const today = startOfDay(now)
  const days: SignupDay[] = Array.from({ length: CHART_DAYS }, (_, index) => ({
    date: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (CHART_DAYS - 1 - index),
    ),
    count: 0,
  }))
  let last7Days = 0
  let last30Days = 0
  for (const user of users) {
    const ago = daysBetween(new Date(user.created_at), today)
    if (ago < 0 || ago >= CHART_DAYS) continue
    days[CHART_DAYS - 1 - ago].count += 1
    last30Days += 1
    if (ago < 7) last7Days += 1
  }
  return {
    total: users.length,
    confirmed: users.filter((user) => user.email_verified_at !== null).length,
    last7Days,
    last30Days,
    days,
  }
}
