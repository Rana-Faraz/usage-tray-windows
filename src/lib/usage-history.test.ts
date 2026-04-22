import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildUsageTrend,
  createUsageHistoryEntry,
  loadUsageHistory,
  recordUsageHistoryEntry,
  sanitizeUsageHistory,
  saveUsageHistory,
  type UsageHistory,
} from "@/lib/usage-history"

const storeState = new Map<string, unknown>()
const storeSaveMock = vi.fn()

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get<T>(key: string): Promise<T | null> {
      if (!storeState.has(key)) return undefined as T | null
      return storeState.get(key) as T | null
    }
    async set<T>(key: string, value: T): Promise<void> {
      storeState.set(key, value)
    }
    async save(): Promise<void> {
      storeSaveMock()
    }
  },
}))

describe("usage-history", () => {
  beforeEach(() => {
    storeState.clear()
    storeSaveMock.mockReset()
  })

  it("sanitizes malformed history payloads", () => {
    expect(
      sanitizeUsageHistory({
        codex: [
          {
            day: "2026-04-20",
            capturedAt: "2026-04-20T10:00:00.000Z",
            label: "Session",
            used: 40,
            limit: 100,
            format: { kind: "percent" },
          },
          {
            day: "2026-04-21",
            capturedAt: "2026-04-21T10:00:00.000Z",
            label: "Session",
            used: "bad",
            limit: 100,
            format: { kind: "percent" },
          },
        ],
      })
    ).toEqual({
      codex: [
        {
          day: "2026-04-20",
          capturedAt: "2026-04-20T10:00:00.000Z",
          label: "Session",
          used: 40,
          limit: 100,
          format: { kind: "percent" },
        },
      ],
    })
  })

  it("loads and saves history", async () => {
    const history: UsageHistory = {
      codex: [
        {
          day: "2026-04-20",
          capturedAt: "2026-04-20T10:00:00.000Z",
          label: "Session",
          used: 40,
          limit: 100,
          format: { kind: "percent" },
        },
      ],
    }

    await saveUsageHistory(history)

    expect(await loadUsageHistory()).toEqual(history)
    expect(storeSaveMock).toHaveBeenCalledTimes(1)
  })

  it("creates a history entry from the primary progress line", () => {
    expect(
      createUsageHistoryEntry(
        { primaryCandidates: ["Credits", "Session"] },
        {
          providerId: "codex",
          displayName: "Codex",
          iconUrl: "",
          lines: [
            { type: "progress", label: "Session", used: 55, limit: 100, format: { kind: "percent" } },
          ],
        },
        new Date("2026-04-21T10:00:00.000Z")
      )
    ).toEqual({
      day: "2026-04-21",
      capturedAt: "2026-04-21T10:00:00.000Z",
      label: "Session",
      used: 55,
      limit: 100,
      format: { kind: "percent" },
    })
  })

  it("keeps only one snapshot per local day and retains the last 7 days", () => {
    const history: UsageHistory = {
      codex: [
        {
          day: "2026-04-13",
          capturedAt: "2026-04-13T10:00:00.000Z",
          label: "Session",
          used: 10,
          limit: 100,
          format: { kind: "percent" },
        },
        {
          day: "2026-04-20",
          capturedAt: "2026-04-20T10:00:00.000Z",
          label: "Session",
          used: 40,
          limit: 100,
          format: { kind: "percent" },
        },
      ],
    }

    const next = recordUsageHistoryEntry({
      history,
      providerId: "codex",
      entry: {
        day: "2026-04-20",
        capturedAt: "2026-04-20T16:00:00.000Z",
        label: "Session",
        used: 60,
        limit: 100,
        format: { kind: "percent" },
      },
      now: new Date("2026-04-21T10:00:00.000Z"),
    })

    expect(next.codex).toEqual([
      {
        day: "2026-04-20",
        capturedAt: "2026-04-20T16:00:00.000Z",
        label: "Session",
        used: 60,
        limit: 100,
        format: { kind: "percent" },
      },
    ])
  })

  it("builds a 7-day trend for used and left display modes", () => {
    const entries = [
      {
        day: "2026-04-19",
        capturedAt: "2026-04-19T10:00:00.000Z",
        label: "Session",
        used: 25,
        limit: 100,
        format: { kind: "percent" as const },
      },
      {
        day: "2026-04-21",
        capturedAt: "2026-04-21T10:00:00.000Z",
        label: "Session",
        used: 75,
        limit: 100,
        format: { kind: "percent" as const },
      },
    ]

    expect(
      buildUsageTrend({
        entries,
        displayMode: "used",
        now: new Date("2026-04-21T10:00:00.000Z"),
      }).map((point) => point.fraction)
    ).toEqual([null, null, null, null, 0.25, null, 0.75])

    expect(
      buildUsageTrend({
        entries,
        displayMode: "left",
        now: new Date("2026-04-21T10:00:00.000Z"),
      }).map((point) => point.fraction)
    ).toEqual([null, null, null, null, 0.75, null, 0.25])
  })
})
