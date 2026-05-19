type Entry = { count: number; date: string }
const store = new Map<string, Entry>()

export function checkRateLimit(
  key: string,
  limit: number
): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10)
  const entry = store.get(key)
  if (!entry || entry.date !== today) {
    store.set(key, { count: 1, date: today })
    return { allowed: true, remaining: limit - 1 }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }
  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}
