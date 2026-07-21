import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrending, getPopular, getTopRated, getByGenre, getDiscover, IMAGE_BASE } from "@/services/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { InlineAdBanner } from "@/components/AdBanner";

function MovieCarousel({ title, data, isLoading }: { title: string; data: any[]; isLoading: boolean }) {
  const { isRtl } = useI18n();
  return (
    <section className="py-5">
      <h2 className={cn(
        "text-sm sm:text-base font-bold text-foreground mb-4 mx-4 md:mx-8 flex items-center gap-2.5",
        isRtl ? "border-r-[3px] border-primary pr-3" : "border-l-[3px] border-primary pl-3"
      )}>
        {title}
      </h2>
      <div className="flex overflow-x-auto gap-4 px-4 md:px-8 pb-3 snap-x snap-mandatory scrollbar-hide">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="min-w-[100px] sm:min-w-[130px] md:min-w-[155px] snap-start shrink-0">
                <Skeleton className="w-full aspect-[2/3] rounded-xl" />
              </div>
            ))
          : data.map(item => (
              <div key={item.id} className="min-w-[100px] sm:min-w-[130px] md:min-w-[155px] snap-start shrink-0">
                <MovieCard
                  id={item.id}
                  title={item.title || item.name}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  releaseDate={item.release_date || item.first_air_date}
                  type={item.media_type || (item.title ? "movie" : "tv")}
                />
              </div>
            ))}
      </div>
    </section>
  );
}

function DiscoverRow({ title, type, params }: { title: string; type: "movie" | "tv"; params: Record<string, string> }) {
  const { data, isLoading } = useQuery({
    queryKey: ["discover", type, JSON.stringify(params)],
    queryFn: () => getDiscover(type, params),
  });
  return <MovieCarousel title={title} data={data?.results || []} isLoading={isLoading} />;
}

function GenreRow({ title, type, genreId }: { title: string; type: "movie" | "tv"; genreId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["genre", type, genreId],
    queryFn: () => getByGenre(type, genreId),
  });
  return <MovieCarousel title={title} data={data?.results || []} isLoading={isLoading} />;
}

