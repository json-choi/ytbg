"use client";

import { Header } from "@/components/layout/Header";
import { TrackItem } from "@/components/playlist/TrackItem";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { usePlayer } from "@/lib/hooks/usePlayer";

export default function FavoritesPage() {
  const { favorites, loading, toggleFavorite } = useFavorites();
  const { playQueue, addToQueue } = usePlayer();

  return (
    <div>
      <Header title="Favorites" />

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-sm text-muted-foreground">No favorites yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {favorites.map((track, i) => (
              <TrackItem
                key={track.id}
                track={track}
                onPlay={() => playQueue(favorites, i)}
                onAddToQueue={() => addToQueue(track)}
                onToggleFavorite={() => toggleFavorite(track)}
                isFavorite
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
