import { Link } from "wouter";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import {
  Download, Settings, HelpCircle, ChevronRight, LogIn, UserPlus,
  Check, Bell, Star, MessageCircle, Bot, Ticket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { t, lang, setLang, isRtl } = useI18n();

  const menuItems = [
    { href: "/downloads", icon: Download,       label: t("downloads"),      color: "text-blue-400",   bg: "bg-blue-500/10" },
    { href: "/tickets",   icon: Ticket,         label: "الدعم والتواصل",    color: "text-green-400",  bg: "bg-green-500/10" },
    { href: "/chat",      icon: MessageCircle,  label: "الدردشة العامة",    color: "text-purple-400", bg: "bg-purple-500/10" },
    { href: "/ai",        icon: Bot,            label: "سراد AI",           color: "text-cyan-400",   bg: "bg-cyan-500/10" },
    { href: "/settings",  icon: Settings,       label: t("settings"),       color: "text-zinc-400",   bg: "bg-zinc-500/10" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#06060a] p-5 md:p-10 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d12] p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c9a227]/8 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#c9a227]/5 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-[#f0d060] via-[#c9a227] to-[#8b6914]" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#c9a227]/30 to-[#c9a227]/10 flex items-center justify-center border border-[#c9a227]/20">
                <span className="text-3xl font-black text-[#c9a227]">G</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">Guest User</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#c9a227]/15 border border-[#c9a227]/25 text-[#c9a227] text-[10px] font-bold tracking-wider">
                  FREE
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">guest@sarad.app</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#c9a227]" /> 0 Favorites</span>
                <span className="flex items-center gap-1"><Bell className="w-3 h-3" /> 0 Alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-white/10 bg-white/3 text-white/70 hover:bg-white/8 hover:text-white gap-2 font-semibold"
            >
              <LogIn className="w-4 h-4" />
              {t("signIn")}
            </Button>
          </Link>
          <Link href="/login">
            <Button
              className="w-full h-12 rounded-2xl gap-2 font-bold bg-gradient-to-r from-[#c9a227] to-[#e8c040] text-[#06060a] hover:shadow-[0_4px_20px_rgba(201,162,39,0.35)] transition-all border-0"
            >
              <UserPlus className="w-4 h-4" />
              {t("createAccount")}
            </Button>
          </Link>
        </div>

        {/* Menu */}
        <div className="bg-[#0d0d12] rounded-2xl border border-white/5 overflow-hidden">
          {menuItems.map(({ href, icon: Icon, label, color, bg }, i) => (
            <Link key={href + i} href={href}>
              <div className={`flex items-center justify-between p-4 hover:bg-white/3 transition-colors group ${i > 0 ? "border-t border-white/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                  </div>
                  <span className="font-medium text-white/80 text-sm group-hover:text-white transition-colors">{label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors", isRtl && "rotate-180")} />
              </div>
            </Link>
          ))}
        </div>

        {/* Language switcher */}
        <div className="bg-[#0d0d12] rounded-2xl border border-white/5 p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">{t("interfaceLanguage")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.slice(0, 6).map((language) => (
              <button
                key={language.code}
                onClick={() => setLang(language.code)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-medium",
                  lang === language.code
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-white/3 border-white/8 text-white/50 hover:bg-white/8 hover:text-white/70"
                )}
              >
                <span>{language.flag}</span>
                <span className="truncate">{language.nativeLabel}</span>
                {lang === language.code && <Check className="w-3 h-3 ms-auto flex-shrink-0" />}
              </button>
            ))}
          </div>
          <Link href="/settings" className="block text-center text-xs text-[#c9a227]/60 hover:text-[#c9a227] transition-colors">
            {LANGUAGES.length - 6} more languages in Settings →
          </Link>
        </div>

      </div>
    </div>
  );
}
