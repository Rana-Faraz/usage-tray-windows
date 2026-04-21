import type { PluginMeta, PluginOutput } from "@/lib/plugin-types"
import type { PluginSettings } from "@/lib/settings"
import { DEFAULT_DISPLAY_MODE, type DisplayMode } from "@/lib/settings"
import {
  getPrimaryProgressFraction,
  getPrimaryProgressLine,
} from "@/lib/primary-progress"

type PluginState = {
  data: PluginOutput | null
  loading: boolean
  error: string | null
}

export type TrayPrimaryBar = {
  id: string
  fraction?: number
}

export function getTrayPrimaryBars(args: {
  pluginsMeta: PluginMeta[]
  pluginSettings: PluginSettings | null
  pluginStates: Record<string, PluginState | undefined>
  maxBars?: number
  displayMode?: DisplayMode
  pluginId?: string
}): TrayPrimaryBar[] {
  const {
    pluginsMeta,
    pluginSettings,
    pluginStates,
    maxBars = 4,
    displayMode = DEFAULT_DISPLAY_MODE,
    pluginId,
  } = args
  if (!pluginSettings) return []

  const metaById = new Map(pluginsMeta.map((p) => [p.id, p]))
  const disabled = new Set(pluginSettings.disabled)
  const orderedIds = pluginId
    ? [pluginId]
    : pluginSettings.order

  const out: TrayPrimaryBar[] = []
  for (const id of orderedIds) {
    if (disabled.has(id)) continue
    const meta = metaById.get(id)
    if (!meta) continue
    
    // Skip if no primary candidates defined
    if (!meta.primaryCandidates || meta.primaryCandidates.length === 0) continue

    const state = pluginStates[id]
    const data = state?.data ?? null

    let fraction: number | undefined
    if (data) {
      const primaryLine = getPrimaryProgressLine(meta, data)
      const nextFraction = primaryLine
        ? getPrimaryProgressFraction(primaryLine, displayMode)
        : null
      if (nextFraction != null) fraction = nextFraction
    }

    out.push({ id, fraction })
    if (out.length >= maxBars) break
  }

  return out
}
