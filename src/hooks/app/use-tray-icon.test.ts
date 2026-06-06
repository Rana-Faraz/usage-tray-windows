import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PluginMeta } from "@/lib/plugin-types"
import type { PluginSettings } from "@/lib/settings"

const mocks = vi.hoisted(() => ({
  getByIdMock: vi.fn(),
  resolveResourceMock: vi.fn(),
  renderTrayBarsIconMock: vi.fn(),
  getTrayPrimaryBarsMock: vi.fn(),
  invokeMock: vi.fn(),
}))

vi.mock("@tauri-apps/api/path", () => ({
  resolveResource: mocks.resolveResourceMock,
}))

vi.mock("@tauri-apps/api/tray", () => ({
  TrayIcon: {
    getById: mocks.getByIdMock,
  },
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mocks.invokeMock,
}))

vi.mock("@/lib/tray-bars-icon", () => ({
  getTrayIconSizePx: vi.fn(() => 18),
  renderTrayBarsIcon: mocks.renderTrayBarsIconMock,
}))

vi.mock("@/lib/tray-primary-progress", () => ({
  getTrayPrimaryBars: mocks.getTrayPrimaryBarsMock,
}))

import { useTrayIcon } from "@/hooks/app/use-tray-icon"

describe("useTrayIcon", () => {
  const pluginsMeta: PluginMeta[] = [
    {
      id: "mock",
      name: "Mock",
      iconUrl: "data:image/svg+xml;base64,icon",
      lines: [],
      primaryCandidates: [],
    },
  ]

  const pluginSettings: PluginSettings = {
    order: ["mock"],
    disabled: [],
  }

  beforeEach(() => {
    vi.useRealTimers()
    mocks.getByIdMock.mockReset()
    mocks.resolveResourceMock.mockReset()
    mocks.renderTrayBarsIconMock.mockReset()
    mocks.getTrayPrimaryBarsMock.mockReset()
    mocks.invokeMock.mockReset()

    mocks.resolveResourceMock.mockResolvedValue("/icons/tray-icon.png")
    mocks.renderTrayBarsIconMock.mockResolvedValue("rendered-icon")
    mocks.getTrayPrimaryBarsMock.mockReturnValue([{ id: "mock", fraction: 0.42 }])
    mocks.invokeMock.mockResolvedValue(false)
  })

  it("falls back to percent text inside the provider icon when native tray titles are unavailable", async () => {
    const tray = {
      setIcon: vi.fn().mockResolvedValue(undefined),
      setIconAsTemplate: vi.fn().mockResolvedValue(undefined),
      setTooltip: vi.fn().mockResolvedValue(undefined),
    }
    mocks.getByIdMock.mockResolvedValue(tray)

    renderHook(() =>
      useTrayIcon({
        pluginsMeta,
        pluginSettings,
        pluginStates: {},
        displayMode: "left",
        menubarIconStyle: "provider",
        activeView: "home",
      })
    )

    await waitFor(() => {
      expect(mocks.getByIdMock).toHaveBeenCalledWith("tray")
    })

    await waitFor(() => {
      expect(mocks.renderTrayBarsIconMock).toHaveBeenCalled()
    })

    expect(mocks.renderTrayBarsIconMock).toHaveBeenCalledWith(
      expect.objectContaining({
        style: "provider",
        percentText: "42%",
      })
    )
    expect(tray.setTooltip).toHaveBeenCalledWith("UsageTray\nMock: 42%")
  })

  it("uses native tray title text when Windows tray title support is available", async () => {
    const tray = {
      setIcon: vi.fn().mockResolvedValue(undefined),
      setIconAsTemplate: vi.fn().mockResolvedValue(undefined),
      setTooltip: vi.fn().mockResolvedValue(undefined),
      setTitle: vi.fn().mockResolvedValue(undefined),
    }
    mocks.getByIdMock.mockResolvedValue(tray)

    renderHook(() =>
      useTrayIcon({
        pluginsMeta,
        pluginSettings,
        pluginStates: {},
        displayMode: "left",
        menubarIconStyle: "provider",
        activeView: "home",
      })
    )

    await waitFor(() => {
      expect(mocks.getByIdMock).toHaveBeenCalledWith("tray")
    })

    await waitFor(() => {
      expect(mocks.renderTrayBarsIconMock).toHaveBeenCalled()
    })

    expect(mocks.renderTrayBarsIconMock).toHaveBeenCalledWith(
      expect.objectContaining({
        style: "provider",
        percentText: undefined,
      })
    )
    expect(tray.setTitle).toHaveBeenCalledWith("42%")
    expect(tray.setTooltip).toHaveBeenCalledWith("UsageTray\nMock: 42%")
  })
})
