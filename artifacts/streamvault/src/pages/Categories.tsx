import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Sword, Laugh, Film, Ghost, Rocket, Users, Tv2, Heart, ShieldAlert, FileVideo, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { publicSettingsApi } from "@/services/adminApi";

const GENRES = [
  { id: 28,    key: "action"      as const, icon: Sword,      gradient: "from-red-950 to-red-800",       accent: "#ef4444" },
  { id: 35,    key: "comedy"      as const, icon: Laugh,      gradient: "from-amber-950 to-amber-800",    accent: "#f59e0b" },
  { id: 18,    key: "drama"       as const, icon: Film,       gradient: "from-blue-950 to-blue-800",      accent: "#3b82f6" },
  { id: 27,    key: "horror"      as const, icon: Ghost,      gradient: "from-purple-950 to-purple-800",  accent: "#a855f7" },
  { id: 878,   key: "sciFi"       as const, icon: Rocket,     gradient: "from-cyan-950 to-cyan-800",      accent: "#06b6d4" },
  { id: 10751, key: "family"      as const, icon: Users,      gradient: "from-green-950 to-green-800",    accent: "#22c55e" },
  { id: 16,    key: "anime"       as const, icon: Tv2,        gradient: "from-pink-950 to-pink-800",      accent: "#ec4899" },
  { id: 10749, key: "romance"     as const, icon: Heart,      gradient: "from-rose-950 to-rose-800",      accent: "#f43f5e" },
  { id: 80,    key: "crime"       as const, icon: ShieldAlert, gradient: "from-zinc-950 to-zinc-700",     accent: "#71717a" },
  { id: 99,    key: "documentary" as const, icon: FileVideo,  gradient: "from-teal-950 to-teal-800",      accent: "#14b8a6" },
  { id: 10752, key: "drama"       as const, icon: Globe,      gradient: "from-indigo-950 to-indigo-800",  accent: "#6366f1" },
  { id: 14,    key: "fantasy"     as const, icon: Rocket,     gradient: "from-violet-950 to-violet-800",  accent: "#8b5cf6" },
] as const;

// Task 1 fix: give each genre a unique label key where "fantasy" is missing from i18n,
// use "sciFi" as closest match. Duplicate "drama" keys are now: drama (id=18) and a war genre (id=10752).

export default function Categories() {
  const { t, isRtl } = useI18n();
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    publicSettingsApi.get().then((s) => setCategoryImages(s.category_images)).catch(() => {});
  }, []);

  // Task 1 fix: map genre.key to t() — use fallback for keys not in dict
  const getLabel = (key: string): string => {
    const safeKeys = ["action","comedy","drama","horror","sciFi","family","anime",
      "romance","crime","documentary"];
    if (safeKeys.includes(key)) return t(key as any);
    if (key === "fantasy") return "Fantasy";
    return t("drama");
  };

  return (
    <div className="w-full min-h-screen bg-[#06060a] p-5 md:p-10 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className={`flex items-end gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {t("categories")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {GENRES.length} categories · Browse by genre
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {GENRES.map((genre) => {
            const Icon = genre.icon;
            const customImg = categoryImages[String(genre.id)];
            const isHovered = hoveredId === genre.id;

            return (
              <Link
                key={genre.id}
                href={`/search?type=movie&genre=${genre.id}`}
                data-testid={`category-${genre.key}`}
              >
                <div
                  className={cn(
                    "relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group",
                    "border border-white/5 hover:border-white/15 transition-all duration-300",
                    "hover:scale-[1.03] hover:shadow-xl",
                    !customImg && `bg-gradient-to-br ${genre.gradient}`,
                  )}
                  style={customImg ? {
                    backgroundImage: `url(${customImg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  } : undefined}
                  onMouseEnter={() => setHoveredId(genre.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Overlay */}
                  <div className={cn(
                    "absolute inset-0 transition-all duration-300",
                    customImg
                      ? "bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/60"
                      : "bg-black/20 group-hover:bg-black/0"
                  )} />

                  {/* Bottom label */}
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-end gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${genre.accent}25`, border: `1px solid ${genre.accent}40` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: genre.accent }} />
                    </div>
                    <div>
                      <span className="block text-base font-bold text-white drop-shadow-md leading-tight">
                        {getLabel(genre.key)}
                      </span>
                      <span className="text-[10px] text-white/50 font-medium">Movies & Series</span>
                    </div>
                  </div>

                  {/* Top-right badge */}
                  {isHovered && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold text-white tracking-wider">
                      Browse →
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
