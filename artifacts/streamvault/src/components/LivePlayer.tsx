import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { WifiOff, Volume2, VolumeX } from "lucide-react";

interface LivePlayerProps {
  url: string;
  channelName?: string;
}

function isHlsUrl(url: string) {
  return /\.m3u8/i.test(url) || /m3u/i.test(url);
}

/**
 * LivePlayer — robust HLS + Live stream player.
 *
 * Strategy:
 *  1. On iOS/Safari: use native <video> HLS (Safari handles .m3u8 natively).
 *  2. On all other browsers: use hls.js which is more reliable for live streams
 *     and gives us network error recovery / stream-controller restart.
 *  3. CORS-proxy fallback: if the direct URL fails to load after 6s, retry via
 *     corsproxy.io, then allorigins.win.
 */
export function LivePlayer({ url, channelName }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const [error, setError]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted]   = useState(true); // start muted for autoplay policy
  const [proxyIdx, setProxyIdx] = useState(0);

  const PROXIES = [
    "",                                          // 0 = direct
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,   // 1
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, // 2
  ];

  function srcFor(idx: number) {
    return idx === 0 ? url : PROXIES[idx];
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let destroyed = false;
    setError(false);
    setLoading(true);
    setProxyIdx(0);

    function cleanup() {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    }

    function tryLoad(proxyIndex: number) {
      if (destroyed || !video) return;
      cleanup();
      const src = proxyIndex === 0 ? url : (proxyIndex === 1
        ? `https://corsproxy.io/?url=${encodeURIComponent(url)}`
        : `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);

      const useNative = !isHlsUrl(url) || (video!.canPlayType("application/vnd.apple.mpegurl") !== "");

      if (useNative) {
        // Native HLS (Safari / iOS)
        video!.src = src;
        video!.load();
        video!.muted = true;
        video!.play().catch(() => {});
        return;
      }

      // hls.js path
      if (!Hls.isSupported()) {
        // Should not happen on modern browsers — show error
        setError(true);
        setLoading(false);
        return;
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 20,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video!);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (destroyed) return;
        setLoading(false);
        video.muted = muted;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (destroyed) return;
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && proxyIndex < 2) {
            // Try next proxy
            setTimeout(() => tryLoad(proxyIndex + 1), 500);
          } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad(); // retry once before giving up
            setTimeout(() => {
              if (destroyed) return;
              setError(true);
              setLoading(false);
            }, 5000);
          } else {
            hls.destroy();
            setError(true);
            setLoading(false);
          }
        }
      });
    }

    // Video element events
    const onWaiting  = () => { if (!destroyed) setLoading(true); };
    const onPlaying  = () => { if (!destroyed) { setLoading(false); setError(false); } };
    const onCanPlay  = () => { if (!destroyed) setLoading(false); };
    const onError    = () => {
      if (destroyed) return;
      if (proxyIdx < 2) {
        const next = proxyIdx + 1;
        setProxyIdx(next);
        tryLoad(next);
      } else {
        setError(true);
        setLoading(false);
      }
    };

    video.addEventListener("waiting",  onWaiting);
    video.addEventListener("playing",  onPlaying);
    video.addEventListener("canplay",  onCanPlay);
    video.addEventListener("error",    onError);

    tryLoad(0);

    return () => {
      destroyed = true;
      cleanup();
      if (video) {
        video.removeEventListener("waiting",  onWaiting);
        video.removeEventListener("playing",  onPlaying);
        video.removeEventListener("canplay",  onCanPlay);
        video.removeEventListener("error",    onError);
        video.src = "";
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setProxyIdx(0);
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
        controls={false}
      />

      {/* Controls overlay (bottom-right) */}
      {!error && !loading && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            onClick={() => setMuted(m => !m)}
            className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors border border-white/10"
            title={muted ? "تفعيل الصوت" : "كتم الصوت"}
          >
            {muted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="text-[10px] text-red-400 font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-red-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        </div>
      )}

      {/* Muted notice */}
      {muted && !error && !loading && (
        <button
          onClick={() => setMuted(false)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/15 hover:bg-black/80 transition-colors"
        >
          <VolumeX className="w-4 h-4 text-amber-400" />
          انقر لتفعيل الصوت
        </button>
      )}

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-[#c9a227]/30 border-t-[#c9a227] animate-spin" />
          <p className="text-xs text-white/60">
            {channelName ? `جارٍ تحميل ${channelName}…` : "جارٍ تحميل القناة…"}
          </p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f0f10] p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
            <WifiOff className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center space-y-1 max-w-xs">
            <h3 className="text-sm font-bold text-white">القناة غير متاحة</h3>
            <p className="text-xs text-white/40">
              {channelName ? `${channelName} — ` : ""}البث متوقف مؤقتاً أو المصدر محجوب
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="px-5 py-2 rounded-xl bg-[#c9a227] text-black text-xs font-bold hover:bg-[#e8c547] transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}
