import { describe, expect, it } from 'vitest'

import { ApiError } from './client'
import { shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('does not retry client errors', () => {
    expect(shouldRetry(0, new ApiError(404, 'not found'))).toBe(false)
    expect(shouldRetry(0, new ApiError(422, 'invalid'))).toBe(false)
  })

  it('retries server and network errors up to three times', () => {
    expect(shouldRetry(0, new ApiError(502, 'bad gateway'))).toBe(true)
    expect(shouldRetry(2, new TypeError('Failed to fetch'))).toBe(true)
    expect(shouldRetry(3, new TypeError('Failed to fetch'))).toBe(false)
  })
})
