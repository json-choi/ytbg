"use client";

import { useState, useEffect, useCallback } from "react";
import { getFavorites, toggleFavorite as dbToggleFavorite, isFavorite as dbIsFavorite } from "../db";
import type { Track } from "../types";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getFavorites();
    setFavorites(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => { refresh(); };
    window.addEventListener("ytbg-favorites-updated", handler);
    return () => window.removeEventListener("ytbg-favorites-updated", handler);
  }, [refresh]);

  const toggleFavorite = useCallback(
    async (track: Track) => {
      const isNowFav = await dbToggleFavorite(track);
      await refresh();
      return isNowFav;
    },
    [refresh],
  );

  return { favorites, loading, refresh, toggleFavorite };
}

export function useIsFavorite(trackId: string | undefined) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!trackId) return;
    const check = () => { dbIsFavorite(trackId).then(setFav); };
    check();
    window.addEventListener("ytbg-favorites-updated", check);
    return () => window.removeEventListener("ytbg-favorites-updated", check);
  }, [trackId]);

  return fav;
}
