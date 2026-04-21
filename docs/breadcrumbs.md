# Breadcrumbs

## 2026-04-14

- Reviewing PRs #18 and #19 for merge/release.
- PR #19 blocked by Factory `auth.v2` crypto API mismatch between plugin code, host wrapper, and test helper.
- Applying a minimal fix so `auth.v2` load/save behavior is consistent across runtime and tests before merge/release.

## 2026-04-21

- Added persisted 7-day usage history snapshots keyed by provider/day using the existing frontend store layer.
- Wired successful probe results to update local history and exposed history through app plugin view state.
- Added inline provider trend charts in overview/detail plus regression coverage for history derivation, persistence, and App/bootstrap wiring.
