// Admin API — Supabase-backed settings store + ImgBB image uploads
// DO NOT modify SUPABASE_URL, SUPABASE_KEY, or any connection strings.

export interface SocialLinks {
  discord: string;
  instagram: string;
  telegram: string;
  youtube: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  message: string;
  imageUrl?: string;
  status: "open" | "replied" | "closed";
  reply?: string;
  replyImageUrl?: string;
  userReplies?: { text: string; createdAt: number }[];
  createdAt: number;
}

export interface DmMessage {
  id: string;
  fromId: string;
  fromName: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
}

export interface AdminSettings {
  banner_enabled: boolean;
  banner_text: string;
  ads_enabled: boolean;
  ad_image: string;
  apk_link: string;
  app_version: string;
  update_notes: string;
  custom_streams: Array<{ id: string; tmdbId: string; type: "movie" | "tv"; label: string; url: string }>;
  tv_channels: Array<{ id: string; name: string; logo: string; url: string; category: string }>;
  category_images: Record<string, string>;
  server_urls: string[];
  social_links: SocialLinks;
  tickets: SupportTicket[];
  chat_dms: Record<string, DmMessage[]>;
}

export type PublicSettings = Pick<
  AdminSettings,
  "banner_enabled" | "banner_text" | "ads_enabled" | "ad_image" |
  "apk_link" | "app_version" | "update_notes" | "tv_channels" | "category_images" | "social_links"
>;

const DEFAULT_SETTINGS: AdminSettings = {
  banner_enabled: false,
  banner_text: "",
  ads_enabled: false,
  ad_image: "",
  apk_link: "",
  app_version: "",
  update_notes: "",
  custom_streams: [],
  tv_channels: [],
  category_images: {},
  server_urls: [],
  social_links: { discord: "", instagram: "", telegram: "", youtube: "" },
  tickets: [],
  chat_dms: {},
};

// Supabase connection — DO NOT CHANGE
const SUPABASE_URL = "https://pxjohgzdlubkkiuooxtx.supabase.co";
const SUPABASE_KEY = "sb_publishable_dYWbhxdWs3mCzyidIXGbEQ_ha0Qlcjx";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

async function fetchSettingsFromSupabase(): Promise<AdminSettings> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_settings?id=eq.1`, { headers: HEADERS });
    if (!res.ok) throw new Error("DB connection failed");
    const data = await res.json();
    if (data && data.length > 0 && data[0].settings_data) {
      return { ...DEFAULT_SETTINGS, ...data[0].settings_data };
    }
  } catch (error) {
    console.error("Settings fetch error:", error);
  }
  return DEFAULT_SETTINGS;
}

async function saveSettingsToSupabase(settings: AdminSettings) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_settings?id=eq.1`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ settings_data: settings })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase save failed (${res.status}): ${body}`);
  }
}

// ─── Public Settings API (no auth required) ───────────────────────────────────
export const publicSettingsApi = {
  get: async (): Promise<PublicSettings> => fetchSettingsFromSupabase(),
  customStreams: async (tmdbId: string, type: "movie" | "tv") => {
    const settings = await fetchSettingsFromSupabase();
    return settings.custom_streams.filter(
      s => String(s.tmdbId) === String(tmdbId) && s.type === type
    );
  },
  serverUrls: async (): Promise<string[]> => {
    const settings = await fetchSettingsFromSupabase();
    return settings.server_urls || [];
  },
  socialLinks: async (): Promise<SocialLinks> => {
    const settings = await fetchSettingsFromSupabase();
    return settings.social_links || { discord: "", instagram: "", telegram: "", youtube: "" };
  },
};

// ─── Tickets API ───────────────────────────────────────────────────────────────
export const ticketsApi = {
  /** Fetch all tickets (admin gets all; user filters by email client-side) */
  getAll: async (): Promise<SupportTicket[]> => {
    const s = await fetchSettingsFromSupabase();
    return (s.tickets || []).sort((a, b) => b.createdAt - a.createdAt);
  },

  /** Submit a new ticket */
  add: async (ticket: SupportTicket): Promise<void> => {
    const current = await fetchSettingsFromSupabase();
    const tickets = [...(current.tickets || []), ticket];
    await saveSettingsToSupabase({ ...current, tickets });
  },

  /** Update an existing ticket (admin reply, close, user reply) */
  update: async (ticketId: string, changes: Partial<SupportTicket>): Promise<void> => {
    const current = await fetchSettingsFromSupabase();
    const tickets = (current.tickets || []).map(t =>
      t.id === ticketId ? { ...t, ...changes } : t
    );
    await saveSettingsToSupabase({ ...current, tickets });
  },

  /** Append a user follow-up reply to a ticket */
  addUserReply: async (ticketId: string, replyText: string): Promise<void> => {
    const current = await fetchSettingsFromSupabase();
    const tickets = (current.tickets || []).map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        userReplies: [...(t.userReplies || []), { text: replyText, createdAt: Date.now() }],
      };
    });
    await saveSettingsToSupabase({ ...current, tickets });
  },
};

// ─── DMs API ──────────────────────────────────────────────────────────────────
export const dmsApi = {
  /** Fetch messages for a conversation key (e.g. "userId1_userId2" sorted) */
  getConversation: async (key: string): Promise<DmMessage[]> => {
    const current = await fetchSettingsFromSupabase();
    return (current.chat_dms || {})[key] || [];
  },

  /** Send a DM message to a conversation */
  send: async (key: string, message: DmMessage): Promise<void> => {
    const current = await fetchSettingsFromSupabase();
    const dms = { ...(current.chat_dms || {}) };
    const conv = [...(dms[key] || []), message];
    // Keep only last 200 messages per conversation to avoid unbounded growth
    dms[key] = conv.slice(-200);
    await saveSettingsToSupabase({ ...current, chat_dms: dms });
  },
};

// ─── Admin API (authenticated operations) ─────────────────────────────────────
export const adminApi = {
  checkSession: async () => {
    const isAuth = typeof window !== "undefined" && sessionStorage.getItem("sarrad_admin_auth") === "true";
    return { authenticated: isAuth };
  },

  login: async (password: string) => {
    const ADMIN_PASS = "Dreed12345fnr";
    if (password === ADMIN_PASS) {
      if (typeof window !== "undefined") sessionStorage.setItem("sarrad_admin_auth", "true");
      return { ok: true };
    }
    throw new Error("كلمة المرور غير صحيحة");
  },

  logout: async () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("sarrad_admin_auth");
    return { ok: true };
  },

  getSettings: async (): Promise<AdminSettings> => fetchSettingsFromSupabase(),

  updateSettings: async (partial: Partial<AdminSettings>): Promise<AdminSettings> => {
    const current = await fetchSettingsFromSupabase();
    const updated = { ...current, ...partial };
    await saveSettingsToSupabase(updated);
    return updated;
  },

  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const IMGBB_API_KEY = "7d6e9e116b3fb6b981b8965d4fcb0f89";
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data && data.success) return data.data.url;
      throw new Error("ImgBB upload failed");
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    }
  },
};
