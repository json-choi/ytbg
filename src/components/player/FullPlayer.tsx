"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronDown,
  Heart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useIsFavorite } from "@/lib/hooks/useFavorites";
import { toggleFavorite } from "@/lib/db";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import { QueueSheet } from "./QueueSheet";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FullPlayerProps {
  onCollapse: () => void;
}

export function FullPlayer({ onCollapse }: FullPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const isFav = useIsFavorite(currentTrack?.id);

  if (!currentTrack) return null;

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onCollapse}>
          <ChevronDown className="size-6" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Now Playing</span>
        <QueueSheet />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
        <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl shadow-2xl">
          <Image
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            fill
            className="object-cover"
            sizes="320px"
            priority
          />
        </div>

        <div className="w-full max-w-xs space-y-1 text-center">
          <h2 className="text-lg font-semibold leading-tight">{currentTrack.title}</h2>
          <p className="text-sm text-muted-foreground">{currentTrack.channel}</p>
        </div>

        <div className="w-full max-w-xs">
          <ProgressBar currentTime={currentTime} duration={duration} onSeek={seekTo} />
        </div>

        <div className="flex w-full max-w-xs items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-10", shuffle && "text-primary")}
            onClick={toggleShuffle}
          >
            <Shuffle className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-12" onClick={playPrevious}>
            <SkipBack className="size-6 fill-current" />
          </Button>
          <Button
            size="icon"
            className="size-14 rounded-full"
            onClick={togglePlay}
          >
            {isLoading ? (
              <Loader2 className="size-7 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-7 fill-current" />
            ) : (
              <Play className="size-7 fill-current" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="size-12" onClick={playNext}>
            <SkipForward className="size-6 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-10", repeat !== "none" && "text-primary")}
            onClick={cycleRepeat}
          >
            <RepeatIcon className="size-5" />
          </Button>
        </div>

        <div className="flex w-full max-w-xs items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-9", isFav && "text-red-500")}
            onClick={() => currentTrack && toggleFavorite(currentTrack)}
          >
            <Heart className={cn("size-5", isFav && "fill-current")} />
          </Button>
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
          />
        </div>
      </div>
    </div>
  );
}
