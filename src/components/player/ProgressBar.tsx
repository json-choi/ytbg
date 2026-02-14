"use client";

import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/youtube";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  compact?: boolean;
}

export function ProgressBar({ currentTime, duration, onSeek, compact }: ProgressBarProps) {
  if (compact) {
    return (
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {formatDuration(currentTime)}
      </span>
      <Slider
        value={[currentTime]}
        max={duration || 1}
        step={1}
        onValueChange={([v]) => onSeek(v)}
        className="flex-1"
      />
      <span className="w-10 text-xs tabular-nums text-muted-foreground">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
