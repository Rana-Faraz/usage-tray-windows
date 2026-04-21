import { create } from "zustand"
import type { PluginMeta } from "@/lib/plugin-types"
import type { PluginSettings } from "@/lib/settings"
import type { UsageHistory } from "@/lib/usage-history"

type AppPluginStore = {
  pluginsMeta: PluginMeta[]
  pluginSettings: PluginSettings | null
  usageHistory: UsageHistory
  setPluginsMeta: (value: PluginMeta[]) => void
  setPluginSettings: (value: PluginSettings | null) => void
  setUsageHistory: (value: UsageHistory) => void
  resetState: () => void
}

const initialState = {
  pluginsMeta: [] as PluginMeta[],
  pluginSettings: null as PluginSettings | null,
  usageHistory: {} as UsageHistory,
}

export const useAppPluginStore = create<AppPluginStore>((set) => ({
  ...initialState,
  setPluginsMeta: (value) => set({ pluginsMeta: value }),
  setPluginSettings: (value) => set({ pluginSettings: value }),
  setUsageHistory: (value) => set({ usageHistory: value }),
  resetState: () => set(initialState),
}))
