import { describe, expect, it } from "vitest"

import { getPrimaryProgressFraction, getPrimaryProgressLine } from "@/lib/primary-progress"

describe("primary-progress", () => {
  it("returns null when no primary candidate is available", () => {
    expect(
      getPrimaryProgressLine(
        { primaryCandidates: ["Session"] },
        {
          providerId: "codex",
          displayName: "Codex",
          iconUrl: "",
          lines: [{ type: "badge", label: "Plan", text: "Plus" }],
        }
      )
    ).toBeNull()
  })

  it("returns the first matching primary candidate", () => {
    expect(
      getPrimaryProgressLine(
        { primaryCandidates: ["Credits", "Session"] },
        {
          providerId: "codex",
          displayName: "Codex",
          iconUrl: "",
          lines: [
            { type: "progress", label: "Session", used: 25, limit: 100, format: { kind: "percent" } },
            { type: "progress", label: "Credits", used: 80, limit: 100, format: { kind: "percent" } },
          ],
        }
      )
    ).toMatchObject({ label: "Credits", used: 80, limit: 100 })
  })

  it("computes fractions for used and left display modes", () => {
    expect(getPrimaryProgressFraction({ used: 25, limit: 100 }, "used")).toBe(0.25)
    expect(getPrimaryProgressFraction({ used: 25, limit: 100 }, "left")).toBe(0.75)
  })

  it("returns null for zero limits", () => {
    expect(getPrimaryProgressFraction({ used: 25, limit: 0 }, "used")).toBeNull()
  })
})
