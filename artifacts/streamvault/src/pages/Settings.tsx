import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon, Globe, PlayCircle, HardDrive, Download,
  Info, Search as SearchIcon, ChevronDown, Check, Smartphone, ExternalLink
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useI18n, LANGUAGES, Lang } from "@/lib/i18n";
import { useLocation } from "wouter";
import { publicSettingsApi } from "@/services/adminApi";
import { cn } from "@/lib/utils";

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 text-foreground font-bold text-base border-b border-white/5 pb-3">
      <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span>{title}</span>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const { t, lang, setLang, isRtl } = useI18n();
  const [, setLocation] = useLocation();
  const [secretSearch, setSecretSearch] = useState("");
  const [apkLink, setApkLink] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    publicSettingsApi.get().then((s) => {
      setApkLink(s.apk_link || "");
      setAppVersion(s.app_version || "");
    }).catch(() => {});
  }, []);

  const handleClearCache = () => {
    toast({ title: "✓ " + t("clearCache"), description: t("cacheCleared") });
  };

  const handleSecretSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && secretSearch.toLowerCase() === "devportal") {
      setLocation("/admin");
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="w-full min-h-screen bg-[#06060a] p-5 md:p-10 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className={`flex items-center justify-between flex-wrap gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{t("settings")}</h1>
              <p className="text-xs text-muted-foreground">Personalize your experience</p>
            </div>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search settings..."
              className="pl-9 h-9 w-44 text-sm bg-white/5 border-white/10 rounded-xl"
              value={secretSearch}
              onChange={(e) => setSecretSearch(e.target.value)}
              onKeyDown={handleSecretSearch}
            />
          </div>
        </div>

        {/* ── APK Download Box (Task 10) — always visible ── */}
        <section className="space-y-0">
          <div className="relative overflow-hidden rounded-3xl border border-[#c9a227]/25 bg-gradient-to-br from-[#c9a227]/10 to-[#c9a227]/3 p-5">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#c9a227]/8 blur-3xl pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#c9a227]/20 border border-[#c9a227]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone className="w-6 h-6 text-[#c9a227]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-white text-base">تحميل تطبيق سراد</h3>
                  {appVersion && (
                    <span className="px-2 py-0.5 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/30 text-[#c9a227] text-[10px] font-bold">
                      v{appVersion}
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-xs mt-1">
                  {apkLink
                    ? "آخر إصدار من التطبيق متاح للتحميل"
                    : "لا يوجد إصدار جديد متاح حالياً — تحقق مرة أخرى لاحقاً"
                  }
                </p>
                {apkLink && (
                  <a
                    href={apkLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="btn-download-apk"
                    className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#c9a227] to-[#e8c040] text-[#06060a] font-bold text-sm hover:shadow-[0_4px_20px_rgba(201,162,39,0.4)] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {t("downloadApk")}
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 1. Language & Region */}
        <section className="space-y-4">
          <SectionHeader icon={Globe} title={`${t("language")} & ${t("region")}`} />

          <div className="bg-[#0d0d12] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{t("interfaceLanguage")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("selectLanguage")}</p>
              </div>
              {/* Quick buttons for top 4 */}
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.slice(0, 4).map((language) => (
                  <button
                    key={language.code}
                    onClick={() => setLang(language.code)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium",
                      lang === language.code
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-white/3 border-white/8 text-white/60 hover:bg-white/8 hover:text-white/80"
                    )}
                  >
                    <span className="text-base">{language.flag}</span>
                    <span>{language.nativeLabel}</span>
                    {lang === language.code && <Check className="w-3.5 h-3.5 ms-auto" />}
                  </button>
                ))}
              </div>
              {/* More languages dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/8 text-sm text-white/50 hover:text-white/70 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>{currentLang?.flag}</span>
                    <span>{currentLang?.nativeLabel || "More languages..."}</span>
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", langDropdownOpen && "rotate-180")} />
                </button>
                {langDropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {LANGUAGES.slice(4).map((language) => (
                      <button
                        key={language.code}
                        onClick={() => { setLang(language.code); setLangDropdownOpen(false); }}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors hover:bg-white/5",
                          lang === language.code ? "text-primary" : "text-white/60"
                        )}
                      >
                        <span className="text-base">{language.flag}</span>
                        <span className="font-medium">{language.nativeLabel}</span>
                        <span className="text-white/30 ms-auto">{language.label}</span>
                        {lang === language.code && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{t("rtlMode")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Right-to-Left layout</p>
                </div>
                <Switch
                  checked={isRtl}
                  onCheckedChange={(v) => { setLang(v ? "ar" : "en"); }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Playback */}
        <section className="space-y-4">
          <SectionHeader icon={PlayCircle} title="Playback" />
          <div className="bg-[#0d0d12] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{t("defaultServer")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Preferred streaming server</p>
              </div>
              <Select defaultValue="vidsrc">
                <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vidsrc">VidSrc To</SelectItem>
                  <SelectItem value="vidsrcme">VidSrc Me</SelectItem>
                  <SelectItem value="embedsu">Embed Su</SelectItem>
                  <SelectItem value="2embed">2Embed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{t("autoPlay")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically play next episode</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{t("hdQuality")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Always select highest quality</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        {/* 3. Storage */}
        <section className="space-y-4">
          <SectionHeader icon={HardDrive} title="Storage & Cache" />
          <div className="bg-[#0d0d12] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Cache Size</h3>
                <p className="text-xs text-muted-foreground mt-0.5">247 MB — Temporary files</p>
              </div>
              <Button
                variant="outline" size="sm" onClick={handleClearCache}
                className="rounded-xl border-white/10 bg-white/3 hover:bg-white/8 text-white/70 text-xs h-8"
              >
                {t("clearCache")}
              </Button>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Watch History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Your viewing activity</p>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => toast({ title: "History cleared" })}
                className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8"
              >
                Clear
              </Button>
            </div>
          </div>
        </section>

        {/* 4. About */}
        <section className="space-y-4">
          <SectionHeader icon={Info} title={t("about")} />
          <div className="bg-[#0d0d12] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-[2px] rounded-[14px] bg-gradient-to-br from-[#f0d060] via-[#c9a227] to-[#8b6914]" />
                <img src="/sorad-logo.png" alt="SORAD" className="relative w-14 h-14 rounded-[12px] object-cover" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">SORAD · سراد</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{t("version")} {appVersion || "2.0.0"}</p>
                <p className="text-[#c9a227]/60 text-[11px] mt-1 tracking-wide">صُنع بأيدي عربية</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-white/5 flex flex-wrap gap-4">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Powered by</p>
                <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">TMDB</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Streams by</p>
                <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">10+ Sources</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Languages</p>
                <p className="text-sm font-bold text-white">9</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
