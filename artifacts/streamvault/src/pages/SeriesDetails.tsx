import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getDetails, getCredits, getSeasonDetails, IMAGE_BASE } from "@/services/tmdb";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Play, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function SeriesDetails() {
  const { id } = useParams<{ id: string }>();
  const tmdbId = parseInt(id || "0", 10);
  const { t, isRtl } = useI18n();

  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  const { data: series, isLoading: isSeriesLoading, isError } = useQuery({
    queryKey: ['tv', tmdbId],
    queryFn: () => getDetails('tv', tmdbId),
    enabled: !!tmdbId && !isNaN(tmdbId),
  });

  const { data: credits } = useQuery({
    queryKey: ['tvCredits', tmdbId],
    queryFn: () => getCredits('tv', tmdbId),
    enabled: !!tmdbId && !isNaN(tmdbId),
  });

  const { data: seasonDetails, isLoading: isSeasonLoading } = useQuery({
    queryKey: ['tvSeason', tmdbId, selectedSeason],
    queryFn: () => getSeasonDetails(tmdbId, selectedSeason),
    enabled: !!tmdbId && !!selectedSeason,
  });

  // When series loads, set season 1 if valid, else first available
  useEffect(() => {
    if (series?.seasons && series.seasons.length > 0) {
      const defaultSeason = series.seasons.find((s: any) => s.season_number > 0) || series.seasons[0];
      if (defaultSeason) {
        setSelectedSeason(defaultSeason.season_number);
        setSelectedEpisode(1);
      }
    }
  }, [series]);

  if (!tmdbId || isNaN(tmdbId) || isError) {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-6">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">{t("seriesNotFound")}</h2>
          <p className="text-muted-foreground max-w-sm">{t("movieNotFoundDesc")}</p>
        </div>
        <Link href="/">
          <Button variant="default" className="mt-4">{t("backToHome")}</Button>
        </Link>
      </div>
    );
  }

  if (isSeriesLoading) {
    return (
      <div className="w-full min-h-screen bg-background">
        <Skeleton className="w-full h-[50vh]" />
        <div className="p-8 max-w-6xl mx-auto space-y-4 mt-8">
          <Skeleton className="w-1/2 h-12" />
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full aspect-video mt-12" />
        </div>
      </div>
    );
  }

  if (!series) return null;

  const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : '';
  const seasonsList = series.seasons?.filter((s: any) => s.season_number > 0) || [];

  return (
    <div className="w-full min-h-screen bg-background pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[50vh] md:h-[60vh] bg-black">
        {series.backdrop_path && (
          <img 
            src={`${IMAGE_BASE}original${series.backdrop_path}`} 
            alt={series.name}
            className="w-full h-full object-cover opacity-30 mask-image-bottom"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-row gap-6 md:gap-8 items-end max-w-7xl mx-auto">
          {series.poster_path && (
            <img 
              src={`${IMAGE_BASE}w342${series.poster_path}`} 
              alt={series.name}
              className="w-24 sm:w-32 md:w-48 rounded-xl shadow-2xl border border-white/10 shrink-0"
            />
          )}
          <div className="space-y-3 flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white drop-shadow-md truncate">
              {series.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-white">{series.vote_average?.toFixed(1)}</span>
              </div>
              {year && <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {year}</div>}
              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md text-white">
                {series.number_of_seasons} Seasons
              </div>
              <div className="flex gap-2 flex-wrap mt-1 md:mt-0">
                {series.genres?.map((g: any) => (
                  <Badge key={g.id} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 text-[10px] md:text-xs">
                    {g.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-none">
              {series.overview}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
        {/* Player & Episode Selector Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left: Player */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                S{selectedSeason} E{selectedEpisode}
              </h2>
            </div>
            <VideoPlayer tmdbId={tmdbId} type="tv" season={selectedSeason} episode={selectedEpisode} />
          </div>

          {/* Right: Seasons/Episodes */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-white">Episodes</h3>
            <Select 
              value={selectedSeason.toString()} 
              onValueChange={(val) => {
                setSelectedSeason(parseInt(val, 10));
                setSelectedEpisode(1);
              }}
            >
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue placeholder="Select Season" />
              </SelectTrigger>
              <SelectContent>
                {seasonsList.map((season: any) => (
                  <SelectItem key={season.id} value={season.season_number.toString()}>
                    Season {season.season_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ScrollArea className="h-[300px] md:h-[400px] rounded-xl border border-white/5 bg-card/50">
              <div className="p-2 space-y-2">
                {isSeasonLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-full h-16 rounded-lg" />)
                ) : seasonDetails?.episodes ? (
                  seasonDetails.episodes.map((ep: any) => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedEpisode(ep.episode_number)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                        selectedEpisode === ep.episode_number 
                          ? "bg-primary/20 text-primary border border-primary/30" 
                          : "hover:bg-white/5 text-muted-foreground hover:text-white"
                      )}
                    >
                      <div className="w-16 h-10 bg-muted rounded overflow-hidden shrink-0 relative">
                        {ep.still_path ? (
                          <img src={`${IMAGE_BASE}w185${ep.still_path}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                            <Play className="w-4 h-4 opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{ep.episode_number}. {ep.name}</div>
                        <div className="text-[10px] opacity-70">{ep.runtime ? `${ep.runtime}m` : ''}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No episodes found.</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Cast Section */}
        {credits?.cast && credits.cast.length > 0 && (
          <section className="space-y-5 pt-8 border-t border-white/5">
            <h2 className={`text-lg md:text-xl font-bold text-white flex items-center gap-2.5 ${isRtl ? "border-r-[3px] border-primary pr-3" : "border-l-[3px] border-primary pl-3"}`}>
              {t("topCast")}
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none' }}>
              {credits.cast.slice(0, 10).map((person: any) => (
                <div key={person.id} className="min-w-[100px] md:min-w-[120px] w-[100px] md:w-[120px] flex flex-col items-center space-y-2 snap-start">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-muted border border-white/10 shrink-0">
                    {person.profile_path ? (
                      <img 
                        src={`${IMAGE_BASE}w185${person.profile_path}`} 
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-[10px] text-muted-foreground text-center p-2">
                        {person.name}
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <p className="text-xs md:text-sm font-semibold text-white leading-tight truncate">{person.name}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground leading-tight truncate">{person.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}