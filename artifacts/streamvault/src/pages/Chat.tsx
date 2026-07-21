import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Trash2, VolumeX, Volume2, ShieldAlert, Crown, MessageCircle,
  Bot, Paperclip, X, MessageSquarePlus, ArrowRight, Lock, Loader2,
  LogIn,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { dmsApi } from "@/services/adminApi";
import { getRoomMessages, sendRoomMessage, mutateRoomMessages, subscribeLocal } from "@/services/chatApi";
import { Link } from "wouter";

// ─── Types ──────────────────────────────────────────────────────────────────
type RoomId = "global" | "arab" | "english";
type ChatUser = { userId: string; displayName: string; email: string; isAdmin: boolean };
type ChatMessage = {
  id: string; userId: string; displayName: string; email?: string;
  text: string; imageUrl?: string; timestamp: number; isAdmin: boolean; deleted?: boolean;
};
type DmMessage = {
  id: string; fromId: string; fromName: string; text: string; imageUrl?: string; timestamp: number;
};
type DmTarget = { userId: string; displayName: string; isAdmin: boolean };

// ─── Constants ───────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = "draeddraed75@gmail.com";
const ADMIN_PASSWORD = "Dreed12345fnr";
const ADMIN_DISPLAY  = "Admin Dreed";
const IMGBB_KEY      = "7d6e9e116b3fb6b981b8965d4fcb0f89";
const MAX_IMAGE_MB   = 3;

const BAD_WORDS = [
  "damn","shit","fuck","ass","bitch","bastard","خرا","كلب","حمار","غبي","احمق","زبالة",
];

const ROOM_CONFIGS: Record<RoomId, { label: string; flag: string; key: string }> = {
  global:  { label: "Global",  flag: "🌍", key: "sorad_chat_global" },
  arab:    { label: "العربي",  flag: "🇸🇦", key: "sorad_chat_arab" },
  english: { label: "English", flag: "🇬🇧", key: "sorad_chat_english" },
};
const MUTE_KEY = "sorad_muted_users";
const BAN_KEY  = "sorad_banned_users";
const DM_PREFIX = "sorad_dm_";

const BOT_USER = { userId: "sorad_bot_001", displayName: "سعيد_المتفرج", email: "bot@sorad.app", isAdmin: false };
const BOT_POOL_AR = [
  "مرحبا بالجميع 👋","هل شاهدتم فيلم Dune 2؟ رائع جداً 🎬","ما أحسن مسلسل عربي هالأيام؟",
  "تطبيق سراد ممتاز! شكراً للفريق 🙏","أنصح بفيلم Oppenheimer لمن لم يشاهده",
  "البث اليوم شغال كويس جداً 📺","سلام على الجميع! ما الجديد؟ 😊",
];
const BOT_POOL_EN = [
  "Hey everyone! 👋","Great streaming app, love it!","Anyone recommend a good movie?",
  "Just finished Inception again 🎬","SORAD is the best! 🙌","Anyone watching live TV?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") ?? fallback; } catch { return fallback; }
}
function saveJSON(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function hasBadWord(t: string) { return BAD_WORDS.some(w => new RegExp(w, "i").test(t)); }
function filterBadWords(t: string) {
  let o = t;
  BAD_WORDS.forEach(w => { o = o.replace(new RegExp(w, "gi"), "***"); });
  return o;
}
function formatTime(ts: number) { return new Date(ts).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }); }
function dmKey(a: string, b: string) { return DM_PREFIX + [a, b].sort().join("_"); }

// ─── ImgBB Upload ─────────────────────────────────────────────────────────────
async function uploadToImgBB(base64: string): Promise<string> {
  const fd = new FormData();
  fd.append("key", IMGBB_KEY);
  fd.append("image", base64.replace(/^data:[^;]+;base64,/, ""));
  const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message ?? "Upload failed");
  return data.data.url as string;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── Gemini AI Moderation ─────────────────────────────────────────────────────
