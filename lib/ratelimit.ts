import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

type Entry = { count: number; window: string }
type Store = Record<string, Entry>

const STORE_PATH = join(process.cwd(), "data", "ratelimit.json")

let memStore: Store = {}
let loaded = false

function ensureLoaded() {
  if (loaded) return
  loaded = true
  try {
    if (existsSync(STORE_PATH)) {
      memStore = JSON.parse(readFileSync(STORE_PATH, "utf8"))
    }
  } catch {
    memStore = {}
  }
}

function persist() {
  try {
    const dir = join(process.cwd(), "data")
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(STORE_PATH, JSON.stringify(memStore))
  } catch {}
}

// windowMinutes: 1440 = daily (default), 60 = hourly, 15 = per 15 min
export function checkRateLimit(
  key: string,
  limit: number,
  windowMinutes = 1440
): { allowed: boolean; remaining: number } {
  ensureLoaded()
  const windowMs = windowMinutes * 60 * 1000
  const windowKey = Math.floor(Date.now() / windowMs).toString()

  const entry = memStore[key]
  if (!entry || entry.window !== windowKey) {
    memStore[key] = { count: 1, window: windowKey }
    persist()
    return { allowed: true, remaining: limit - 1 }
  }
  if (entry.count >= limit) return { allowed: false, remaining: 0 }
  entry.count++
  persist()
  return { allowed: true, remaining: limit - entry.count }
}
