// chatApi.ts — Supabase-backed global chat with cross-device sync
// Uses same REST pattern as adminApi.ts. DO NOT change SUPABASE_URL or SUPABASE_KEY.

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  isAdmin: boolean;
  deleted?: boolean;
}

const SUPABASE_URL = "https://pxjohgzdlubkkiuooxtx.supabase.co";
const SUPABASE_KEY = "sb_publishable_dYWbhxdWs3mCzyidIXGbEQ_ha0Qlcjx";
const MAX_MSGS = 300;

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// Short-lived in-memory cache to prevent stampede on rapid reads
let _settingsCache: Record<string, any> | null = null;
let _cacheAt = 0;
const CACHE_MS = 600;

async function readSettings(): Promise<Record<string, any>> {
  if (_settingsCache && Date.now() - _cacheAt < CACHE_MS) return _settingsCache;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_settings?id=eq.1`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Supabase read failed: ${res.status}`);
  const rows = await res.json();
  _settingsCache = rows?.[0]?.settings_data ?? {};
  _cacheAt = Date.now();
  return _settingsCache!;
}

async function writeSettings(data: Record<string, any>): Promise<void> {
  _settingsCache = null; // invalidate on write
  const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_settings?id=eq.1`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ settings_data: data }),
  });
  if (!res.ok) throw new Error(`Supabase write failed: ${res.status}`);
}

/** Load all messages for a room from Supabase */
export async function getRoomMessages(roomKey: string): Promise<ChatMessage[]> {
  const data = await readSettings();
  return ((data.chat_rooms?.[roomKey] ?? []) as ChatMessage[]);
}

/** Append a new message to a room in Supabase (optimistic: caller updates UI first) */
export async function sendRoomMessage(roomKey: string, msg: ChatMessage): Promise<void> {
  const data = await readSettings();
  const rooms = { ...(data.chat_rooms ?? {}) };
  rooms[roomKey] = [...(rooms[roomKey] ?? []), msg].slice(-MAX_MSGS);
  await writeSettings({ ...data, chat_rooms: rooms });
  // Notify same-device tabs instantly via BroadcastChannel
  _bcast(roomKey, "msg", msg);
}

/** Apply a transform to all messages in a room (delete, moderate, etc.) */
export async function mutateRoomMessages(
  roomKey: string,
  mutate: (msgs: ChatMessage[]) => ChatMessage[],
): Promise<ChatMessage[]> {
  const data = await readSettings();
  const rooms = { ...(data.chat_rooms ?? {}) };
  const updated = mutate(rooms[roomKey] ?? []);
  rooms[roomKey] = updated;
  await writeSettings({ ...data, chat_rooms: rooms });
  _bcast(roomKey, "refresh", null);
  return updated;
}

// ── BroadcastChannel (zero-latency cross-tab on same device) ──────────────────
function _bcast(roomKey: string, event: string, payload: unknown) {
  try {
    const ch = new BroadcastChannel(`sorad_chat_${roomKey}`);
    ch.postMessage({ event, payload });
    ch.close();
  } catch { /* BroadcastChannel unavailable */ }
}

type MsgCb = (msg: ChatMessage) => void;
type RefreshCb = () => void;

/** Subscribe to same-device instant updates. Returns unsubscribe fn. */
export function subscribeLocal(
  roomKey: string,
  onMsg: MsgCb,
  onRefresh: RefreshCb,
): () => void {
  try {
    const ch = new BroadcastChannel(`sorad_chat_${roomKey}`);
    ch.onmessage = (ev) => {
      if (ev.data?.event === "msg") onMsg(ev.data.payload as ChatMessage);
      else if (ev.data?.event === "refresh") onRefresh();
    };
    return () => ch.close();
  } catch {
    return () => {};
  }
}