async function geminiModerate(text: string): Promise<boolean> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `Does this chat message contain toxic, harmful, offensive, vulgar, or inappropriate language (including swearing or hate speech)? Reply ONLY with YES or NO.\n\nMessage: "${text}"` }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0 },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase() === "YES";
  } catch { return false; }
}

function AdminName() {
  return (
    <span className="font-bold text-red-400 flex items-center gap-1">
      <Crown className="w-3 h-3 text-yellow-400 inline" />
      {ADMIN_DISPLAY}
    </span>
  );
}

// ─── DM Overlay ──────────────────────────────────────────────────────────────
function DmOverlay({
  me, target, onClose,
}: { me: ChatUser; target: DmTarget; onClose: () => void }) {
  const key = dmKey(me.userId, target.userId);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [input, setInput] = useState("");
  const [imgB64, setImgB64] = useState<string | null>(null);
  const [imgName, setImgName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dmLoading, setDmLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initial load + poll Supabase for new messages every 3s
  useEffect(() => {
    let cancelled = false;
    const fetchMsgs = async () => {
      try {
        const msgs = await dmsApi.getConversation(key);
        if (!cancelled) setMessages(msgs);
      } catch { /* network hiccup — keep showing last messages */ }
      finally { if (!cancelled) setDmLoading(false); }
    };
    fetchMsgs();
    const id = setInterval(fetchMsgs, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [key]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast({ title: `الصورة كبيرة جداً (حد ${MAX_IMAGE_MB}MB)`, variant: "destructive" }); return;
    }
    setImgName(file.name);
    setImgB64(await readFileAsBase64(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSend() {
    if (!input.trim() && !imgB64) return;
    setUploading(true);
    let imageUrl: string | undefined;
    try {
      if (imgB64) imageUrl = await uploadToImgBB(imgB64);
    } catch {
      toast({ title: "فشل رفع الصورة، تحقق من اتصالك", variant: "destructive" });
      setUploading(false); return;
    }
    const msg: DmMessage = {
      id: genId(), fromId: me.userId, fromName: me.displayName,
      text: input.trim(), imageUrl, timestamp: Date.now(),
    };
    try {
      await dmsApi.send(key, msg);
      // Optimistic update + refresh from Supabase
      const updated = await dmsApi.getConversation(key);
      setMessages(updated);
    } catch {
      toast({ title: "فشل إرسال الرسالة، تحقق من الاتصال", variant: "destructive" });
    }
    setInput(""); setImgB64(null); setImgName("");
    setUploading(false);
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#06060a]">
      {/* DM Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#0d0d12] border-b border-white/8 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
          <ArrowRight className="w-4 h-4 text-white/60" />
        </button>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
          target.isAdmin ? "bg-red-500/20 border border-red-500/40 text-red-400" : "bg-[#c9a227]/20 border border-[#c9a227]/30 text-[#c9a227]"
        )}>
          {target.isAdmin ? <Crown className="w-4 h-4 text-yellow-400" /> : target.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">
            {target.isAdmin ? <span className="text-red-400 flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-400" />{target.displayName}</span> : target.displayName}
          </p>
          <p className="text-[10px] text-white/40 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> رسالة خاصة</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3" dir="rtl">
        {dmLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-white/20">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-white/20 py-16">
            <Lock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">ابدأ محادثتك الخاصة مع {target.displayName}</p>
          </div>
        ) : null}
        {messages.map(m => {
          const isOwn = m.fromId === me.userId;
          return (
            <div key={m.id} className={cn("flex gap-2 items-end", isOwn ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                isOwn ? "bg-[#c9a227]/20 border border-[#c9a227]/30 text-[#c9a227]" : "bg-white/10 text-white/60")}>
                {m.fromName.charAt(0).toUpperCase()}
              </div>
              <div className={cn("max-w-[72%] flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                <div className={cn("px-3 py-2 rounded-2xl text-sm leading-relaxed",
                  isOwn ? "bg-gradient-to-br from-[#c9a227] to-[#a07c1a] text-black rounded-tr-sm"
                    : "bg-white/8 border border-white/10 text-white rounded-tl-sm")}>
                  {m.text && <p>{m.text}</p>}
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="صورة مرسلة"
                      className="max-h-56 max-w-full rounded-xl mt-1.5 object-contain cursor-pointer"
                      onClick={() => window.open(m.imageUrl, "_blank")} />
                  )}
                </div>
                <span className="text-[10px] text-white/25">{formatTime(m.timestamp)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-[#06060a]/95 border-t border-white/5 px-3 py-3">
        {imgB64 && (
          <div className="mb-2 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <img src={imgB64} alt="preview" className="h-12 rounded-lg object-contain" />
            <span className="text-xs text-white/40 flex-1 truncate">{imgName}</span>
            <button onClick={() => { setImgB64(null); setImgName(""); }} className="text-white/40 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2" dir="rtl">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 text-white/50 hover:text-[#c9a227] hover:border-[#c9a227]/30 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="رسالة خاصة..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a227]/50 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !imgB64) || uploading}
            className="w-10 h-10 p-0 rounded-xl flex-shrink-0 text-black"
            style={{ background: (input.trim() || imgB64) ? "linear-gradient(135deg, #c9a227 0%, #e8c547 100%)" : "rgba(255,255,255,0.08)" }}
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : <Send className="w-4 h-4" style={{ color: (input.trim() || imgB64) ? "#000" : "rgba(255,255,255,0.3)" }} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat Component ───────────────────────────────────────────────────────
export default function Chat() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [room, setRoom] = useState<RoomId>("global");
  const roomKey = ROOM_CONFIGS[room].key;

  // ─── Unified auth: read from global auth (sorad_user_name / sorad_user_email)
  const [user] = useState<ChatUser | null>(() => {
    // Check sessionStorage cache first (so we don't re-compute every render)
    try {
      const cached = JSON.parse(sessionStorage.getItem("sorad_chat_user") || "null");
      if (cached?.userId) return cached;
    } catch { /* ignore */ }

    // Fall back to global auth stored by Login / Tickets pages
    const storedName  = localStorage.getItem("sorad_user_name")?.trim();
    const storedEmail = localStorage.getItem("sorad_user_email")?.trim().toLowerCase();
    if (!storedName || !storedEmail) return null;

    const isAdmin = storedEmail === ADMIN_EMAIL.toLowerCase();
    const chatUser: ChatUser = {
      userId: storedEmail,            // stable, email-based — keeps DM keys consistent
      displayName: isAdmin ? ADMIN_DISPLAY : storedName,
      email: storedEmail,
      isAdmin,
    };
    sessionStorage.setItem("sorad_chat_user", JSON.stringify(chatUser));
    return chatUser;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [badWordCount, setBadWordCount] = useState(0);
  const [dmWith, setDmWith] = useState<DmTarget | null>(null);

  // Image upload in main chat
  const [chatImgB64, setChatImgB64] = useState<string | null>(null);
  const [chatImgName, setChatImgName] = useState("");
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  const getMuted   = useCallback(() => loadJSON<string[]>(MUTE_KEY, []), []);
  const getBanned  = useCallback(() => loadJSON<string[]>(BAN_KEY,  []), []);

  // Ref so moderation closure always sees latest messages without stale capture
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Supabase fetch + BroadcastChannel subscription ───────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    // Initial load from Supabase
    getRoomMessages(roomKey)
      .then(msgs => { if (!cancelled) setMessages(msgs); })
      .catch(() => {});

    // Poll Supabase every 3 s for cross-device sync
    const pollId = setInterval(() => {
      getRoomMessages(roomKey)
        .then(msgs => {
          if (cancelled) return;
          setMessages(prev => {
            // Keep local-only bot messages that aren't yet persisted in Supabase
            const remoteIds = new Set(msgs.map(m => m.id));
            const botOnly = prev.filter(m => m.userId === BOT_USER.userId && !remoteIds.has(m.id));
            return botOnly.length === 0 ? msgs : [...msgs, ...botOnly].sort((a, b) => a.timestamp - b.timestamp);
          });
        })
        .catch(() => {});
    }, 3000);

    // BroadcastChannel — zero-latency cross-tab on same device
    const unsub = subscribeLocal(
      roomKey,
      (msg) => {
        if (!cancelled) setMessages(prev =>
          prev.some(m => m.id === msg.id) ? prev : [...prev, msg].sort((a, b) => a.timestamp - b.timestamp)
        );
      },
      () => {
        if (!cancelled) getRoomMessages(roomKey).then(msgs => { if (!cancelled) setMessages(msgs); }).catch(() => {});
      },
    );

    return () => { cancelled = true; clearInterval(pollId); unsub(); };
  }, [user, roomKey]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Dummy bot — local-only (each client shows its own bot messages; not synced to Supabase)
  useEffect(() => {
    if (!user) return;
    const post = () => {
      const muted = loadJSON<string[]>(MUTE_KEY, []);
      const banned = loadJSON<string[]>(BAN_KEY, []);
      if (muted.includes(BOT_USER.userId) || banned.includes(BOT_USER.email)) return;
      const pool = room === "english" ? BOT_POOL_EN : BOT_POOL_AR;
      const text = pool[Math.floor(Math.random() * pool.length)];
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.userId === BOT_USER.userId && Date.now() - last.timestamp < 60_000) return prev;
        const botMsg: ChatMessage = {
          id: genId(), userId: BOT_USER.userId, displayName: BOT_USER.displayName,
          email: BOT_USER.email, text, timestamp: Date.now(), isAdmin: false,
        };
        return [...prev, botMsg];
      });
    };
    const t1 = setTimeout(post, 20_000);
    const t2 = setInterval(post, 120_000 + Math.random() * 60_000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [user, room, roomKey]);

  // Regex + Gemini AI Auto-moderation (runs every 5 s on current state)
  useEffect(() => {
    if (!user) return;
    const moderate = async () => {
      const msgs = messagesRef.current;
      const muted = loadJSON<string[]>(MUTE_KEY, []);
      let changed = false;
      const toGemini: ChatMessage[] = [];

      const updated = msgs.map(m => {
        if (m.deleted || m.isAdmin || m.userId === BOT_USER.userId) return m;
        if (hasBadWord(m.text)) {
          changed = true;
          if (!muted.includes(m.userId)) { muted.push(m.userId); saveJSON(MUTE_KEY, muted); }
          return { ...m, deleted: true };
        }
        if (!m.deleted && m.text) toGemini.push(m);
        return m;
      });

      if (changed) {
        setMessages(updated);
        mutateRoomMessages(roomKey, () => updated).catch(console.error);
      }

      // Async Gemini check on last few messages
      const recent = toGemini.slice(-3);
      for (const m of recent) {
        const isToxic = await geminiModerate(m.text);
        if (isToxic) {
          setMessages(prev => prev.map(c => c.id === m.id ? { ...c, deleted: true } : c));
          mutateRoomMessages(roomKey, ms => ms.map(c => c.id === m.id ? { ...c, deleted: true } : c)).catch(console.error);
          const m2 = loadJSON<string[]>(MUTE_KEY, []);
          if (!m2.includes(m.userId)) { m2.push(m.userId); saveJSON(MUTE_KEY, m2); }
        }
      }
    };
    const id = setInterval(moderate, 5000);
    return () => clearInterval(id);
  }, [user, roomKey]);

  // (login handled globally via Login page — no local login function needed)

  // Handle image file selection for main chat
  async function handleChatFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast({ title: `الصورة كبيرة جداً (حد ${MAX_IMAGE_MB}MB)`, variant: "destructive" }); return;
    }
    setChatImgName(file.name);
    setChatImgB64(await readFileAsBase64(file));
    if (chatFileRef.current) chatFileRef.current.value = "";
  }

  // Send message in main chat
  async function handleSend() {
    if (!user || (!inputText.trim() && !chatImgB64)) return;
    const muted = getMuted();
    if (muted.includes(user.userId)) { toast({ title: "أنت محظور من الكتابة", variant: "destructive" }); return; }
    const raw = inputText.trim();
    if (raw && hasBadWord(raw)) {
      const n = badWordCount + 1;
      setBadWordCount(n);
      if (n >= 3) {
        const m = getMuted();
        if (!m.includes(user.userId)) { m.push(user.userId); saveJSON(MUTE_KEY, m); }
        toast({ title: "تم كتم صوتك بسبب استخدام ألفاظ غير لائقة", variant: "destructive" });
        setInputText(""); return;
      }
    }
    setUploading(true);
    let imageUrl: string | undefined;
    try {
      if (chatImgB64) imageUrl = await uploadToImgBB(chatImgB64);
    } catch {
      toast({ title: "فشل رفع الصورة، حاول مجدداً", variant: "destructive" });
      setUploading(false); return;
    }
    const msg: ChatMessage = {
      id: genId(), userId: user.userId, displayName: user.displayName,
      email: user.email, text: raw ? filterBadWords(raw) : "", imageUrl,
      timestamp: Date.now(), isAdmin: user.isAdmin,
    };
    // Optimistic update — show instantly, persist to Supabase async
    setMessages(prev => [...prev, msg]);
    setInputText(""); setChatImgB64(null); setChatImgName("");
    setUploading(false);
    inputRef.current?.focus();
    sendRoomMessage(roomKey, msg).catch(() => {
      toast({ title: "فشل حفظ الرسالة، تحقق من الاتصال", variant: "destructive" });
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    });
  }

  // Admin actions
  function handleDelete(msgId: string) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true } : m));
    mutateRoomMessages(roomKey, msgs => msgs.map(m => m.id === msgId ? { ...m, deleted: true } : m)).catch(console.error);
  }
  function handleMute(userId: string, displayName: string) {
    const muted = getMuted();
    if (!muted.includes(userId)) { muted.push(userId); saveJSON(MUTE_KEY, muted); toast({ title: `تم كتم ${displayName}` }); setMessages(p => [...p]); }
  }
  function handleUnmute(userId: string, displayName: string) {
    const muted = getMuted().filter(id => id !== userId);
    saveJSON(MUTE_KEY, muted);
    toast({ title: `تم رفع الكتم عن ${displayName}` });
    setMessages(p => [...p]);
  }
  function handleBan(email: string, displayName: string) {
    const banned = getBanned();
    if (!banned.includes(email.toLowerCase())) {
      banned.push(email.toLowerCase());
      saveJSON(BAN_KEY, banned);
      toast({ title: `تم حظر ${displayName}` });
    }
  }

  const onlineCount = (() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    const seen = new Set<string>();
    messages.forEach(m => { if (m.timestamp > cutoff) seen.add(m.userId); });
    if (user) seen.add(user.userId);
    seen.add(BOT_USER.userId);
    return seen.size;
  })();

  const mutedIds = getMuted();
  const isMuted = user ? mutedIds.includes(user.userId) : false;

  // ════════════════════════════════════════════════════════════════════════════
  // GUEST SCREEN — shown when no global auth is detected
  // ════════════════════════════════════════════════════════════════════════════
  if (!user) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#c9a227]/15 border border-[#c9a227]/25 flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="w-8 h-8 text-[#c9a227]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">الدردشة العامة</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            يرجى تسجيل الدخول أو إنشاء حساب من صفحة الحساب للمشاركة في الدردشة.
          </p>
          <Link href="/login">
            <Button
              className="w-full py-3 text-base font-semibold rounded-xl text-black gap-2"
              style={{ background: "linear-gradient(135deg, #c9a227 0%, #e8c547 100%)" }}
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول / إنشاء حساب
            </Button>
          </Link>
          <p className="text-white/25 text-xs mt-4">
            بعد تسجيل الدخول ارجع لهذه الصفحة لتبدأ الدردشة
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CHAT SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen bg-[#06060a] text-white relative overflow-hidden">

      {/* DM Overlay */}
      {dmWith && (
        <DmOverlay me={user} target={dmWith} onClose={() => setDmWith(null)} />
      )}

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-[#06060a]/95 backdrop-blur-sm border-b border-white/5 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#c9a227]" />
            <h1 className="text-base font-bold">الدردشة</h1>
            <span className="text-[10px] text-cyan-400/60 flex items-center gap-1 bg-cyan-500/8 border border-cyan-500/15 rounded-full px-2 py-0.5">
              <Bot className="w-2.5 h-2.5" /> AI مراقب
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/50">{onlineCount} متصل</span>
            {user.isAdmin && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-400" /> Admin
              </span>
            )}
          </div>
        </div>

        {/* Room tabs */}
        <div className="flex gap-2">
          {(Object.keys(ROOM_CONFIGS) as RoomId[]).map(r => (
            <button
              key={r}
              onClick={() => setRoom(r)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                room === r
                  ? "bg-[#c9a227]/20 border-[#c9a227]/40 text-[#c9a227]"
                  : "bg-white/5 border-white/8 text-white/50 hover:text-white/70 hover:border-white/20"
              )}
            >
              <span>{ROOM_CONFIGS[r].flag}</span>
              <span>{ROOM_CONFIGS[r].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3" dir="rtl">
        {messages.length === 0 && (
          <div className="text-center text-white/20 py-16">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">لا توجد رسائل في {ROOM_CONFIGS[room].label}. كن أول من يتحدث!</p>
          </div>
        )}

        {messages.map(msg => {
          if (msg.deleted) return (
            <div key={msg.id} className="flex justify-center">
              <span className="text-xs text-white/20 italic">تم حذف هذه الرسالة</span>
            </div>
          );
          const isOwn  = msg.userId === user.userId;
          const isBot  = msg.userId === BOT_USER.userId;
          const isMsgMuted = mutedIds.includes(msg.userId);
          const canDM  = !isOwn && !isBot && !msg.isAdmin;

          return (
            <div key={msg.id} className={cn("flex gap-2 items-end", isOwn ? "flex-row-reverse" : "flex-row")}>
              {/* Avatar */}
              <button
                onClick={() => canDM ? setDmWith({ userId: msg.userId, displayName: msg.displayName, isAdmin: msg.isAdmin }) : undefined}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                  msg.isAdmin ? "bg-red-500/20 border border-red-500/40 text-red-400"
                    : isBot  ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                    : "bg-white/10 text-white/60",
                  canDM && "cursor-pointer hover:ring-2 hover:ring-[#c9a227]/40 transition-all"
                )}
                title={canDM ? `رسالة خاصة لـ ${msg.displayName}` : undefined}
              >
                {msg.isAdmin ? <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  : isBot   ? <Bot className="w-3.5 h-3.5" />
                  : msg.displayName.charAt(0).toUpperCase()}
              </button>

              {/* Bubble */}
              <div className={cn("max-w-[72%] flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                <div className="text-xs px-1 flex items-center gap-1">
                  {msg.isAdmin ? <AdminName />
                    : isBot   ? <span className="text-cyan-400/70 flex items-center gap-1"><Bot className="w-2.5 h-2.5" />{msg.displayName}</span>
                    : (
                      <button
                        onClick={() => canDM ? setDmWith({ userId: msg.userId, displayName: msg.displayName, isAdmin: false }) : undefined}
                        className={cn("text-white/40", canDM && "hover:text-[#c9a227]/80 transition-colors cursor-pointer")}
                        title={canDM ? `رسالة خاصة لـ ${msg.displayName}` : undefined}
                      >
                        {msg.displayName}
                      </button>
                    )}
                  {canDM && (
                    <button
                      title="رسالة خاصة"
                      onClick={() => setDmWith({ userId: msg.userId, displayName: msg.displayName, isAdmin: false })}
                      className="flex items-center"
                    >
                      <MessageSquarePlus className="w-3 h-3 text-white/20 hover:text-[#c9a227]/60 cursor-pointer transition-colors" />
                    </button>
                  )}
                </div>
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                  isOwn ? "bg-gradient-to-br from-[#c9a227] to-[#a07c1a] text-black rounded-tr-sm"
                    : msg.isAdmin ? "bg-red-500/10 border border-red-500/20 text-white rounded-tl-sm"
                    : isBot ? "bg-cyan-500/8 border border-cyan-500/15 text-white/90 rounded-tl-sm"
                    : "bg-white/8 border border-white/10 text-white rounded-tl-sm"
                )}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="صورة مرسلة"
                      className="max-h-56 max-w-full rounded-xl mt-1.5 object-contain cursor-pointer"
                      onClick={() => window.open(msg.imageUrl, "_blank")}
                    />
                  )}
                </div>
                <div className={cn("flex items-center gap-1.5", isOwn ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-[10px] text-white/25">{formatTime(msg.timestamp)}</span>
                  {user.isAdmin && !isOwn && (
                    <>
                      <button onClick={() => handleDelete(msg.id)} className="text-red-400/60 hover:text-red-400 transition-colors p-0.5" title="حذف الرسالة"><Trash2 className="w-3 h-3" /></button>
                      {isMsgMuted
                        ? <button onClick={() => handleUnmute(msg.userId, msg.displayName)} className="text-green-400/60 hover:text-green-400 p-0.5" title="رفع الكتم"><Volume2 className="w-3 h-3" /></button>
                        : <button onClick={() => handleMute(msg.userId, msg.displayName)} className="text-amber-400/60 hover:text-amber-400 p-0.5" title="كتم المستخدم"><VolumeX className="w-3 h-3" /></button>
                      }
                      <button onClick={() => handleBan(msg.email || msg.displayName, msg.displayName)} className="text-red-500/60 hover:text-red-500 p-0.5" title="حظر المستخدم"><ShieldAlert className="w-3 h-3" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 bg-[#06060a]/95 border-t border-white/5 px-3 py-3">
        {isMuted ? (
          <div className="flex items-center justify-center gap-2 py-2 text-amber-400/80 text-sm">
            <VolumeX className="w-4 h-4" />
            أنت محظور من الكتابة في هذه الغرفة
          </div>
        ) : (
          <div className="space-y-2">
            {chatImgB64 && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <img src={chatImgB64} alt="preview" className="h-12 rounded-lg object-contain" />
                <span className="text-xs text-white/40 flex-1 truncate">{chatImgName}</span>
                <button onClick={() => { setChatImgB64(null); setChatImgName(""); }} className="text-white/40 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2" dir="rtl">
              <button
                type="button"
                onClick={() => chatFileRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 text-white/50 hover:text-[#c9a227] hover:border-[#c9a227]/30 transition-colors"
                title="إرفاق صورة"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatFileChange} />
              <Input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`اكتب رسالة في ${ROOM_CONFIGS[room].label}...`}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a227]/50 rounded-xl"
              />
              <Button
                onClick={handleSend}
                disabled={(!inputText.trim() && !chatImgB64) || uploading}
                className="w-10 h-10 p-0 rounded-xl flex-shrink-0 text-black"
                style={{ background: (inputText.trim() || chatImgB64) ? "linear-gradient(135deg, #c9a227 0%, #e8c547 100%)" : "rgba(255,255,255,0.08)" }}
              >
                {uploading
                  ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <Send className="w-4 h-4" style={{ color: (inputText.trim() || chatImgB64) ? "#000" : "rgba(255,255,255,0.3)" }} />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
