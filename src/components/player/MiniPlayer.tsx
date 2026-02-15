"use client";

import { Play, Pause, SkipForward, Loader2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { ProgressBar } from "./ProgressBar";
import Image from "next/image";

interface MiniPlayerProps {
  onExpand: () => void;
}

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    downloadProgress,
    error,
    currentTime,
    duration,
    togglePlay,
    retryPlay,
    playNext,
    seekTo,
  } = usePlayer();

  if (!currentTrack) return null;

  const isDownloading = isLoading && downloadProgress > 0 && downloadProgress < 100;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (error) {
      retryPlay();
    } else {
      togglePlay();
    }
  };

  return (
    <div className="fixed bottom-[calc(3.5rem)] left-0 right-0 z-50 border-t border-border bg-card">
      <ProgressBar currentTime={currentTime} duration={duration} onSeek={seekTo} compact />
      <div className="flex items-center gap-3 px-3 py-2">
        <button onClick={onExpand} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded">
            <Image
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium">{currentTrack.title}</p>
            {error ? (
              <p className="truncate text-xs text-destructive">{error}</p>
            ) : isDownloading ? (
              <p className="truncate text-xs text-blue-500">
                <Download className="mr-1 inline size-3" />
                다운로드 중... {downloadProgress}%
              </p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">{currentTrack.channel}</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={handlePlayClick}
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : error ? (
              <AlertCircle className="size-5 text-destructive" />
            ) : isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 fill-current" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
          >
            <SkipForward className="size-5 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
}
