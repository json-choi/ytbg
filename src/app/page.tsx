"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { AddUrlInput } from "@/components/playlist/AddUrlInput";
import { TrackItem } from "@/components/playlist/TrackItem";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { usePlaylists } from "@/lib/hooks/usePlaylists";
import { useHistory } from "@/lib/hooks/useHistory";
import type { ParseResponse, Track } from "@/lib/types";
import { InstallBanner } from "@/components/InstallBanner";
import { Play, Save } from "lucide-react";

export default function HomePage() {
  const { playQueue, addToQueue } = usePlayer();
  const {
    playlists,
    createPlaylist,
    removePlaylist,
    loading: playlistsLoading,
  } = usePlaylists();
  const { entries: history, loading: historyLoading } = useHistory();
  const [parsedTracks, setParsedTracks] = useState<Track[]>([]);
  const [parsedTitle, setParsedTitle] = useState<string | null>(null);

  const handleParsed = useCallback((result: ParseResponse) => {
    setParsedTracks(result.tracks);
    setParsedTitle(result.playlistTitle ?? null);
  }, []);

  const handlePlayAll = useCallback(() => {
    if (parsedTracks.length > 0) {
      playQueue(parsedTracks, 0);
    }
  }, [parsedTracks, playQueue]);

  const handleSavePlaylist = useCallback(async () => {
    if (parsedTracks.length === 0) return;
    const name = parsedTitle || `Playlist ${new Date().toLocaleDateString()}`;
    await createPlaylist(name, parsedTracks);
    setParsedTracks([]);
    setParsedTitle(null);
  }, [parsedTracks, parsedTitle, createPlaylist]);

  const recentTracks = history.slice(0, 10).map((e) => e.track);

  return (
    <div className="flex flex-1 flex-col">
      <Header title="YTBG Player" />
      <InstallBanner />

      <div className="flex-1 space-y-6 px-4 py-5">
        {/* URL Input */}
        <section>
          <AddUrlInput onParsed={handleParsed} />
        </section>

        {/* Parsed tracks */}
        {parsedTracks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                {parsedTitle ?? "Parsed Tracks"} ({parsedTracks.length})
              </h2>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 rounded-full px-4 text-[13px]" onClick={handlePlayAll}>
                  <Play className="mr-1 size-3.5" />
                  Play All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full px-4 text-[13px]"
                  onClick={handleSavePlaylist}
                >
                  <Save className="mr-1 size-3.5" />
                  Save
                </Button>
              </div>
            </div>
            <div className="-mx-3 space-y-0.5">
              {parsedTracks.map((track, i) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={i}
                  onPlay={() => playQueue(parsedTracks, i)}
                  onAddToQueue={() => addToQueue(track)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Played */}
        {recentTracks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              Recently Played
            </h2>
            <div className="-mx-3 space-y-0.5">
              {recentTracks.map((track, i) => (
                <TrackItem
                  key={`${track.id}-${i}`}
                  track={track}
                  onPlay={() => playQueue(recentTracks, i)}
                  onAddToQueue={() => addToQueue(track)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Saved Playlists */}
        {!playlistsLoading && playlists.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              Saved Playlists
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onDelete={() => removePlaylist(pl.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!historyLoading &&
          recentTracks.length === 0 &&
          !playlistsLoading &&
          playlists.length === 0 &&
          parsedTracks.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="text-5xl">🎵</div>
              <h2 className="text-[17px] font-semibold">Start Listening</h2>
              <p className="max-w-[260px] text-[14px] leading-relaxed text-muted-foreground">
                Paste a YouTube video or playlist URL above to start playing
                music in the background.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
