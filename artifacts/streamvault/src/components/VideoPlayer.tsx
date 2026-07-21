import { useState, useEffect, useRef } from "react";
import { sources } from "@/services/streamSources";
import { Loader2, RefreshCw, ChevronDown, ExternalLink, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicSettingsApi } from "@/services/adminApi";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const SANDBOX =
  "allow-same-origin allow-scripts allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation";

interface ValidatedServer { id: string; name: string; url: string | null; valid: boolean; }
interface VideoPlayerProps { tmdbId: number; type: "movie" | "tv"; season?: number; episode?: number; }

export function VideoPlayer({ tmdbId, type, season, episode }: VideoPlayerProps) {
  const { t } = useI18n();
  const [validServers, setValidServers] = useState<ValidatedServer[]>([]);
  const [validating, setValidating] = useState(true);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [customStreams, setCustomStreams] = useState<any[]>([]);
  const [showDirect, setShowDirect] = useState(false);
  const [showServerPicker, setShowServerPicker] = useState(false);

  useEffect(() => {
    publicSettingsApi
      .customStreams(String(tmdbId), type)
      .then(setCustomStreams)
      .catch(() => setCustomStreams([]));
  }, [tmdbId, type]);

  useEffect(() => {
    setValidating(true);
    setValidServers([]);
    setSelectedServerId("");

    // Admin server URL overrides are resolved server-side now — the
    // client no longer sends (or can override) which URLs get checked.
    fetch("/api/validate-servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId: String(tmdbId), type, season: season || 1, episode: episode || 1 }),
    })
      .then(r => r.json())
      .then(data => {
        const valid = (data.servers as ValidatedServer[]).filter(s => s.valid);
        const toShow = valid.length > 0 ? valid : (data.servers as ValidatedServer[]);
        setValidServers(toShow);
        if (toShow.length > 0) setSelectedServerId(toShow[0].id);
      })
      .catch(() => {
        const fallback = sources.filter(s => s.group === "A").map(s => ({
          id: s.id,
          name: s.name,
          url: s.getUrl(String(tmdbId), type, season, episode),
          valid: true,
        }));
        setValidServers(fallback);
        if (fallback.length > 0) setSelectedServerId(fallback[0].id);
      })
      .finally(() => setValidating(false));
  }, [tmdbId, type, season, episode]);

  const currentServer = validServers.find(s => s.id === selectedServerId);
  const customMatch = customStreams.find(s => `custom-${s.label}` === selectedServerId);
  const iframeUrl = customMatch ? customMatch.url : (currentServer?.url || null);

  const handleNext = () => {
    const allOptions = [
      ...validServers.map(s => s.id),
      ...customStreams.map(s => `custom-${s.label}`),
    ];
    const idx = allOptions.indexOf(selectedServerId);
    if (idx >= 0) setSelectedServerId(allOptions[(idx + 1) % allOptions.length]);
  };

  if (showDirect) {
    return (
      <div className="w-full space-y-3">
        <button
          onClick={() => setShowDirect(false)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
          data-testid="btn-back-to-embed"
        >
          ← {t("embeds")}
        </button>
        <DirectPlayerView />
      </div>
    );
  }

  return (
    <div className="w-full space-y-0">
      {/* ── Video Frame ── */}
      <div className="relative w-full aspect-video bg-black rounded-t-xl overflow-hidden border border-white/5 shadow-2xl">
        {validating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0c0e]">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Play className="absolute inset-0 m-auto w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">{t("validatingServers")}</p>
          </div>
        ) : iframeUrl ? (
          <iframe
            key={iframeUrl}
            src={iframeUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            sandbox={SANDBOX}
            data-testid="embed-iframe"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            {t("noResults")}
          </div>
        )}
      </div>

      {/* ── Simple control bar: one status line + a single "change server" toggle.
           The D1..D10 technical list only appears when the user actually asks for it. ── */}
      <div className="w-full bg-card border border-t-0 border-white/5 rounded-b-xl px-4 py-3">
        {validating ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>{t("validatingServers")}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="truncate">{t("playingNow")}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowServerPicker(v => !v)}
                data-testid="btn-toggle-server-picker"
                className="text-xs h-8 px-3 gap-1.5 border-border hover:border-primary/50 hover:text-primary"
              >
                {t("server")}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showServerPicker ? "rotate-180" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDirect(true)}
                data-testid="btn-direct-url"
                className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                title={t("directURL")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Server picker — collapsed by default, revealed on demand */}
        {!validating && showServerPicker && (
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2" dir="ltr">
            {validServers.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedServerId(s.id)}
                data-testid={`server-chip-${s.id}`}
                className={`h-8 min-w-[2.75rem] px-3 rounded-lg text-xs font-bold transition-colors border ${
                  selectedServerId === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                D{i + 1}
              </button>
            ))}
            {customStreams.map((s, i) => {
              const id = `custom-${s.label}`;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedServerId(id)}
                  data-testid={`server-chip-${id}`}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors border ${
                    selectedServerId === id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  ⭐ D{validServers.length + i + 1}
                </button>
              );
            })}
            <button
              onClick={handleNext}
              data-testid="btn-next-server"
              title={t("nextServer")}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground border border-border hover:border-primary/50 hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DirectPlayerView() {
  const [url, setUrl] = useState("");
  const [playing, setPlaying] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current || !playing) return;
    playerRef.current = videojs(videoRef.current, {
      controls: true, fluid: true, responsive: true,
      sources: [{ src: playing, type: playing.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4" }],
    });
    return () => { playerRef.current?.dispose(); };
  }, [playing]);

  if (!playing) return (
    <div className="w-full aspect-video bg-[#0f0f10] rounded-xl flex flex-col items-center justify-center gap-4 border border-border p-6">
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Paste a direct video URL (DoodStream, Streamtape, Filemoon, Uqload, Mixdrop, VK, .m3u8)
      </p>
      <div className="flex gap-2 w-full max-w-lg">
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className="bg-muted border-border text-sm"
          data-testid="direct-url-input"
        />
        <Button onClick={() => setPlaying(url)} disabled={!url} data-testid="btn-play-direct">
          Play
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered w-full h-full" />
      </div>
    </div>
  );
}
