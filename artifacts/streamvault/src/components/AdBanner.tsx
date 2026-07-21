import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { publicSettingsApi } from "@/services/adminApi";

/** Overlay ad — kept as no-op so existing imports don't break */
export function AdBanner() {
  return null;
}

/** Inline banner shown between content rows */
export function InlineAdBanner() {
  const [adImage, setAdImage] = useState<string>("");
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    publicSettingsApi.get().then(s => {
      setAdsEnabled(s.ads_enabled);
      setAdImage(s.ad_image || "");
    }).catch(() => {});
  }, []);

  if (!adsEnabled || !adImage || dismissed) return null;

  return (
    <div className="mx-4 md:mx-8 my-2">
      <div className="relative rounded-2xl overflow-hidden max-h-20 w-full">
        <img
          src={adImage}
          alt="Advertisement"
          className="w-full h-full object-cover max-h-20"
          onError={() => setDismissed(true)}
        />
        {/* Close button — pure client-side state, zero network calls */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDismissed(true);
          }}
          aria-label="إغلاق الإعلان"
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/90 transition-colors z-10 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm pointer-events-none">
          <span className="text-[9px] text-white/60 font-medium tracking-wider">AD</span>
        </div>
      </div>
    </div>
  );
}
