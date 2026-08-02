const SLOW_OPERATION_MS = 1000

const now = () => globalThis.performance?.now?.() ?? Date.now()

export async function measureAsync(name, operation) {
  const startedAt = now()

  try {
    return await operation()
  } finally {
    const durationMs = Math.round(now() - startedAt)
    const measurement = { name, durationMs, recordedAt: Date.now() }
    const reporter = globalThis.__CLOSET_PERFORMANCE_REPORTER__

    if (typeof reporter === 'function') {
      reporter(measurement)
    }

    if (durationMs >= SLOW_OPERATION_MS) {
      console.warn(`[performance] ${name} took ${durationMs}ms`)
    }
  }
}
