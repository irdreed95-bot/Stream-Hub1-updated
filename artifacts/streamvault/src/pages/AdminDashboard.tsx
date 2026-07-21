import React, { useState, useEffect, useRef, useCallback } from "react";
import { adminApi, AdminSettings, ticketsApi } from "../services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Server, Plus, Trash2, Save, UploadCloud, Tv, Image as ImageIcon, Megaphone,
  Settings2, Download, CheckCircle2, ShieldAlert, Layers, Globe, LayoutGrid,
  Ticket, Share2, MessageSquare, Reply, Eye, EyeOff, Users, VolumeX, Volume2,
  Ban, RefreshCw, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Ticket type (mirrors what's stored by users in localStorage)
interface SupportTicket {
  id: string;
  name: string;
  email: string;
  message: string;
  imageB64?: string;
  status: "open" | "replied" | "closed";
  reply?: string;
  replyImageB64?: string;
  userReplies?: { text: string; createdAt: number }[];
  createdAt: number;
}

const TABS = [
  { id: "general",    label: "عام",            icon: Settings2 },
  { id: "update",     label: "تحديث",          icon: Download },
  { id: "ads",        label: "إعلانات",        icon: Megaphone },
  { id: "categories", label: "الفئات",         icon: LayoutGrid },
  { id: "channels",   label: "القنوات",        icon: Tv },
  { id: "streams",    label: "سيرفرات مخصصة",  icon: Layers },
  { id: "servers",    label: "سيرفرات التطبيق",icon: Globe },
  { id: "tickets",    label: "تذاكر الدعم",    icon: Ticket },
  { id: "social",     label: "التواصل",        icon: Share2 },
  { id: "chat",       label: "إدارة الدردشة",  icon: MessageSquare },
] as const;

type TabId = typeof TABS[number]["id"];

const DEFAULT_SETTINGS: AdminSettings = {
  banner_enabled: false, banner_text: "",
  ads_enabled: false, ad_image: "",
  apk_link: "", app_version: "", update_notes: "",
  custom_streams: [], tv_channels: [], category_images: {}, server_urls: [],
  social_links: { discord: "", instagram: "", telegram: "", youtube: "" },
  tickets: [],
  chat_dms: {},
};

const CATEGORY_LIST = [
  { id: 28,    name: "أكشن / Action" },
  { id: 35,    name: "كوميديا / Comedy" },
  { id: 18,    name: "دراما / Drama" },
  { id: 27,    name: "رعب / Horror" },
  { id: 878,   name: "خيال علمي / Sci-Fi" },
  { id: 10751, name: "عائلي / Family" },
  { id: 16,    name: "أنيمي / Anime" },
  { id: 10749, name: "رومانسي / Romance" },
  { id: 80,    name: "جريمة / Crime" },
  { id: 99,    name: "وثائقي / Documentary" },
  { id: 10752, name: "حرب / War" },
  { id: 14,    name: "فانتازيا / Fantasy" },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const adFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi.checkSession().then((res) => {
      setIsAuthenticated(res.authenticated);
      if (res.authenticated) {
        adminApi.getSettings().then((data) => { setSettings(data); setIsLoading(false); });
      } else { setIsLoading(false); }
    });
  }, []);

  const loadChatData = useCallback(() => {
    try {
      const msgs = JSON.parse(localStorage.getItem("sorad_chat_messages") || "[]");
      setChatMessages(msgs.filter((m: any) => !m.deleted).reverse().slice(0, 100));
      const muted = JSON.parse(localStorage.getItem("sorad_muted_users") || "[]");
      setMutedUsers(muted);
      const banned = JSON.parse(localStorage.getItem("sorad_banned_users") || "[]");
      setBannedUsers(banned);
    } catch {}
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") {
      ticketsApi.getAll()
        .then(all => setTickets(all))
        .catch(() => {});
    }
    if (activeTab === "chat") loadChatData();
  }, [activeTab, loadChatData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.login(password);
      setIsAuthenticated(true);
      const data = await adminApi.getSettings();
      setSettings(data);
    } catch {
      toast({ title: "خطأ", description: "كلمة المرور غير صحيحة", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast({ title: "✓ تم الحفظ بنجاح", description: "تم تحديث الإعدادات" });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const uploadFile = async (file: File, onSuccess: (url: string) => void, key?: string) => {
    if (key) setUploading(p => ({ ...p, [key]: true }));
    const url = await adminApi.uploadImage(file);
    if (url) onSuccess(url);
    else toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" });
    if (key) setUploading(p => ({ ...p, [key]: false }));
  };

  // Streams
  const addStream = () => setSettings(p => ({
    ...p, custom_streams: [...p.custom_streams, { id: Date.now().toString(), tmdbId: "", type: "movie", label: "سيرفر جديد", url: "" }]
  }));
  const updateStream = (id: string, field: string, value: string) => setSettings(p => ({
    ...p, custom_streams: p.custom_streams.map(s => s.id === id ? { ...s, [field]: value } : s)
  }));
  const deleteStream = (id: string) => setSettings(p => ({
    ...p, custom_streams: p.custom_streams.filter(s => s.id !== id)
  }));

  // Channels
  const addChannel = () => setSettings(p => ({
    ...p, tv_channels: [...(p.tv_channels || []), { id: Date.now().toString(), name: "قناة جديدة", url: "", logo: "", category: "عام" }]
  }));
  const updateChannel = (id: string, field: string, value: string) => setSettings(p => ({
    ...p, tv_channels: p.tv_channels.map(ch => ch.id === id ? { ...ch, [field]: value } : ch)
  }));
  const deleteChannel = (index: number) => setSettings(p => {
    const updated = [...p.tv_channels]; updated.splice(index, 1);
    return { ...p, tv_channels: updated };
  });

  // Servers
  const updateServerUrl = (index: number, url: string) => setSettings(p => {
    const updated = [...(p.server_urls || [])];
    updated[index] = url;
    return { ...p, server_urls: updated };
  });

  // Category images
  const updateCategoryImage = (genreId: number, url: string) => setSettings(p => ({
    ...p, category_images: { ...p.category_images, [String(genreId)]: url }
  }));

  // Ticket reply — writes directly to Supabase
  const handleReply = async (ticketId: string) => {
    const reply = replyDraft[ticketId];
    if (!reply?.trim()) return;
    try {
      await ticketsApi.update(ticketId, { status: "replied", reply: reply.trim() });
      setReplyDraft(p => ({ ...p, [ticketId]: "" }));
      const all = await ticketsApi.getAll();
      setTickets(all);
      toast({ title: "✓ تم الرد وحُفظ في Supabase" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message, variant: "destructive" });
    }
  };

  // Close ticket — writes directly to Supabase
  const handleCloseTicket = async (ticketId: string) => {
    try {
      await ticketsApi.update(ticketId, { status: "closed" });
      const all = await ticketsApi.getAll();
      setTickets(all);
      toast({ title: "✓ تم إغلاق التذكرة في Supabase" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message, variant: "destructive" });
    }
  };

  // Chat moderation
  const deleteMessage = (msgId: string) => {
    const msgs: any[] = JSON.parse(localStorage.getItem("sorad_chat_messages") || "[]");
    const updated = msgs.map(m => m.id === msgId ? { ...m, deleted: true } : m);
    localStorage.setItem("sorad_chat_messages", JSON.stringify(updated));
    loadChatData();
  };

  const toggleMute = (userId: string) => {
    const muted: string[] = JSON.parse(localStorage.getItem("sorad_muted_users") || "[]");
    const isMuted = muted.includes(userId);
    const updated = isMuted ? muted.filter(id => id !== userId) : [...muted, userId];
    localStorage.setItem("sorad_muted_users", JSON.stringify(updated));
    setMutedUsers(updated);
    toast({ title: isMuted ? "تم رفع الكتم" : "تم كتم المستخدم" });
  };

  const toggleBan = (userId: string) => {
    const banned: string[] = JSON.parse(localStorage.getItem("sorad_banned_users") || "[]");
    const isBanned = banned.includes(userId);
    const updated = isBanned ? banned.filter(id => id !== userId) : [...banned, userId];
    localStorage.setItem("sorad_banned_users", JSON.stringify(updated));
    setBannedUsers(updated);
    toast({ title: isBanned ? "تم رفع الحظر" : "تم حظر المستخدم" });
  };

  // ── Login screen ──
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06060a] text-foreground">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06060a] p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-br from-[#f0d060] via-[#c9a227] to-[#8b6914]" />
            <img src="/sorad-logo.png" alt="SORAD" className="relative w-16 h-16 rounded-[16px] object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">لوحة تحكم سُراد</h1>
            <p className="text-muted-foreground text-sm mt-1">SORAD Admin Dashboard</p>
          </div>
        </div>
        <div className="bg-[#0d0d12] rounded-3xl border border-white/8 p-8 shadow-2xl" dir="rtl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">كلمة المرور</Label>
              <div className="relative">
                <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-11 h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-primary"
                  dir="ltr"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base">
              دخول
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  // ── Main dashboard ──
  return (
    <div className="min-h-screen bg-[#06060a] text-foreground" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#08080c]/95 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/sorad-logo.png" alt="SORAD" className="w-8 h-8 rounded-xl object-cover" />
            <h1 className="text-base font-black text-white hidden sm:block">لوحة تحكم سُراد</h1>
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  activeTab === id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost" size="sm"
            onClick={() => { sessionStorage.removeItem("sarrad_admin_auth"); window.location.reload(); }}
            className="text-xs text-white/30 hover:text-white/70 shrink-0"
          >
            خروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl pb-32">

        {/* ── General Settings ── */}
        {activeTab === "general" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader>
                <CardTitle className="text-white">الإعدادات العامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <Label className="text-sm font-semibold text-white">شريط الإعلانات (Banner)</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">عرض شريط تنبيه أعلى التطبيق</p>
                  </div>
                  <Switch checked={settings.banner_enabled} onCheckedChange={(v) => setSettings({ ...settings, banner_enabled: v })} />
                </div>
                {settings.banner_enabled && (
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">نص الشريط</Label>
                    <Input
                      value={settings.banner_text}
                      onChange={(e) => setSettings({ ...settings, banner_text: e.target.value })}
                      placeholder="أدخل نص الشريط هنا..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <Label className="text-sm font-semibold text-white">تفعيل الإعلانات</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">تحكم بظهور الإعلانات في التطبيق</p>
                  </div>
                  <Switch checked={settings.ads_enabled} onCheckedChange={(v) => setSettings({ ...settings, ads_enabled: v })} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── App Update ── */}
        {activeTab === "update" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  نظام تحديث التطبيق
                </CardTitle>
                <CardDescription>إدارة إشعارات التحديث وروابط التنزيل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">رابط تحميل APK</Label>
                  <Input
                    value={settings.apk_link}
                    onChange={(e) => setSettings({ ...settings, apk_link: e.target.value })}
                    placeholder="https://example.com/app.apk"
                    dir="ltr"
                    className="text-left bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">رقم الإصدار</Label>
                  <Input
                    value={settings.app_version}
                    onChange={(e) => setSettings({ ...settings, app_version: e.target.value })}
                    placeholder="مثال: 2.1.0"
                    dir="ltr"
                    className="text-left bg-white/5 border-white/10 text-white placeholder:text-white/30 max-w-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">ملاحظات الإصدار (اختياري)</Label>
                  <Textarea
                    value={settings.update_notes}
                    onChange={(e) => setSettings({ ...settings, update_notes: e.target.value })}
                    placeholder="ما الجديد في هذا الإصدار؟"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] resize-none"
                  />
                </div>
                {settings.apk_link && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>شعار التحديث نشط — سيُعرض للمستخدمين</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Ads ── */}
        {activeTab === "ads" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  إدارة الإعلانات
                </CardTitle>
                <CardDescription>رفع صورة إعلانية بنرية تُدرج بين صفوف المحتوى</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <Label className="text-sm font-semibold text-white">تفعيل الإعلانات</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">تحكم بظهور الإعلانات البنرية المدمجة</p>
                  </div>
                  <Switch checked={settings.ads_enabled} onCheckedChange={(v) => setSettings({ ...settings, ads_enabled: v })} />
                </div>
                <div className="space-y-3">
                  <Label className="text-white/70 text-sm font-semibold">صورة الإعلان البنري</Label>
                  <p className="text-xs text-muted-foreground">تُعرض الإعلانات الآن مضمنة بين صفوف الأفلام (وليس طافية) — يُفضّل نسبة 6:1 أو بانر عريض</p>
                  {settings.ad_image && (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-sm">
                      <img src={settings.ad_image} alt="Ad preview" className="w-full object-cover" />
                      <button
                        onClick={() => setSettings({ ...settings, ad_image: "" })}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/80 hover:text-white text-xs font-bold"
                      >✕</button>
                    </div>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    <input
                      ref={adFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await uploadFile(file, (url) => setSettings(s => ({ ...s, ad_image: url })), "ad_image");
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="outline"
                      className="gap-2 border-white/10 bg-white/3 hover:bg-white/8 text-white/70"
                      onClick={() => adFileRef.current?.click()}
                      disabled={uploading.ad_image}
                    >
                      {uploading.ad_image
                        ? <><UploadCloud className="w-4 h-4 animate-pulse text-primary" /> جاري الرفع...</>
                        : <><UploadCloud className="w-4 h-4" /> رفع صورة من جهازك</>
                      }
                    </Button>
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        value={settings.ad_image}
                        onChange={(e) => setSettings({ ...settings, ad_image: e.target.value })}
                        placeholder="أو أدخل رابط الصورة..."
                        dir="ltr"
                        className="text-left bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  {settings.ads_enabled && settings.ad_image && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>الإعلان البنري نشط — يظهر مدمجاً بين صفوف المحتوى</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Categories ── */}
        {activeTab === "categories" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  تخصيص صور الفئات
                </CardTitle>
                <CardDescription>ارفع صورة مخصصة لكل فئة — تُعرض كخلفية في شاشة التصفح</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {CATEGORY_LIST.map((cat) => {
                  const currentImg = settings.category_images[String(cat.id)] || "";
                  const uploadKey = `cat-${cat.id}`;
                  return (
                    <div key={cat.id} className="flex items-center gap-3 p-3 border border-white/8 rounded-xl bg-white/2">
                      <div className="w-20 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                        {currentImg
                          ? <img src={currentImg} alt={cat.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">لا توجد صورة</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{cat.name}</p>
                        <div className="flex gap-2 mt-1.5">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await uploadFile(file, (url) => updateCategoryImage(cat.id, url), uploadKey);
                                e.target.value = "";
                              }}
                            />
                            <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-white/10 bg-white/3 gap-1.5 relative z-0" disabled={uploading[uploadKey]}>
                              {uploading[uploadKey] ? <UploadCloud className="w-3.5 h-3.5 animate-pulse text-primary" /> : <UploadCloud className="w-3.5 h-3.5" />}
                              رفع صورة
                            </Button>
                          </div>
                          <Input
                            value={currentImg}
                            onChange={(e) => updateCategoryImage(cat.id, e.target.value)}
                            placeholder="رابط الصورة..."
                            dir="ltr"
                            className="h-8 text-xs text-left bg-white/5 border-white/10 text-white placeholder:text-white/20 flex-1"
                          />
                          {currentImg && (
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => updateCategoryImage(cat.id, "")}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Channels ── */}
        {activeTab === "channels" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">القنوات التلفزيونية</CardTitle>
                  <CardDescription>إدارة قنوات البث المباشر</CardDescription>
                </div>
                <Button onClick={addChannel} size="sm" className="gap-2 rounded-xl">
                  <Plus className="w-4 h-4" /> إضافة قناة
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.tv_channels?.map((channel, index) => (
                  <div key={channel.id || index} className="p-4 border border-white/8 rounded-2xl bg-white/2 space-y-3 relative">
                    <Button
                      variant="destructive" size="icon"
                      className="absolute top-3 left-3 h-8 w-8 rounded-xl"
                      onClick={() => deleteChannel(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mr-12">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">اسم القناة</Label>
                        <Input value={channel.name} onChange={(e) => updateChannel(channel.id, "name", e.target.value)} placeholder="MBC 1" className="bg-white/5 border-white/10 text-white text-sm h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">رابط البث (M3U8)</Label>
                        <Input value={channel.url} onChange={(e) => updateChannel(channel.id, "url", e.target.value)} placeholder="https://...m3u8" dir="ltr" className="text-left bg-white/5 border-white/10 text-white text-sm h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">التصنيف</Label>
                        <Input value={channel.category} onChange={(e) => updateChannel(channel.id, "category", e.target.value)} placeholder="عام، رياضة، أخبار..." className="bg-white/5 border-white/10 text-white text-sm h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">رابط اللوغو</Label>
                        <div className="flex gap-2">
                          <Input value={channel.logo} onChange={(e) => updateChannel(channel.id, "logo", e.target.value)} placeholder="https://..." dir="ltr" className="text-left bg-white/5 border-white/10 text-white text-sm h-10 flex-1" />
                          <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await uploadFile(file, (url) => updateChannel(channel.id, "logo", url), `logo-${channel.id}`);
                                e.target.value = "";
                              }}
                            />
                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 border-white/10">
                              {uploading[`logo-${channel.id}`] ? <UploadCloud className="w-4 h-4 animate-pulse" /> : <ImageIcon className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!settings.tv_channels || settings.tv_channels.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                    <Tv className="w-12 h-12 opacity-15" />
                    <p className="text-sm">لا توجد قنوات مضافة حالياً</p>
                    <Button variant="outline" size="sm" onClick={addChannel} className="gap-2 rounded-xl border-white/10">
                      <Plus className="w-3.5 h-3.5" /> إضافة أول قناة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Custom Streams ── */}
        {activeTab === "streams" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">السيرفرات المخصصة</CardTitle>
                  <CardDescription>إضافة روابط مشاهدة يدوية مرتبطة بـ TMDB ID</CardDescription>
                </div>
                <Button onClick={addStream} size="sm" className="gap-2 rounded-xl">
                  <Plus className="w-4 h-4" /> إضافة سيرفر
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.custom_streams.map((stream) => (
                  <div key={stream.id} className="p-4 border border-white/8 rounded-2xl bg-white/2 space-y-3 relative">
                    <Button variant="destructive" size="icon" className="absolute top-3 left-3 h-8 w-8 rounded-xl" onClick={() => deleteStream(stream.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mr-12">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">نوع العمل</Label>
                        <Select value={stream.type} onValueChange={(v: "movie" | "tv") => updateStream(stream.id, "type", v)}>
                          <SelectTrigger className="bg-white/5 border-white/10 h-10 text-sm text-white rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="movie">🎬 فيلم</SelectItem>
                            <SelectItem value="tv">📺 مسلسل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">TMDB ID</Label>
                        <Input value={stream.tmdbId} onChange={(e) => updateStream(stream.id, "tmdbId", e.target.value)} placeholder="12345" dir="ltr" className="text-left bg-white/5 border-white/10 text-white text-sm h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">اسم السيرفر</Label>
                        <Input value={stream.label} onChange={(e) => updateStream(stream.id, "label", e.target.value)} placeholder="سيرفر 1" className="bg-white/5 border-white/10 text-white text-sm h-10" />
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <Label className="text-xs text-white/60">رابط الفيديو</Label>
                        <Input value={stream.url} onChange={(e) => updateStream(stream.id, "url", e.target.value)} placeholder="https://..." dir="ltr" className="text-left bg-white/5 border-white/10 text-white text-sm h-10" />
                      </div>
                    </div>
                  </div>
                ))}
                {settings.custom_streams.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                    <Layers className="w-12 h-12 opacity-15" />
                    <p className="text-sm">لا توجد سيرفرات مخصصة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── App Servers ── */}
        {activeTab === "servers" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  سيرفرات التطبيق (D1 – D10)
                </CardTitle>
                <CardDescription>
                  10 سيرفرات بديلة — تُحفظ في قاعدة البيانات وتُحدَّث فوراً لجميع المستخدمين
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Label className="text-xs text-white/60 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-primary/20 text-primary text-[11px] font-black">D{i + 1}</span>
                      سيرفر {["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر"][i]}
                      {settings.server_urls?.[i] && (
                        <span className="ms-auto w-1.5 h-1.5 rounded-full bg-green-500" title="نشط" />
                      )}
                    </Label>
                    <Input
                      value={settings.server_urls?.[i] || ""}
                      onChange={(e) => updateServerUrl(i, e.target.value)}
                      placeholder={`رابط السيرفر D${i + 1} (مثال: https://vidsrc.to/embed/...)‎`}
                      dir="ltr"
                      className="text-left bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                    />
                  </div>
                ))}
                <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-blue-400/80 text-xs mt-2">
                  💡 احفظ التغييرات بالزر أدناه — تُرسَل مباشرةً لقاعدة البيانات وتظهر فوراً للمستخدمين في قائمة السيرفرات
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tickets ── */}
        {activeTab === "tickets" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    تذاكر الدعم
                  </CardTitle>
                  <CardDescription>عرض وإدارة طلبات الدعم الواردة من المستخدمين</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  try {
                    const stored = JSON.parse(localStorage.getItem("sorad_tickets") || "[]");
                    setTickets([...stored].sort((a, b) => b.createdAt - a.createdAt));
                  } catch {}
                  toast({ title: "تم التحديث" });
                }} className="gap-2 border-white/10 text-white/60">
                  <RefreshCw className="w-3.5 h-3.5" /> تحديث
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                    <Ticket className="w-12 h-12 opacity-15" />
                    <p className="text-sm">لا توجد تذاكر دعم حالياً</p>
                  </div>
                ) : tickets.map((ticket) => {
                  const isClosed = ticket.status === "closed";
                  const isReplied = ticket.status === "replied";
                  return (
                  <div key={ticket.id} className={cn("border rounded-2xl bg-white/2 overflow-hidden", isClosed ? "border-zinc-700/40 opacity-70" : "border-white/8")}>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white text-sm">{ticket.name}</p>
                            <span className="text-xs text-muted-foreground">{ticket.email}</span>
                            <Badge className={cn("text-[10px] px-2 border",
                              isClosed  ? "bg-zinc-500/15 text-zinc-400 border-zinc-500/20" :
                              isReplied ? "bg-green-500/15 text-green-400 border-green-500/20" :
                                          "bg-amber-500/15 text-amber-400 border-amber-500/20"
                            )}>
                              {isClosed ? <span className="flex items-center gap-1"><XCircle className="w-3 h-3" />مغلقة</span>
                                : isReplied ? "تم الرد" : "مفتوح"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(ticket.createdAt).toLocaleString("ar-EG")}
                          </p>
                        </div>
                        {/* Close Ticket button — always visible while not closed */}
                        {!isClosed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseTicket(ticket.id)}
                            className="shrink-0 h-8 px-3 gap-1.5 text-xs border-zinc-600/50 text-zinc-400 hover:bg-zinc-500/15 hover:text-zinc-200 hover:border-zinc-500/60 transition-all"
                            title="إغلاق التذكرة وإنهاؤها"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            إغلاق التذكرة
                          </Button>
                        )}
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed bg-white/3 rounded-xl p-3">{ticket.message}</p>
                      {ticket.imageB64 && (
                        <img src={ticket.imageB64} alt="Attachment" className="max-h-32 rounded-xl border border-white/10 object-cover" />
                      )}
                    </div>

                    {/* Previous admin reply */}
                    {ticket.reply && (
                      <div className="px-4 pb-3">
                        <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/15">
                          <p className="text-xs text-green-400 font-semibold mb-1">✓ ردك:</p>
                          <p className="text-white/70 text-sm">{ticket.reply}</p>
                        </div>
                      </div>
                    )}

                    {/* User follow-up replies */}
                    {(ticket.userReplies || []).length > 0 && (
                      <div className="px-4 pb-3 space-y-2">
                        {ticket.userReplies!.map((ur, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/4 border border-white/8">
                            <p className="text-xs text-[#c9a227]/70 font-semibold mb-1">↩ رد المستخدم:</p>
                            <p className="text-white/70 text-sm">{ur.text}</p>
                            <p className="text-[10px] text-white/25 mt-1">{new Date(ur.createdAt).toLocaleTimeString("ar-EG")}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input — hidden when ticket is closed */}
                    {!isClosed && (
                      <div className="border-t border-white/5 p-4 flex gap-2">
                        <Textarea
                          value={replyDraft[ticket.id] || ""}
                          onChange={(e) => setReplyDraft(p => ({ ...p, [ticket.id]: e.target.value }))}
                          placeholder="اكتب ردك هنا..."
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm min-h-[60px] resize-none flex-1"
                        />
                        <Button size="sm" onClick={() => handleReply(ticket.id)} disabled={!replyDraft[ticket.id]?.trim()} className="gap-1.5 shrink-0">
                          <Reply className="w-3.5 h-3.5" /> رد
                        </Button>
                      </div>
                    )}

                    {isClosed && (
                      <div className="px-4 pb-3 flex items-center gap-2 text-xs text-zinc-500">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        تذكرة مغلقة — لا يمكن الرد عليها
                      </div>
                    )}
                  </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Social Links ── */}
        {activeTab === "social" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  روابط التواصل الاجتماعي
                </CardTitle>
                <CardDescription>تحديث روابط حسابات التطبيق على منصات التواصل — تظهر في تذييل الصفحة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  { key: "discord",   label: "ديسكورد",   icon: "💬", placeholder: "https://discord.gg/..." },
                  { key: "instagram", label: "انستغرام",  icon: "📸", placeholder: "https://instagram.com/..." },
                  { key: "telegram",  label: "تيليغرام",  icon: "✈️", placeholder: "https://t.me/..." },
                  { key: "youtube",   label: "يوتيوب",    icon: "▶️", placeholder: "https://youtube.com/@..." },
                ] as const).map(({ key, label, icon, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm text-white/70 flex items-center gap-2">
                      <span>{icon}</span> {label}
                    </Label>
                    <Input
                      value={settings.social_links?.[key] || ""}
                      onChange={(e) => setSettings(p => ({
                        ...p,
                        social_links: { ...(p.social_links || { discord: "", instagram: "", telegram: "", youtube: "" }), [key]: e.target.value }
                      }))}
                      placeholder={placeholder}
                      dir="ltr"
                      className="text-left bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                ))}
                <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-blue-400 text-xs mt-2">
                  <p>💡 الروابط تظهر في تذييل التطبيق — احفظ الإعدادات ليراها المستخدمون فوراً</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Chat Moderation ── */}
        {activeTab === "chat" && (
          <div className="space-y-5">
            <Card className="bg-[#0d0d12] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    إدارة الدردشة
                  </CardTitle>
                  <CardDescription>مراقبة وإدارة الدردشة العامة — حذف رسائل، كتم مستخدمين، حظر</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadChatData} className="gap-2 border-white/10 text-white/60">
                  <RefreshCw className="w-3.5 h-3.5" /> تحديث
                </Button>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                    <p className="text-2xl font-black text-white">{chatMessages.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">رسالة</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                    <p className="text-2xl font-black text-amber-400">{mutedUsers.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">مكتوم</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                    <p className="text-2xl font-black text-red-400">{bannedUsers.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">محظور</p>
                  </div>
                </div>

                {/* Muted users */}
                {mutedUsers.length > 0 && (
                  <div className="mb-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <p className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2"><VolumeX className="w-4 h-4" /> المستخدمون المكتومون</p>
                    <div className="flex flex-wrap gap-2">
                      {mutedUsers.map(uid => (
                        <div key={uid} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <span className="text-xs text-amber-400 font-mono">{uid.slice(0, 12)}...</span>
                          <button onClick={() => toggleMute(uid)} className="text-amber-400 hover:text-white text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Banned users */}
                {bannedUsers.length > 0 && (
                  <div className="mb-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <p className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2"><Ban className="w-4 h-4" /> المستخدمون المحظورون</p>
                    <div className="flex flex-wrap gap-2">
                      {bannedUsers.map(uid => (
                        <div key={uid} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                          <span className="text-xs text-red-400 font-mono">{uid.slice(0, 12)}...</span>
                          <button onClick={() => toggleBan(uid)} className="text-red-400 hover:text-white text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-2">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">لا توجد رسائل</div>
                  )}
                  {chatMessages.map((msg: any) => {
                    const isMuted = mutedUsers.includes(msg.userId);
                    const isBanned = bannedUsers.includes(msg.userId);
                    return (
                      <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn("text-xs font-bold", msg.isAdmin ? "text-red-400" : "text-primary")}>
                              {msg.isAdmin ? "👑 " : ""}{msg.displayName}
                            </span>
                            {isMuted && <Badge className="text-[10px] bg-amber-500/15 text-amber-400">مكتوم</Badge>}
                            {isBanned && <Badge className="text-[10px] bg-red-500/15 text-red-400">محظور</Badge>}
                            <span className="text-[10px] text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString("ar-EG")}</span>
                          </div>
                          <p className="text-white/80 text-sm">{msg.text}</p>
                        </div>
                        {!msg.isAdmin && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => deleteMessage(msg.id)} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors" title="حذف">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => toggleMute(msg.userId)} className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center text-amber-400 transition-colors" title={isMuted ? "رفع الكتم" : "كتم"}>
                              {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => toggleBan(msg.userId)} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors" title={isBanned ? "رفع الحظر" : "حظر"}>
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* Floating save button — only for settings tabs */}
      {!["tickets", "chat"].includes(activeTab) && (
        <div className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-8 md:left-auto z-50 pointer-events-none">
          <div className="flex justify-center md:justify-end">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="pointer-events-auto shadow-[0_8px_30px_rgba(201,162,39,0.35)] rounded-2xl gap-2 px-8 h-14 text-base font-bold bg-gradient-to-r from-[#c9a227] to-[#e8c040] text-[#06060a] border-0 hover:shadow-[0_8px_40px_rgba(201,162,39,0.5)] transition-all"
            >
              {isSaving
                ? <><div className="w-5 h-5 rounded-full border-2 border-[#06060a]/30 border-t-[#06060a] animate-spin" /> جاري الحفظ...</>
                : <><Save className="w-5 h-5" /> حفظ التغييرات</>
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
