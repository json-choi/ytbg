"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListMusic, X, Play } from "lucide-react";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { formatDuration } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function QueueSheet() {
  const { queue, queueIndex, playTrack, removeFromQueue } = usePlayer();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <ListMusic className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Queue ({queue.length})</SheetTitle>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
          <div className="space-y-1 pr-4">
            {queue.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2 transition-colors",
                  index === queueIndex
                    ? "bg-accent"
                    : "hover:bg-accent/50",
                )}
              >
                <button
                  onClick={() => playTrack(track, queue, index)}
                  className="relative size-10 shrink-0 overflow-hidden rounded"
                >
                  <Image
                    src={track.thumbnail}
                    alt={track.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                  {index === queueIndex && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Play className="size-4 fill-white text-white" />
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {track.channel} &middot; {formatDuration(track.duration)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => removeFromQueue(index)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            {queue.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Queue is empty
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
