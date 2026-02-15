"use client";

import {
  Play,
  Pause,
  SkipForward,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { ProgressBar } from "./ProgressBar";
import { BOTTOM_NAV_HEIGHT } from "@/components/layout/BottomNav";
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

  const isDownloading =
    isLoading && downloadProgress > 0 && downloadProgress < 100;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (error) {
      retryPlay();
    } else {
      togglePlay();
    }
  };

  return (
    <div
      className="fixed left-2 right-2 z-50"
      style={{
        bottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 4px)`,
      }}
    >
      <div className="overflow-hidden rounded-xl bg-card/95 shadow-lg shadow-black/20 ring-1 ring-white/[0.08] backdrop-blur-xl">
        {/* Progress bar at top of mini player */}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={seekTo}
          compact
        />

        <div className="flex items-center gap-3 px-3 py-2">
          {/* Tappable area: thumbnail + track info */}
          <button
            onClick={onExpand}
            className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13px] font-semibold leading-tight">
                {currentTrack.title}
              </p>
              {error ? (
                <p className="mt-0.5 truncate text-[11px] leading-tight text-destructive">
                  {error}
                </p>
              ) : isDownloading ? (
                <p className="mt-0.5 truncate text-[11px] leading-tight text-blue-400">
                  <Download className="mr-0.5 inline size-3" />
                  다운로드 중... {downloadProgress}%
                </p>
              ) : (
                <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                  {currentTrack.channel}
                </p>
              )}
            </div>
          </button>

          {/* Control buttons */}
          <div className="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full active:scale-90"
              onClick={handlePlayClick}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isLoading ? (
                <Loader2 className="size-[22px] animate-spin" />
              ) : error ? (
                <AlertCircle className="size-[22px] text-destructive" />
              ) : isPlaying ? (
                <Pause className="size-[22px] fill-current" />
              ) : (
                <Play className="size-[22px] fill-current" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full active:scale-90"
              onClick={(e) => {
                e.stopPropagation();
                playNext();
              }}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <SkipForward className="size-[22px] fill-current" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
