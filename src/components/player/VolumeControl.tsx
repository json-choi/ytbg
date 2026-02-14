"use client";

import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="size-8" onClick={onToggleMute}>
        <VolumeIcon className="size-4" />
      </Button>
      <Slider
        value={[isMuted ? 0 : volume * 100]}
        max={100}
        step={1}
        onValueChange={([v]) => onVolumeChange(v / 100)}
        className="w-24"
      />
    </div>
  );
}
