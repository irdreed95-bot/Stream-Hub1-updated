import { useState, useEffect } from "react";
import { parseM3U, M3UChannel } from "@/services/m3uParser";
import { LivePlayer } from "@/components/LivePlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Tv, WifiOff, RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const PLAYLIST_URL = "http://kazimmt.ami.bd/playlist/wc.m3u";
// Try API server proxy first (most reliable since server-side has no CORS)
const apiProxy = `/api/m3u-proxy?url=${encodeURIComponent(PLAYLIST_URL)}`;
// Fallback to public proxies
const BROWSER_PROXIES = [
  `https://corsproxy.io/?url=${encodeURIComponent(PLAYLIST_URL)}`,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(PLAYLIST_URL)}`,
];

async function fetchWithFallback(): Promise<string> {
  // Try proxy first
  try {
    const r = await fetch(apiProxy, { signal: AbortSignal.timeout(5000) });
    if (r.ok) return r.text();
  } catch {}
  // Try proxies
  for (const proxy of BROWSER_PROXIES) {
    try {
      const r = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
      if (r.ok) return r.text();
    } catch {}
  }
  throw new Error("All sources failed");
}

export default function LiveTV() {
  const { t } = useI18n();
  const [channels, setChannels] = useState<M3UChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<M3UChannel | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  const fetchPlaylist = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchWithFallback();
      const parsed = parseM3U(data);
      setChannels(parsed);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load Live TV playlist. The source might be offline or blocking access.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, []);

  const groups = ["All", ...Array.from(new Set(channels.map(c => c.group).filter(Boolean)))].sort();

  const filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === "All" || c.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-20 md:pb-8 flex flex-col gap-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Tv className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{t("liveTV")}</h1>
              {!isLoading && !error && (
                <p className="text-xs text-muted-foreground">
                  {channels.length} {t("liveTV")}
                </p>
              )}
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ps-9 bg-card border-border h-10 rounded-full"
              data-testid="input-search-live"
            />
          </div>
        </div>

        {groups.length > 1 && !error && !isLoading && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                data-testid={`chip-group-${g}`}
                className={cn(
                  "shrink-0 px-4 h-8 rounded-full text-xs font-semibold border transition-colors",
                  selectedGroup === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1">
        {/* Selected Player Area */}
        {selectedChannel && (
          <div className="w-full max-w-4xl mx-auto mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-semibold">{selectedChannel.name}</span>
                {selectedChannel.group && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    {selectedChannel.group}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setSelectedChannel(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                data-testid="btn-close-player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-black border border-border shadow-2xl">
              <LivePlayer url={selectedChannel.url} channelName={selectedChannel.name} />
            </div>
          </div>
        )}

        {/* Grid Area */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Playlist Unavailable</h3>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            </div>
            <Button onClick={fetchPlaylist} variant="outline" className="gap-2" data-testid="btn-retry-live">
              <RefreshCcw className="w-4 h-4" /> Retry
            </Button>
          </div>
        ) : filteredChannels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredChannels.map((channel, i) => (
              <button
                key={`${channel.url}-${i}`}
                onClick={() => {
                  setSelectedChannel(channel);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                data-testid={`channel-card-${i}`}
                className={cn(
                  "group relative aspect-[4/3] rounded-xl overflow-hidden bg-card border flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
                  selectedChannel?.url === channel.url 
                    ? "border-primary ring-1 ring-primary" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex-1 w-full bg-muted/30 p-4 flex items-center justify-center relative">
                  {channel.logo ? (
                    <img src={channel.logo} alt={channel.name} className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <Tv className="w-10 h-10 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {selectedChannel?.url === channel.url && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </div>
                <div className="w-full p-3 bg-card border-t border-border shrink-0">
                  <div className="font-semibold text-xs text-foreground truncate text-left">{channel.name}</div>
                  {channel.group && (
                    <div className="text-[10px] text-muted-foreground truncate text-left mt-0.5">{channel.group}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No channels found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}