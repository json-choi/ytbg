"use client";

import { use } from "react";
import { Header } from "@/components/layout/Header";
import { TrackItem } from "@/components/playlist/TrackItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlaylistDetail } from "@/lib/hooks/usePlaylists";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { Play, Shuffle } from "lucide-react";

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { playlist, loading } = usePlaylistDetail(id);
  const { playQueue, addToQueue } = usePlayer();

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading..." />
        <div className="space-y-4 px-4 py-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Not Found" />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-[14px] text-muted-foreground">
            Playlist not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={playlist.name} />

      <div className="flex-1 px-4 py-5">
        {/* Action bar */}
        <div className="mb-5 flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 rounded-full px-4 text-[13px]"
            onClick={() => playQueue(playlist.tracks, 0)}
            disabled={playlist.tracks.length === 0}
          >
            <Play className="mr-1 size-3.5" />
            Play All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full px-4 text-[13px]"
            onClick={() => {
              const shuffled = [...playlist.tracks].sort(
                () => Math.random() - 0.5,
              );
              playQueue(shuffled, 0);
            }}
            disabled={playlist.tracks.length === 0}
          >
            <Shuffle className="mr-1 size-3.5" />
            Shuffle
          </Button>
          <span className="ml-auto text-[13px] text-muted-foreground">
            {playlist.tracks.length} tracks
          </span>
        </div>

        {/* Track list */}
        <div className="-mx-3 space-y-0.5">
          {playlist.tracks.map((track, i) => (
            <TrackItem
              key={track.id}
              track={track}
              index={i}
              onPlay={() => playQueue(playlist.tracks, i)}
              onAddToQueue={() => addToQueue(track)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
