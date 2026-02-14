"use client";

import { Play, MoreVertical, Heart, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/youtube";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TrackItemProps {
  track: Track;
  index?: number;
  isActive?: boolean;
  onPlay: () => void;
  onAddToQueue?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export function TrackItem({
  track,
  index,
  isActive,
  onPlay,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
}: TrackItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50",
        isActive && "bg-accent",
      )}
    >
      <button onClick={onPlay} className="relative size-12 shrink-0 overflow-hidden rounded">
        <Image
          src={track.thumbnail}
          alt={track.title}
          fill
          className="object-cover"
          sizes="48px"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
          {isActive ? (
            <Play className="size-4 fill-white text-white" />
          ) : (
            <Play className="size-4 fill-white text-white opacity-0 group-hover:opacity-100" />
          )}
        </div>
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isActive && "text-primary")}>
          {index != null && <span className="mr-2 text-muted-foreground">{index + 1}</span>}
          {track.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {track.channel} &middot; {formatDuration(track.duration)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
        {onToggleFavorite && (
          <Button variant="ghost" size="icon" className="size-8" onClick={onToggleFavorite}>
            <Heart className={cn("size-4", isFavorite && "fill-red-500 text-red-500")} />
          </Button>
        )}
        {onAddToQueue && (
          <Button variant="ghost" size="icon" className="size-8" onClick={onAddToQueue}>
            <ListPlus className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
