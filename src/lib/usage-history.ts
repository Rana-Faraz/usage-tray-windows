import { LazyStore } from "@tauri-apps/plugin-store"
import type { PluginMeta, PluginOutput, ProgressFormat } from "@/lib/plugin-types"
import type { DisplayMode } from "@/lib/settings"
import { getPrimaryProgressFraction, getPrimaryProgressLine } from "@/lib/primary-progress"

export type UsageHistoryEntry = {
  day: string
  capturedAt: string
  label: string
  used: number
  limit: number
  format: ProgressFormat
}

export type UsageHistory = Record<string, UsageHistoryEntry[]>

export type UsageTrendPoint = {
  day: string
  shortLabel: string
  fraction: number | null
  entry: UsageHistoryEntry | null
}

export const USAGE_HISTORY_DAYS = 7

const USAGE_HISTORY_STORE_PATH = "usage-history.json"
const USAGE_HISTORY_KEY = "providers"

const store = new LazyStore(USAGE_HISTORY_STORE_PATH)

function parseLocalDayKey(day: string): Date {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(year, (month || 1) - 1, date || 1)
}

function createLocalDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildDaySequence(now: Date): string[] {
  const days: string[] = []
  for (let offset = USAGE_HISTORY_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    days.push(createLocalDayKey(date))
  }
  return days
}

function isProgressFormat(value: unknown): value is ProgressFormat {
  if (!value || typeof value !== "object") return false
  const kind = (value as { kind?: unknown }).kind
  if (kind === "percent" || kind === "dollars") return true
  return (
    kind === "count" &&
    typeof (value as { suffix?: unknown }).suffix === "string"
  )
}

function sanitizeEntry(value: unknown): UsageHistoryEntry | null {
  if (!value || typeof value !== "object") return null

  const maybeEntry = value as Partial<UsageHistoryEntry>
  if (
    typeof maybeEntry.day !== "string" ||
    typeof maybeEntry.capturedAt !== "string" ||
    typeof maybeEntry.label !== "string" ||
    typeof maybeEntry.used !== "number" ||
    typeof maybeEntry.limit !== "number" ||
    !isProgressFormat(maybeEntry.format)
  ) {
    return null
  }

  if (!Number.isFinite(maybeEntry.used) || !Number.isFinite(maybeEntry.limit)) {
    return null
  }

  return {
    day: maybeEntry.day,
    capturedAt: maybeEntry.capturedAt,
    label: maybeEntry.label,
    used: maybeEntry.used,
    limit: maybeEntry.limit,
    format: maybeEntry.format,
  }
}

export function sanitizeUsageHistory(value: unknown): UsageHistory {
  if (!value || typeof value !== "object") return {}

  const history: UsageHistory = {}
  for (const [providerId, entries] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue
    const sanitizedEntries = entries
      .map(sanitizeEntry)
      .filter((entry): entry is UsageHistoryEntry => entry !== null)
      .sort((a, b) => a.day.localeCompare(b.day))

    if (sanitizedEntries.length > 0) {
      history[providerId] = sanitizedEntries
    }
  }

  return history
}

export async function loadUsageHistory(): Promise<UsageHistory> {
  const stored = await store.get<unknown>(USAGE_HISTORY_KEY)
  return sanitizeUsageHistory(stored)
}

export async function saveUsageHistory(history: UsageHistory): Promise<void> {
  await store.set(USAGE_HISTORY_KEY, history)
  await store.save()
}

export function createUsageHistoryEntry(
  meta: Pick<PluginMeta, "primaryCandidates">,
  output: PluginOutput,
  now: Date = new Date()
): UsageHistoryEntry | null {
  const primaryLine = getPrimaryProgressLine(meta, output)
  if (!primaryLine) return null

  return {
    day: createLocalDayKey(now),
    capturedAt: now.toISOString(),
    label: primaryLine.label,
    used: primaryLine.used,
    limit: primaryLine.limit,
    format: primaryLine.format,
  }
}

export function recordUsageHistoryEntry(args: {
  history: UsageHistory
  providerId: string
  entry: UsageHistoryEntry
  now?: Date
}): UsageHistory {
  const { history, providerId, entry, now = new Date() } = args
  const keepDays = new Set(buildDaySequence(now))
  const currentEntries = history[providerId] ?? []
  const keptEntries = currentEntries.filter((item) => keepDays.has(item.day) && item.day !== entry.day)
  const nextEntries = [...keptEntries, entry].sort((a, b) => a.day.localeCompare(b.day))

  return {
    ...history,
    [providerId]: nextEntries,
  }
}

export function buildUsageTrend(args: {
  entries: UsageHistoryEntry[]
  displayMode: DisplayMode
  now?: Date
}): UsageTrendPoint[] {
  const { entries, displayMode, now = new Date() } = args
  const byDay = new Map(entries.map((entry) => [entry.day, entry]))

  return buildDaySequence(now).map((day) => {
    const date = parseLocalDayKey(day)
    const entry = byDay.get(day) ?? null
    return {
      day,
      shortLabel: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
      fraction: entry ? getPrimaryProgressFraction(entry, displayMode) : null,
      entry,
    }
  })
}
