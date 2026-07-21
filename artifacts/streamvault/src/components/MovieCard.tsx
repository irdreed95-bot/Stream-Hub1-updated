import { Link } from "wouter";
import { IMAGE_BASE } from "@/services/tmdb";
import { Play, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate?: string;
  type: "movie" | "tv";
}

export function MovieCard({ id, title, posterPath, voteAverage, releaseDate, type }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";

  return (
    <Link href={`/${type}/${id}`} data-testid={`card-${type}-${id}`}>
      <motion.div
        whileHover={{ scale: 1.03, zIndex: 10 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group relative flex flex-col gap-2 cursor-pointer w-full"
      >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-white/[0.06] shadow-md group-hover:shadow-xl group-hover:border-primary/25 transition-all duration-300">
          {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
          {posterPath ? (
            <img
              src={`${IMAGE_BASE}w185${posterPath}`}
              alt={title}
              className={`object-cover w-full h-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-secondary text-muted-foreground text-sm text-center p-4">
              {title}
            </div>
          )}

          {/* Permanent bottom gradient — keeps badges legible even without hover */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground rounded-full p-3.5 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-glow">
              <Play className="w-5 h-5 fill-current ms-0.5" />
            </div>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-2 end-2 bg-black/75 backdrop-blur-md text-primary text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 fill-primary text-primary" />
            {voteAverage.toFixed(1)}
          </div>

          {/* Type Badge */}
          <div className="absolute bottom-2 end-2 bg-primary/90 text-primary-foreground text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded">
            {type === 'tv' ? 'SERIES' : 'MOVIE'}
          </div>

          {/* Year Badge */}
          {year && (
            <div className="absolute bottom-2 start-2 text-white/85 text-[11px] font-medium px-0.5">
              {year}
            </div>
          )}
        </div>

        <div className="px-0.5">
          <h3 className="font-semibold text-xs sm:text-sm text-foreground/95 truncate leading-snug group-hover:text-primary transition-colors">{title}</h3>
        </div>
      </motion.div>
    </Link>
  );
}
