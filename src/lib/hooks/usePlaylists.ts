"use client";

import { useState, useEffect, useCallback } from "react";
import { getPlaylists, getPlaylist, savePlaylist, deletePlaylist as dbDeletePlaylist } from "../db";
import type { Playlist, Track } from "../types";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getPlaylists();
    setPlaylists(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => { refresh(); };
    window.addEventListener("ytbg-playlists-updated", handler);
    return () => window.removeEventListener("ytbg-playlists-updated", handler);
  }, [refresh]);

  const createPlaylist = useCallback(
    async (name: string, tracks: Track[]) => {
      const pl: Playlist = {
        id: crypto.randomUUID(),
        name,
        tracks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await savePlaylist(pl);
      await refresh();
      return pl;
    },
    [refresh],
  );

  const updatePlaylist = useCallback(
    async (id: string, updates: Partial<Pick<Playlist, "name" | "tracks">>) => {
      const existing = await getPlaylist(id);
      if (!existing) return;
      const updated: Playlist = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };
      await savePlaylist(updated);
      await refresh();
    },
    [refresh],
  );

  const removePlaylist = useCallback(
    async (id: string) => {
      await dbDeletePlaylist(id);
      await refresh();
    },
    [refresh],
  );

  return { playlists, loading, refresh, createPlaylist, updatePlaylist, removePlaylist };
}

export function usePlaylistDetail(id: string) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getPlaylist(id);
    setPlaylist(data ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
    const handler = () => { refresh(); };
    window.addEventListener("ytbg-playlists-updated", handler);
    return () => window.removeEventListener("ytbg-playlists-updated", handler);
  }, [refresh]);

  return { playlist, loading, refresh };
}
