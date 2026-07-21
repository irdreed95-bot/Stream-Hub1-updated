import { useState, useEffect } from "react";
import { LivePlayer } from "@/components/LivePlayer";
import { useI18n } from "@/lib/i18n";
import { Tv2, Radio, Sparkles } from "lucide-react";
import { publicSettingsApi } from "@/services/adminApi";

interface TvChannel { name: string; logo: string; url: string; }

export default function TV() {
  const { t } = useI18n();
  const [channels, setChannels] = useState<TvChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TvChannel | null>(null);

  useEffect(() => {
    publicSettingsApi
      .get()
      .then((s) => setChannels(s.tv_channels))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 text-foreground">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Tv2 className="w-5 h-5 text-primary" />
            </div>
            {t("tvChannels")}
          </h1>
          {channels.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full">
              {channels.length} {t("tvChannels")}
            </span>
          )}
        </div>

        {selected && (
          <div className="w-full max-w-3xl mx-auto space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                {selected.name}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="btn-close-tv"
              >
                {t("close") || "Close"}
              </button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-black border border-border shadow-2xl">
              <LivePlayer url={selected.url} channelName={selected.name} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center rounded-2xl border border-dashed border-border bg-card/30">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Radio className="w-8 h-8 text-primary" />
              </div>
              <Sparkles className="w-4 h-4 text-primary absolute -top-1 -end-1" />
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">{t("noChannels")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t("noChannelsHint")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {channels.map((ch, i) => (
              <button
                key={i}
                data-testid={`tv-ch-${i}`}
                onClick={() => setSelected(ch)}
                className={`group relative aspect-video rounded-xl overflow-hidden bg-card border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/60 ${
                  selected?.url === ch.url ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                {ch.logo ? (
                  <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Tv2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5">
                  <p className="text-[11px] font-semibold text-white truncate">{ch.name}</p>
                </div>
                {selected?.url === ch.url && (
                  <div className="absolute top-2 end-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
