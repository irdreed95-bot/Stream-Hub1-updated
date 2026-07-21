import { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { publicSettingsApi } from "@/services/adminApi";

export function UpdateBanner() {
  const [info, setInfo] = useState<{ apk_link: string; app_version: string; update_notes: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedVersion = sessionStorage.getItem("sorad_update_dismissed");
    publicSettingsApi.get().then((s) => {
      if (s.apk_link && !dismissed) {
        const version = s.app_version || "";
        if (dismissedVersion === version) return; // already dismissed this version
        setInfo({ apk_link: s.apk_link, app_version: version, update_notes: s.update_notes || "" });
      }
    }).catch(() => {});
  }, []);

  if (!info || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (info.app_version) {
      sessionStorage.setItem("sorad_update_dismissed", info.app_version);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#0e0a02] via-[#1a1200] to-[#0e0a02] border-b border-[#c9a227]/30">
      {/* Animated shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a227]/5 to-transparent animate-pulse" />

      <div className="relative flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c9a227]/15 border border-[#c9a227]/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#c9a227]" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#c9a227]">
              {info.app_version ? `v${info.app_version} Available` : "New Update Available"}
            </span>
            {info.update_notes && (
              <span className="text-xs text-[#c9a227]/60 hidden sm:inline truncate max-w-xs">
                — {info.update_notes}
              </span>
            )}
          </div>
        </div>

        <a
          href={info.apk_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#c9a227] text-[#06060a] text-xs font-bold hover:bg-[#e0b835] transition-colors shadow-[0_2px_12px_rgba(201,162,39,0.4)]"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-full text-[#c9a227]/50 hover:text-[#c9a227] hover:bg-[#c9a227]/10 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
