import { describe, expect, it } from 'vitest'

import { CHART_DAYS, signupStats } from './stats'

const NOW = new Date(2026, 10, 5, 9, 30) // 5 November 2026, 9:30 local time

function daysAgo(days: number, hour = 12): string {
  return new Date(2026, 10, 5 - days, hour).toISOString()
}

describe('signupStats', () => {
  it('counts sign-ups by window and day', () => {
    const stats = signupStats(
      [
        { created_at: daysAgo(0, 0), email_verified_at: daysAgo(0) },
        { created_at: daysAgo(0, 8), email_verified_at: null },
        { created_at: daysAgo(10), email_verified_at: daysAgo(10) },
        { created_at: daysAgo(40), email_verified_at: daysAgo(40) },
      ],
      NOW,
    )
    expect(stats).toMatchObject({ total: 4, confirmed: 3, last7Days: 2, last30Days: 3 })
    expect(stats.days).toHaveLength(CHART_DAYS)
    expect(stats.days.at(-1)).toEqual({ date: new Date(2026, 10, 5), count: 2 })
    expect(stats.days.at(-11)?.count).toBe(1)
    expect(stats.days[0].date).toEqual(new Date(2026, 9, 7))
    expect(stats.days.reduce((sum, day) => sum + day.count, 0)).toBe(3)
  })

  it('treats the seventh day back as outside the week', () => {
    const stats = signupStats([{ created_at: daysAgo(7), email_verified_at: null }], NOW)
    expect(stats).toMatchObject({ last7Days: 0, last30Days: 1 })
  })
})
