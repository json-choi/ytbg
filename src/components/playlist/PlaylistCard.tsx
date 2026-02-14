"use client";

import Link from "next/link";
import { Music, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Playlist } from "@/lib/types";
import Image from "next/image";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: () => void;
}

export function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  const firstTrack = playlist.tracks[0];

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card transition-colors hover:bg-accent/50">
      <Link href={`/playlist/${playlist.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden">
          {firstTrack ? (
            <Image
              src={firstTrack.thumbnail}
              alt={playlist.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <Music className="size-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
            {playlist.tracks.length} tracks
          </div>
        </div>
        <div className="p-3">
          <h3 className="truncate font-medium">{playlist.name}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(playlist.createdAt).toLocaleDateString()}
          </p>
        </div>
      </Link>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8 bg-black/50 text-white opacity-0 hover:bg-black/70 group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
