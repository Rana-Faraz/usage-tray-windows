import { describe, expect, it, vi } from "vitest"

const renderMock = vi.fn()
const createRootMock = vi.fn(() => ({ render: renderMock }))

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: createRootMock,
  },
}))

vi.mock("@tauri-apps/plugin-log", () => ({
  error: vi.fn(async () => {}),
  warn: vi.fn(async () => {}),
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async () => null),
  isTauri: vi.fn(() => false),
}))

vi.mock("./App", () => ({
  App: () => null,
}))

describe("main", () => {
  it("mounts app", async () => {
    document.body.innerHTML = '<div id="root"></div>'
    await import("@/main")
    expect(createRootMock).toHaveBeenCalled()
    expect(renderMock).toHaveBeenCalled()
  }, 30000)
})
