# Windows Provider Compatibility Matrix

This is the source of truth for Windows provider scope in `UsageTray`.

## Currently Supported Providers
- AntiGravity
- Claude
- Codex
- Cursor
- GitHub Copilot
- Grok
- OpenRouter
- Windsurf
- Z.ai

These are the only providers that are in scope for the first Windows release. Everything else is either planned for a later wave, explicitly deferred, or blocked behind macOS-specific storage assumptions.

## Matrix

| Provider | Windows status | Detection strategy | Expected dependencies | Notes |
|---|---|---|---|---|
| [Claude](./claude.md) | v1 wave | `~/.claude/.credentials.json` | Claude Code login, optional `ccusage` | Bypasses macOS keychain check on Windows. |
| [Codex](./codex.md) | v1 wave | `%CODEX_HOME%/auth.json`, `%APPDATA%/codex/auth.json` | Codex login, optional `ccusage` | Supports file-based auth on Windows. |
| [Cursor](./cursor.md) | v1 wave | `%APPDATA%/Cursor/User/globalStorage/state.vscdb` | Cursor desktop app, `sqlite3` | Windows AppData path verified. |
| [Grok](./grok.md) | v1 wave | `~/.grok/auth.json` | Grok CLI login | Fully supported via home directory. |
| [OpenRouter](./openrouter.md) | v1 wave | `OPENROUTER_API_KEY` | Windows env vars | Configure env var and restart. |
| [Antigravity](./antigravity.md) | v1 wave | `%APPDATA%/Antigravity/User/globalStorage/state.vscdb` | Antigravity app, `sqlite3` | Supported. Supersedes Gemini CLI. |
| [Windsurf](./windsurf.md) | v1 wave | `%APPDATA%/Windsurf/User/globalStorage/state.vscdb` | Windsurf app, `sqlite3` | Windows AppData path verified. |
| [JetBrains AI Assistant](./jetbrains-ai-assistant.md) | planned | `~/AppData/Roaming/JetBrains` | JetBrains IDE data | Path configured; deferred to next wave. |
| [Copilot](./copilot.md) | planned | Credential-manager backed auth | GitHub CLI or Windows Credential Manager | Requires Windows Credential bridge. |
| [Factory](./factory.md) | planned | `~/.factory/auth.json` | Factory CLI auth | Deferred to next wave. |
| [Kimi](./kimi.md) | planned | `~/.kimi/credentials/kimi-code.json` | Kimi CLI auth | Deferred to next wave. |
| [Minimax](./minimax.md) | planned | `MINIMAX_*` | Windows env vars | Deferred to next wave. |
| [Z.ai](./zai.md) | v1.1 wave | `ZAI_API_KEY` or `GLM_API_KEY` | Windows env vars | Configure env var and restart. |
| [Amp](./amp.md) | deferred | `~/.local/share/amp/secrets.json` | Amp CLI data | Unix-only storage layout today. |
| [Gemini](./gemini.md) | deferred | N/A (Retired CLI) | N/A | Deprecated in favor of Antigravity CLI (`agy`). |
| [OpenCode Go](./opencode-go.md) | deferred | `~/.local/share/opencode/*` | OpenCode Go data, `sqlite3` | Unix-only storage layout today. |
| [Perplexity](./perplexity.md) | blocked | `~/Library/.../Cache.db` | Perplexity desktop app, `sqlite3` | Blocked. Assumes macOS Cache.db structure. |

## Status meanings

- `v1 wave`: committed for the first Windows release.
- `planned`: expected to be portable enough later, but intentionally outside the first release scope.
- `deferred`: technically possible later, but the current implementation assumes Unix-style local storage.
- `blocked`: currently tied to macOS-only storage or shell behavior and not supportable on Windows without a rewrite.
