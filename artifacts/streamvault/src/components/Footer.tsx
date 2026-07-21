import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { publicSettingsApi, SocialLinks } from "@/services/adminApi";

const SOCIAL_DEFAULTS = {
  discord:   "https://discord.gg/sarad",
  instagram: "https://instagram.com/sarad.app",
  telegram:  "https://t.me/sarad_app",
  youtube:   "",
};

const SOCIAL_META: Record<string, { label: string; hoverColor: string }> = {
  discord:   { label: "Discord",   hoverColor: "hover:text-indigo-400" },
  instagram: { label: "Instagram", hoverColor: "hover:text-pink-400" },
  telegram:  { label: "Telegram",  hoverColor: "hover:text-sky-400" },
  youtube:   { label: "YouTube",   hoverColor: "hover:text-red-400" },
};

export function Footer() {
  const [links, setLinks] = useState<SocialLinks>(SOCIAL_DEFAULTS as SocialLinks);

  useEffect(() => {
    publicSettingsApi.socialLinks().then((sl) => {
      // merge with defaults — only override if admin set a non-empty value
      setLinks({
        discord:   sl.discord   || SOCIAL_DEFAULTS.discord,
        instagram: sl.instagram || SOCIAL_DEFAULTS.instagram,
        telegram:  sl.telegram  || SOCIAL_DEFAULTS.telegram,
        youtube:   sl.youtube   || SOCIAL_DEFAULTS.youtube,
      });
    }).catch(() => {});
  }, []);

  const visibleLinks = (Object.keys(SOCIAL_META) as (keyof SocialLinks)[]).filter(k => links[k]);

  return (
    <footer className="mt-auto border-t border-white/5 py-5 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src="/sorad-logo.png" alt="SORAD" className="w-6 h-6 rounded-lg object-cover opacity-70" />
          <div className="text-xs text-muted-foreground/60">
            © 2025{" "}
            <span className="text-[#c9a227]/70 font-bold tracking-wide">سراد SORAD</span>
            {" "}— صُنع بأيدي عربية
          </div>
        </div>

        {/* Social links */}
        {visibleLinks.length > 0 && (
          <div className="flex items-center gap-5">
            {visibleLinks.map((key) => (
              <a
                key={key}
                href={links[key]}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`social-${key}`}
                className={`flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors duration-200 ${SOCIAL_META[key].hoverColor}`}
              >
                {SOCIAL_META[key].label}
                <ExternalLink className="w-2.5 h-2.5 opacity-40" />
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
