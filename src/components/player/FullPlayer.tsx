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
  AlertCircle,
  Download,
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
    downloadProgress,
    error,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    togglePlay,
    retryPlay,
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
  const isBuffering =
    isLoading && downloadProgress > 0 && downloadProgress < 100;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full"
          onClick={onCollapse}
        >
          <ChevronDown className="size-6" />
        </Button>
        <span className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Now Playing
        </span>
        <QueueSheet />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-10">
        {/* Album art */}
        <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
          <Image
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            fill
            className="object-cover"
            sizes="280px"
            priority
          />
          {isBuffering && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <Download className="mb-2 size-8 animate-bounce text-white" />
              <span className="text-lg font-bold text-white">
                로딩 중...
              </span>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="w-full max-w-[280px] space-y-1 text-center">
          <h2 className="text-[17px] font-bold leading-tight tracking-[-0.01em]">
            {currentTrack.title}
          </h2>
          <p className="text-[15px] text-muted-foreground">
            {currentTrack.channel}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isBuffering && (
            <p className="text-sm text-blue-400">
              로딩 중...
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="w-full max-w-[280px]">
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
          />
        </div>

        {/* Playback controls */}
        <div className="flex w-full max-w-[280px] items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-10 rounded-full", shuffle && "text-primary")}
            onClick={toggleShuffle}
          >
            <Shuffle className="size-[20px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-12 rounded-full"
            onClick={playPrevious}
          >
            <SkipBack className="size-[26px] fill-current" />
          </Button>
          <Button
            size="icon"
            className="size-16 rounded-full shadow-lg"
            onClick={error ? retryPlay : togglePlay}
          >
            {isLoading ? (
              <Loader2 className="size-8 animate-spin" />
            ) : error ? (
              <AlertCircle className="size-8 text-destructive" />
            ) : isPlaying ? (
              <Pause className="size-8 fill-current" />
            ) : (
              <Play className="size-8 fill-current" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-12 rounded-full"
            onClick={playNext}
          >
            <SkipForward className="size-[26px] fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-10 rounded-full",
              repeat !== "none" && "text-primary",
            )}
            onClick={cycleRepeat}
          >
            <RepeatIcon className="size-[20px]" />
          </Button>
        </div>

        {/* Secondary controls */}
        <div className="flex w-full max-w-[280px] items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-10 rounded-full", isFav && "text-red-500")}
            onClick={() => currentTrack && toggleFavorite(currentTrack)}
          >
            <Heart
              className={cn("size-[22px]", isFav && "fill-current")}
            />
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
