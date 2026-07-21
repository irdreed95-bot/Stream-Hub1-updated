---
name: StreamVault chat architecture
description: How the global/regional chat stores and syncs messages across devices
---

Chat messages are stored in `admin_settings.settings_data.chat_rooms` (same Supabase table as DMs).
Service file: `artifacts/streamvault/src/services/chatApi.ts`.

**Pattern:** same fetch/PATCH to `/rest/v1/admin_settings?id=eq.1` as adminApi.ts.
**Cross-device sync:** 3-second Supabase poll (no WebSocket needed).
**Same-device instant:** BroadcastChannel API on key `sorad_chat_<roomKey>`.
**Bot messages:** local state only — not persisted to Supabase (prevents multi-tab bot spam).
**Mute/ban lists:** localStorage only (MUTE_KEY, BAN_KEY) — admin-local, not cross-device.

**Why:** The original code used localStorage which made messages device-only. Moving persistence to Supabase + polling gives true cross-device sync within 3s.

**How to apply:** When adding new chat features, use chatApi functions (getRoomMessages, sendRoomMessage, mutateRoomMessages). Never read room messages from localStorage.
