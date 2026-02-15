"use client";

import { Header } from "@/components/layout/Header";
import { TrackItem } from "@/components/playlist/TrackItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistory } from "@/lib/hooks/useHistory";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { Trash2 } from "lucide-react";

export default function HistoryPage() {
  const { entries, loading, clearAll } = useHistory();
  const { playQueue, addToQueue } = usePlayer();

  const tracks = entries.map((e) => e.track);

  return (
    <div className="flex flex-1 flex-col">
      <Header title="History">
        {entries.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-[13px]"
            onClick={clearAll}
          >
            <Trash2 className="mr-1 size-3.5" />
            Clear
          </Button>
        )}
      </Header>

      <div className="flex-1 px-4 py-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-[14px] text-muted-foreground">No history yet</p>
          </div>
        ) : (
          <div className="-mx-3 space-y-0.5">
            {entries.map((entry, i) => (
              <TrackItem
                key={`${entry.track.id}-${entry.playedAt}`}
                track={entry.track}
                onPlay={() => playQueue(tracks, i)}
                onAddToQueue={() => addToQueue(entry.track)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
