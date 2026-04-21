# Choices

## 2026-04-14

- PR #19 fix scope: minimal consistency pass for Factory `auth.v2` only. Kept release-moving work focused on the concrete regression instead of broad upstream cleanup.

## 2026-04-21

- Usage history stores one snapshot per provider per local day. Latest successful probe wins for that day; chart stays small, stable, and persistence stays bounded to the rolling 7-day window.
