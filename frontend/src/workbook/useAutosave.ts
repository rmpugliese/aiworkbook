import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

const isDirty = (status: SaveStatus) =>
  status === 'pending' || status === 'saving' || status === 'error'

/**
 * Saves `value` `delay` ms after its last change. Saves run one at a time, in order; pending
 * changes are flushed on unmount, and the browser warns before leaving with unsaved changes.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<unknown>,
  { delay = 1000 }: { delay?: number } = {},
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const latest = useRef(value)
  const persisted = useRef(JSON.stringify(value))
  const saveRef = useRef(save)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    saveRef.current = save
  }, [save])

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    const snapshot = latest.current
    const serialized = JSON.stringify(snapshot)
    if (serialized === persisted.current) return
    setStatus('saving')
    queue.current = queue.current
      .then(() => saveRef.current(snapshot))
      .then(
        () => {
          persisted.current = serialized
          setStatus(JSON.stringify(latest.current) === serialized ? 'saved' : 'pending')
        },
        () => setStatus('error'),
      )
  }, [])

  useEffect(() => {
    latest.current = value
    if (JSON.stringify(value) === persisted.current) return
    setStatus('pending')
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, delay)
  }, [value, delay, flush])

  // Leaving the task (unmount) must not lose an edit typed within the last second.
  useEffect(() => flush, [flush])

  useEffect(() => {
    if (!isDirty(status)) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  return { status, retry: flush }
}
