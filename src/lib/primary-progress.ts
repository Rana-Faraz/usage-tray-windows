import type { PluginMeta, PluginOutput } from "@/lib/plugin-types"
import type { DisplayMode } from "@/lib/settings"
import { clamp01 } from "@/lib/utils"

export type PrimaryProgressLine = Extract<
  PluginOutput["lines"][number],
  { type: "progress"; label: string; used: number; limit: number }
>

export function isPrimaryProgressLine(
  line: PluginOutput["lines"][number]
): line is PrimaryProgressLine {
  return line.type === "progress"
}

export function getPrimaryProgressLine(
  meta: Pick<PluginMeta, "primaryCandidates">,
  output: PluginOutput | null
): PrimaryProgressLine | null {
  if (!output) return null
  if (!meta.primaryCandidates || meta.primaryCandidates.length === 0) return null

  const primaryLabel = meta.primaryCandidates.find((label) =>
    output.lines.some((line) => isPrimaryProgressLine(line) && line.label === label)
  )
  if (!primaryLabel) return null

  return (
    output.lines.find(
      (line): line is PrimaryProgressLine =>
        isPrimaryProgressLine(line) && line.label === primaryLabel
    ) ?? null
  )
}

export function getPrimaryProgressFraction(
  line: Pick<PrimaryProgressLine, "used" | "limit">,
  displayMode: DisplayMode
): number | null {
  if (line.limit <= 0) return null
  const shownAmount =
    displayMode === "used"
      ? line.used
      : line.limit - line.used
  return clamp01(shownAmount / line.limit)
}
