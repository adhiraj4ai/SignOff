import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutoSync } from '@renderer/hooks/useAutoSync'

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  vi.mocked(window.signoff.vault.sync).mockResolvedValue(undefined)
  vi.mocked(window.signoff.vault.push).mockResolvedValue({ ok: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoSync', () => {
  it('does nothing when the interval is Off (0)', () => {
    renderHook(() => useAutoSync('/v', 0))
    vi.advanceTimersByTime(120_000)
    expect(window.signoff.vault.sync).not.toHaveBeenCalled()
  })

  it('does nothing when no vault is open', () => {
    renderHook(() => useAutoSync(null, 60_000))
    vi.advanceTimersByTime(120_000)
    expect(window.signoff.vault.sync).not.toHaveBeenCalled()
  })

  it('pulls then pushes once per interval', async () => {
    renderHook(() => useAutoSync('/v', 60_000))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(window.signoff.vault.sync).toHaveBeenCalledTimes(1)
    expect(window.signoff.vault.push).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(window.signoff.vault.sync).toHaveBeenCalledTimes(2)
  })

  it('does not start a concurrent runSync while one is still in-flight', async () => {
    // A deferred runSync that stays pending across multiple ticks.
    let resolveSync!: (v: boolean) => void
    const runSync = vi.fn(
      () => new Promise<boolean>((r) => { resolveSync = r })
    )
    renderHook(() => useAutoSync('/v', 60_000, runSync))

    // First tick fires runSync; it never resolves yet.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(runSync).toHaveBeenCalledTimes(1)

    // A second tick arrives while the first is still in-flight — it must be
    // skipped, not run concurrently.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(runSync).toHaveBeenCalledTimes(1)

    // Once the first resolves, a later tick is free to run again.
    resolveSync(true)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(runSync).toHaveBeenCalledTimes(2)
  })

  it('stops the timer on unmount', async () => {
    const { unmount } = renderHook(() => useAutoSync('/v', 60_000))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(window.signoff.vault.sync).toHaveBeenCalledTimes(1)
    unmount()
    await vi.advanceTimersByTimeAsync(180_000)
    expect(window.signoff.vault.sync).toHaveBeenCalledTimes(1)
  })
})