export default function Home() {
  const { t, isRtl } = useI18n();

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending", "all", "day"],
    queryFn: () => getTrending("all", "day"),
  });
  const { data: recentlyAdded, isLoading: recentlyLoading } = useQuery({
    queryKey: ["trending", "all", "week"],
    queryFn: () => getTrending("all", "week"),
  });
  const { data: popMovies, isLoading: popMoviesLoading } = useQuery({
    queryKey: ["popular", "movie"],
    queryFn: () => getPopular("movie"),
  });
  const { data: topMovies, isLoading: topMoviesLoading } = useQuery({
    queryKey: ["topRated", "movie"],
    queryFn: () => getTopRated("movie"),
  });
  const { data: topSeries, isLoading: topSeriesLoading } = useQuery({
    queryKey: ["topRated", "tv"],
    queryFn: () => getTopRated("tv"),
  });

  const [heroIndex, setHeroIndex] = useState(0);
  const heroes = trending?.results?.slice(0, 5) || [];

  useEffect(() => {
    if (heroes.length === 0) return;
    const iv = setInterval(() => setHeroIndex(i => (i + 1) % heroes.length), 6000);
    return () => clearInterval(iv);
  }, [heroes.length]);

  const hero = heroes[heroIndex];

  return (
    <div className="w-full min-h-screen bg-background pb-20">
      {/* ── Hero Banner ── */}
      <div className="relative w-full h-[45vh] sm:h-[55vh] md:h-[72vh] bg-black overflow-hidden">
        {trendingLoading ? (
          <Skeleton className="w-full h-full" />
        ) : hero ? (
          <>
            <div className="absolute inset-0 transition-opacity duration-1000">
              <img
                src={`${IMAGE_BASE}original${hero.backdrop_path}`}
                alt={hero.title || hero.name}
                className="w-full h-full object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className={cn(
                "absolute inset-0",
                isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r",
                "from-background via-background/55 to-transparent"
              )} />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className={cn(
              "absolute bottom-0 p-6 md:p-12 w-full md:w-2/3 space-y-5",
              isRtl ? "right-0 text-right" : "left-0 text-left"
            )}>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-[1.05]">
                {hero.title || hero.name}
              </h1>
              <p className="text-white/70 line-clamp-2 text-sm sm:text-base max-w-xl leading-relaxed">
                {hero.overview}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link href={`/${hero.media_type || "movie"}/${hero.id}`}>
                  <Button size="lg" className="gap-2 text-sm font-bold shadow-glow px-7">
                    <Play className="w-4 h-4 fill-current" />
                    {t("playNow")}
                  </Button>
                </Link>
                <Link href={`/${hero.media_type || "movie"}/${hero.id}`}>
                  <Button size="lg" variant="secondary" className="gap-2 text-sm bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md px-7">
                    <Info className="w-4 h-4" />
                    {t("moreInfo")}
                  </Button>
                </Link>
              </div>
              <div className="flex gap-1.5 pt-2">
                {heroes.map((_hero: any, i: number) => (
                  <button key={i} onClick={() => setHeroIndex(i)}
                    className={cn("h-1 rounded-full transition-all duration-300",
                      i === heroIndex ? "bg-primary w-7" : "bg-white/25 w-1.5 hover:bg-white/50"
                    )} />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Content Rows ── */}
      <div className="mt-[-2.5rem] sm:mt-[-4.5rem] relative z-10 space-y-1">
        <MovieCarousel title={t("trendingToday")} data={trending?.results?.slice(1) || []} isLoading={trendingLoading} />
        <MovieCarousel title={t("recentlyAdded")} data={recentlyAdded?.results || []} isLoading={recentlyLoading} />

        <InlineAdBanner />

        {/* Arabic Movies & Series */}
        <DiscoverRow title={t("arabicContent")} type="movie" params={{ with_original_language: "ar", sort_by: "popularity.desc" }} />
        <DiscoverRow title={t("arabicContent") + " — " + t("series")} type="tv" params={{ with_original_language: "ar", sort_by: "popularity.desc" }} />

        {/* Turkish Dubbed */}
        <DiscoverRow title={t("turkishSeries")} type="tv" params={{ with_original_language: "tr", sort_by: "popularity.desc" }} />
        <DiscoverRow title={t("turkishSeries") + " — " + t("movies")} type="movie" params={{ with_original_language: "tr", sort_by: "popularity.desc" }} />

        {/* Anime & Cartoon */}
        <GenreRow title={t("animeWorld")} type="tv" genreId={16} />
        <GenreRow title={t("animeWorld") + " — " + t("movies")} type="movie" genreId={16} />

        <InlineAdBanner />

        {/* Indian Movies */}
        <DiscoverRow title={t("indianMovies")} type="movie" params={{ with_original_language: "hi", sort_by: "popularity.desc" }} />

        {/* Cinemana curated rows */}
        <MovieCarousel title={t("featuredMovies")} data={topMovies?.results || []} isLoading={topMoviesLoading} />
        <MovieCarousel title={t("featuredSeries")} data={topSeries?.results || []} isLoading={topSeriesLoading} />
        <GenreRow title={t("muharramPack")} type="movie" genreId={18} />
        <GenreRow title={t("moviesIn4K")} type="movie" genreId={878} />
        <MovieCarousel title={t("popularMovies")} data={popMovies?.results || []} isLoading={popMoviesLoading} />
        <GenreRow title={t("action")} type="movie" genreId={28} />
        <GenreRow title={t("comedy")} type="movie" genreId={35} />
        <GenreRow title={t("horror")} type="movie" genreId={27} />
      </div>
    </div>
  );
}
