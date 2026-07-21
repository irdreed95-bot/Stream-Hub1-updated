import { Link, useLocation } from "wouter";
import { Home, Film, Monitor, Radio, Search, Settings, UserCircle, LayoutGrid, Tv2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function Sidebar() {
  const [location] = useLocation();
  const { t, isRtl } = useI18n();

  const mainNav = [
    { href: "/",                   labelKey: "home"       as const, icon: Home },
    { href: "/search?type=movie",  labelKey: "movies"     as const, icon: Film },
    { href: "/search?type=tv",     labelKey: "series"     as const, icon: Monitor },
    { href: "/live",               labelKey: "liveTV"     as const, icon: Radio },
    { href: "/tv",                 labelKey: "tv"         as const, icon: Tv2 },
    { href: "/categories",         labelKey: "categories" as const, icon: LayoutGrid },
    { href: "/search",             labelKey: "search"     as const, icon: Search },
  ];

  const bottomNav = [
    { href: "/settings", labelKey: "settings" as const, icon: Settings },
    { href: "/profile",  labelKey: "profile"  as const, icon: UserCircle },
  ];

  const mobileNav = [
    { href: "/",        labelKey: "home"    as const, icon: Home },
    { href: "/live",    labelKey: "liveTV"  as const, icon: Radio },
    { href: "/tv",      labelKey: "tv"      as const, icon: Tv2 },
    { href: "/search",  labelKey: "search"  as const, icon: Search },
    { href: "/profile", labelKey: "profile" as const, icon: UserCircle },
  ];

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/") return location === "/";
    return location.startsWith(base);
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className={cn(
        "hidden md:flex flex-col w-60 h-screen sticky top-0 z-40 shrink-0",
        "bg-[#08080c] border-e border-white/5"
      )}>
        {/* Logo */}
        <Link href="/">
          <div className="p-5 flex items-center gap-3 group cursor-pointer">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(201,162,39,0.3)] flex-shrink-0">
              {/* Gold border */}
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-[#f0d060] via-[#c9a227] to-[#8b6914]" />
              <img
                src="/sorad-logo.png"
                alt="SORAD"
                className="relative w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div className="leading-none">
              <span className="block text-base font-black text-white tracking-tight">
                سراد
              </span>
              <span className="block text-[11px] font-semibold text-[#c9a227]/70 tracking-widest uppercase">
                SORAD
              </span>
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-2" />

        {/* Main nav */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {mainNav.map(({ href, labelKey, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} data-testid={`nav-${labelKey}`}>
                <div className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-[#c9a227]/15 text-[#c9a227] shadow-[inset_0_0_0_1px_rgba(201,162,39,0.2)]"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}>
                  <Icon className={cn(
                    "w-4.5 h-4.5 shrink-0 transition-colors",
                    active ? "text-[#c9a227]" : "text-white/40 group-hover:text-white/60"
                  )} />
                  <span>{t(labelKey)}</span>
                  {active && (
                    <div className={cn(
                      "ms-auto w-1.5 h-1.5 rounded-full bg-[#c9a227]",
                      "shadow-[0_0_8px_rgba(201,162,39,0.8)]"
                    )} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* Bottom nav */}
        <div className="px-3 py-3 space-y-0.5">
          {bottomNav.map(({ href, labelKey, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} data-testid={`nav-${labelKey}`}>
                <div className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-[#c9a227]/15 text-[#c9a227]"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                )}>
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{t(labelKey)}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* App version badge */}
        <div className="px-5 pb-5 pt-1">
          <div className="px-3 py-2 rounded-xl bg-white/3 border border-white/5 text-center">
            <p className="text-[10px] text-white/20 tracking-wider font-medium">SORAD v2.0</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 z-50"
        style={{ background: "linear-gradient(to top, #08080c, #08080cf0)" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a227]/20 to-transparent" />
        <div className="flex items-center h-full px-1">
          {mobileNav.map(({ href, labelKey, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} data-testid={`mob-nav-${labelKey}`}>
                <div className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 h-16 px-4 transition-all duration-200",
                  active ? "text-[#c9a227]" : "text-white/35"
                )}>
                  <div className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all",
                    active && "bg-[#c9a227]/15"
                  )}>
                    <Icon className="w-5 h-5" />
                    {active && (
                      <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#c9a227] shadow-[0_0_6px_rgba(201,162,39,0.8)]" />
                    )}
                  </div>
                  <span className="text-[9px] font-semibold leading-none tracking-wide">{t(labelKey)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
