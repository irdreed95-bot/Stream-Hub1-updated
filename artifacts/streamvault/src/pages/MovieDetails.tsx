import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getDetails, getCredits, IMAGE_BASE } from "@/services/tmdb";
import { VideoPlayer } from "@/components/VideoPlayer";
import { MovieCard } from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Calendar, AlertCircle, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";

async function lockLandscape() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");
      await ScreenOrientation.lock({ orientation: "landscape" as any });
      return;
    }
  } catch {}
  try {
    await (screen.orientation as any)?.lock?.("landscape");
  } catch {}
}
async function unlockOrientation() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");
      await ScreenOrientation.unlock();
      return;
    }
  } catch {}
  try {
    screen.orientation?.unlock?.();
  } catch {}
}

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const tmdbId = parseInt(id || "0", 10);
  const { t, isRtl } = useI18n();
  const playerRef = useRef<HTMLDivElement>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  useEffect(() => {
    const onFsChange = async () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (isFs) {
        await lockLandscape();
        setIsLandscape(true);
      } else {
        await unlockOrientation();
        setIsLandscape(false);
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
      unlockOrientation();
    };
  }, []);

  const handleLandscapeToggle = async () => {
    if (!isLandscape) {
      if (playerRef.current) {
        try {
          const el = playerRef.current as any;
          const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
          if (req) await req.call(el);
        } catch {}
      }
      await lockLandscape();
      setIsLandscape(true);
    } else {
      try {
        const exit = (document as any).exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen;
        if (exit) await exit.call(document);
      } catch {}
      await unlockOrientation();
      setIsLandscape(false);
    }
  };

  const { data: movie, isLoading: isMovieLoading, isError } = useQuery({
    queryKey: ["movie", tmdbId],
    queryFn: () => getDetails("movie", tmdbId),
    enabled: !!tmdbId,
  });

  const { data: credits } = useQuery({
    queryKey: ["movie-credits", tmdbId],
    queryFn: () => getCredits("movie", tmdbId),
    enabled: !!tmdbId,
  });

  if (isMovieLoading) {
    return (
      <div className="w-full min-h-screen bg-[#06060a]">
        {/* Header skeleton */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#06060a]/95 border-b border-white/5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </div>
        {/* Player skeleton */}
        <Skeleton className="w-full aspect-video" />
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="flex gap-4 items-start">
            <Skeleton className="w-16 h-24 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-14 rounded-lg" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-[#06060a]">
        <div className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">{t("movieNotFound")}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">{t("movieNotFoundDesc")}</p>
        </div>
        <Link href="/">
          <Button>{t("backToHome")}</Button>
        </Link>
      </div>
    );
  }

  const posterUrl = movie.poster_path ? `${IMAGE_BASE}/w342${movie.poster_path}` : null;
  const year = movie.release_date?.split("-")[0];
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const OVERVIEW_LIMIT = 120;
  const shortOverview = movie.overview && movie.overview.length > OVERVIEW_LIMIT
    ? movie.overview.slice(0, OVERVIEW_LIMIT)
    : movie.overview;
  const hasMoreOverview = movie.overview && movie.overview.length > OVERVIEW_LIMIT;

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div className="w-full min-h-screen bg-[#06060a]" dir={isRtl ? "rtl" : "ltr"}>

      {/* Sticky header bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-[#06060a]/95 backdrop-blur border-b border-white/5">
        <Link href="/">
          <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0">
            <BackIcon className="w-4 h-4 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 text-sm font-bold text-white truncate text-center">
          {movie.title}
        </h1>
        {/* Landscape toggle — mobile only */}
        <button
          onClick={handleLandscapeToggle}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/30 transition-colors shrink-0"
          title={isLandscape ? "Exit fullscreen" : "Fullscreen"}
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
        {/* Placeholder to balance flex on desktop */}
        <div className="hidden md:block w-8" />
      </div>

      {/* Video player — full width at top */}
      <div ref={playerRef} className="w-full">
        <VideoPlayer tmdbId={tmdbId} type="movie" />
      </div>

      {/* Content below player */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* Poster + Title + Year */}
        <div className="flex gap-4 items-start">
          {posterUrl && (
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-16 h-24 rounded-xl object-cover border border-white/10 shadow-xl shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 pt-1 space-y-1">
            <h2 className="text-2xl font-black text-white leading-tight">
              {movie.title}
            </h2>
            {year && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {year}
              </p>
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2">
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              {movie.vote_average.toFixed(1)}
            </div>
          )}
          {runtime && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {runtime}
            </div>
          )}
          {movie.genres?.slice(0, 3).map((g: any) => (
            <Badge
              key={g.id}
              className="bg-primary/15 text-primary border border-primary/25 text-[10px] px-2.5 py-1 rounded-lg hover:bg-primary/25"
            >
              {g.name}
            </Badge>
          ))}
        </div>

        {/* Overview */}
        {movie.overview && (
          <div className="text-sm text-muted-foreground leading-relaxed">
            {overviewExpanded ? (
              <>
                {movie.overview}
                {hasMoreOverview && (
                  <button
                    onClick={() => setOverviewExpanded(false)}
                    className="mr-2 ml-2 text-primary text-xs font-semibold hover:underline"
                  >
                    إخفاء
                  </button>
                )}
              </>
            ) : (
              <>
                {shortOverview}
                {hasMoreOverview && (
                  <>
                    {"..."}
                    <button
                      onClick={() => setOverviewExpanded(true)}
                      className="mr-2 ml-2 text-primary text-xs font-semibold hover:underline"
                    >
                      قراءة المزيد
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Cast */}
        {credits?.cast && credits.cast.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className={`text-base font-bold text-white flex items-center gap-2.5 ${isRtl ? "border-r-[3px] border-primary pr-3" : "border-l-[3px] border-primary pl-3"}`}>
              أبرز الممثلين
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-hide snap-x">
              {credits.cast.slice(0, 12).map((person: any) => (
                <div key={person.id} className="min-w-[90px] w-[90px] flex flex-col items-center gap-2 snap-start">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-card border border-white/10 flex-shrink-0">
                    {person.profile_path ? (
                      <img
                        src={`${IMAGE_BASE}/w185${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                        {person.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{person.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{person.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar content */}
        {movie?.similar?.results && movie.similar.results.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className={`text-base font-bold text-white flex items-center gap-2.5 ${isRtl ? "border-r-[3px] border-primary pr-3" : "border-l-[3px] border-primary pl-3"}`}>
              محتوى مشابه
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {movie.similar.results.slice(0, 10).map((item: any) => (
                <MovieCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  releaseDate={item.release_date}
                  type="movie"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
