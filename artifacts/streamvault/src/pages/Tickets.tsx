import { useState, useRef, useEffect, useCallback } from "react";
import { Ticket, Send, Image, Clock, CheckCircle2, MessageSquare, XCircle, Reply, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { ticketsApi, adminApi, type SupportTicket } from "@/services/adminApi";

const USER_EMAIL_KEY = "sorad_user_email";
const USER_NAME_KEY  = "sorad_user_name";

type TicketStatus = "open" | "replied" | "closed";

const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: any; className: string }> = {
  open:    { label: "مفتوحة", icon: Clock,       className: "bg-amber-500/15 text-amber-400" },
  replied: { label: "تم الرد", icon: CheckCircle2, className: "bg-green-500/15 text-green-400" },
  closed:  { label: "مغلقة",  icon: XCircle,     className: "bg-zinc-500/15 text-zinc-400" },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export default function Tickets() {
  const { t } = useI18n();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // New ticket form
  const [name, setName]       = useState(() => localStorage.getItem(USER_NAME_KEY)  || "");
  const [email, setEmail]     = useState(() => localStorage.getItem(USER_EMAIL_KEY) || "");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [imageName, setImageName]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ticket list
  const [tickets, setTickets]             = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [userReplyDraft, setUserReplyDraft] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId]       = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Load tickets filtered by this user's email
  const loadMyTickets = useCallback(async (userEmail?: string) => {
    const em = userEmail ?? localStorage.getItem(USER_EMAIL_KEY);
    if (!em) return;
    setLoadingTickets(true);
    try {
      const all = await ticketsApi.getAll();
      setTickets(all.filter(t => t.email.toLowerCase() === em.toLowerCase()));
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => { loadMyTickets(); }, [loadMyTickets]);

  // Poll for admin replies every 30s (if user has tickets)
  useEffect(() => {
    const id = setInterval(() => { loadMyTickets(); }, 30_000);
    return () => clearInterval(id);
  }, [loadMyTickets]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Upload image to ImgBB if attached
      let imageUrl: string | undefined;
      if (imageFile) {
        const url = await adminApi.uploadImage(imageFile);
        if (url) imageUrl = url;
      }

      const newTicket: SupportTicket = {
        id: genId(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        imageUrl,
        status: "open",
        createdAt: Date.now(),
        userReplies: [],
      };

      await ticketsApi.add(newTicket);

      // Remember user identity
      localStorage.setItem(USER_NAME_KEY,  name.trim());
      localStorage.setItem(USER_EMAIL_KEY, email.trim().toLowerCase());

      setMessage(""); setImageFile(null); setImagePreview(undefined); setImageName("");
      if (fileRef.current) fileRef.current.value = "";

      await loadMyTickets(email.trim().toLowerCase());
      setExpandedTicket(newTicket.id);
      toast({ title: "✅ تم إرسال تذكرتك بنجاح", description: "سنرد عليك قريباً" });
    } catch (err: any) {
      toast({ title: "❌ فشل الإرسال", description: err?.message || "تحقق من الاتصال بالإنترنت", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUserReply(ticketId: string) {
    const text = userReplyDraft[ticketId]?.trim();
    if (!text) return;
    setReplyingId(ticketId);
    try {
      await ticketsApi.addUserReply(ticketId, text);
      setUserReplyDraft(p => ({ ...p, [ticketId]: "" }));
      await loadMyTickets();
      toast({ title: "✅ تم إرسال ردك" });
    } catch (err: any) {
      toast({ title: "❌ فشل الإرسال", description: err?.message, variant: "destructive" });
    } finally {
      setReplyingId(null);
    }
  }

  const myEmail = localStorage.getItem(USER_EMAIL_KEY);

  return (
    <div className="min-h-screen bg-[#06060a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#06060a]/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Ticket className="w-5 h-5 text-[#c9a227]" />
          <h1 className="text-lg font-bold text-white">الدعم الفني</h1>
        </div>
        {myEmail && (
          <button
            onClick={() => loadMyTickets()}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTickets ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-8">

        {/* Submit Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Send className="w-4 h-4 text-[#c9a227]" />
            <h2 className="text-base font-semibold text-white">إرسال تذكرة دعم جديدة</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <div>
              <label className="text-sm text-white/60 mb-1 block">الاسم *</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="اسمك الكامل"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a227]/50"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">البريد الإلكتروني *</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a227]/50"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">الرسالة *</label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="اشرح مشكلتك بالتفصيل..."
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a227]/50 resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">صورة (اختياري)</label>
              <div
                className="border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#c9a227]/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="w-full">
                    <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg mx-auto object-contain" />
                    <p className="text-xs text-white/40 text-center mt-2">{imageName}</p>
                  </div>
                ) : (
                  <>
                    <Image className="w-8 h-8 text-white/20 mb-2" />
                    <p className="text-sm text-white/40">انقر لإرفاق صورة</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-base font-semibold rounded-xl text-black flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #c9a227 0%, #e8c547 50%, #c9a227 100%)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "جاري الإرسال..." : "إرسال التذكرة"}
            </Button>
          </form>
        </div>

        {/* Ticket List */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-[#c9a227]" />
            <h2 className="text-base font-semibold text-white">تذاكري</h2>
            {tickets.length > 0 && (
              <span className="text-xs bg-white/10 text-white/50 rounded-full px-2 py-0.5">{tickets.length}</span>
            )}
          </div>

          {loadingTickets && tickets.length === 0 ? (
            <div className="flex items-center justify-center py-12 gap-2 text-white/30">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">جاري التحميل من Supabase...</span>
            </div>
          ) : !myEmail ? (
            <div className="text-center py-10 text-white/30">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">أرسل تذكرتك الأولى لتظهر هنا</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">لا توجد تذاكر مرتبطة بـ {myEmail}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(ticket => {
                const cfg = STATUS_CONFIG[ticket.status];
                const StatusIcon = cfg.icon;
                const isExpanded = expandedTicket === ticket.id;
                const isReplying = replyingId === ticket.id;

                return (
                  <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden" dir="rtl">
                    {/* Ticket header */}
                    <button
                      className="w-full p-4 text-right hover:bg-white/3 transition-colors"
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-sm font-medium text-white truncate">{ticket.name}</p>
                          <p className="text-xs text-white/40 truncate">{ticket.email}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1 ${cfg.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-2 leading-relaxed mt-2 text-right">{ticket.message}</p>
                      <p className="text-xs text-white/25 flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(ticket.createdAt)}
                      </p>
                    </button>

                    {/* Expanded thread */}
                    {isExpanded && (
                      <div className="border-t border-white/8 p-4 space-y-3">
                        {/* Original message */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/30 flex items-center justify-center text-xs font-bold text-[#c9a227] shrink-0">
                            {ticket.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-white/40 mb-1">{ticket.name} · {formatDate(ticket.createdAt)}</p>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
                              <p className="text-sm text-white/80 leading-relaxed">{ticket.message}</p>
                              {ticket.imageUrl && (
                                <img src={ticket.imageUrl} alt="attachment"
                                  className="max-h-32 rounded-lg object-contain mt-2 cursor-pointer"
                                  onClick={() => window.open(ticket.imageUrl, "_blank")} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin reply */}
                        {ticket.reply && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-green-400 font-semibold mb-1">👑 فريق الدعم</p>
                              <div className="bg-green-500/8 border border-green-500/15 rounded-xl p-3">
                                <p className="text-sm text-green-300/90 leading-relaxed">{ticket.reply}</p>
                                {ticket.replyImageUrl && (
                                  <img src={ticket.replyImageUrl} alt="reply attachment"
                                    className="max-h-32 rounded-lg object-contain mt-2 cursor-pointer"
                                    onClick={() => window.open(ticket.replyImageUrl, "_blank")} />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* User follow-up replies */}
                        {(ticket.userReplies || []).map((ur, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/30 flex items-center justify-center text-xs font-bold text-[#c9a227] shrink-0">
                              {ticket.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-white/40 mb-1">{ticket.name} · {formatDate(ur.createdAt)}</p>
                              <div className="bg-white/5 border border-white/8 rounded-xl p-3">
                                <p className="text-sm text-white/80 leading-relaxed">{ur.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Reply input */}
                        {ticket.status !== "closed" && (
                          <div className="flex gap-2 pt-1">
                            <Input
                              value={userReplyDraft[ticket.id] || ""}
                              onChange={e => setUserReplyDraft(p => ({ ...p, [ticket.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") handleUserReply(ticket.id); }}
                              placeholder="ردّ على فريق الدعم..."
                              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus:border-[#c9a227]/50 rounded-xl"
                              disabled={isReplying}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUserReply(ticket.id)}
                              disabled={!userReplyDraft[ticket.id]?.trim() || isReplying}
                              className="gap-1.5 shrink-0 rounded-xl"
                              style={{ background: "linear-gradient(135deg, #c9a227 0%, #e8c547 100%)", color: "#000" }}
                            >
                              {isReplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Reply className="w-3.5 h-3.5" />}
                              رد
                            </Button>
                          </div>
                        )}

                        {ticket.status === "closed" && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-xs">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            هذه التذكرة مغلقة — لفتح تذكرة جديدة استخدم النموذج أعلاه
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
