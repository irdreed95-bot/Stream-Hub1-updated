import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    // Phase 1: logo fades in (0-700ms)
    const t1 = setTimeout(() => setPhase("hold"), 700);
    // Phase 2: hold (700-2400ms)
    const t2 = setTimeout(() => setPhase("exit"), 2400);
    // Phase 3: fade out (2400-3100ms), then unmount
    const t3 = setTimeout(onComplete, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#06060a] transition-opacity duration-700 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Radial background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#c9a227]/6 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#c9a227]/10 blur-[60px]" />
      </div>

      {/* Starfield dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.4 + 0.1,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + "s",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className={`relative flex flex-col items-center gap-6 transition-all duration-700 ${
          phase === "enter" ? "opacity-0 scale-90 translate-y-4" : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {/* Logo */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-[28px] shadow-[0_0_60px_rgba(201,162,39,0.4),0_0_120px_rgba(201,162,39,0.15)]" />
          {/* Gold border ring */}
          <div className="absolute -inset-[3px] rounded-[30px] bg-gradient-to-br from-[#f0d060] via-[#c9a227] to-[#8b6914] opacity-80" />
          <img
            src="/sorad-logo.png"
            alt="SORAD"
            className="relative w-28 h-28 rounded-[26px] object-cover"
          />
        </div>

        {/* App name */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative overflow-hidden">
            <span className="block text-5xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-[#f5e070] via-[#c9a227] to-[#8b6914] drop-shadow-[0_2px_10px_rgba(201,162,39,0.5)]">
              SORAD
            </span>
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          <p className="text-[#c9a227]/70 text-sm font-medium tracking-[0.2em] uppercase">
            سُراد
          </p>
          <p className="text-[#c9a227]/40 text-xs tracking-widest mt-0.5">
            صُنع بأيدي عربية
          </p>
        </div>

        {/* Loading ring */}
        <div className="relative mt-2">
          <div className="w-10 h-10 rounded-full border-2 border-[#c9a227]/20" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-[#c9a227] animate-spin" />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
