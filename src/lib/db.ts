import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Playlist, Track, HistoryEntry } from "./types";

interface YtbgDB extends DBSchema {
  playlists: {
    key: string;
    value: Playlist;
    indexes: { "by-date": number };
  };
  history: {
    key: number;
    value: HistoryEntry;
    indexes: { "by-date": number };
  };
  favorites: {
    key: string;
    value: { track: Track; addedAt: number };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "ytbg-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<YtbgDB>> | null = null;

function dispatchDBEvent(name: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(name));
  }
}

function getDB(): Promise<IDBPDatabase<YtbgDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available on the server"));
  }
  if (!dbPromise) {
    dbPromise = openDB<YtbgDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const playlistStore = db.createObjectStore("playlists", {
          keyPath: "id",
        });
        playlistStore.createIndex("by-date", "createdAt");

        const historyStore = db.createObjectStore("history", {
          autoIncrement: true,
        });
        historyStore.createIndex("by-date", "playedAt");

        db.createObjectStore("favorites", { keyPath: "track.id" });
        db.createObjectStore("settings");
      },
    });
  }
  return dbPromise;
}

export async function getPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("playlists", "by-date");
  return all.reverse();
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await getDB();
  return db.get("playlists", id);
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put("playlists", playlist);
  dispatchDBEvent("ytbg-playlists-updated");
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("playlists", id);
  dispatchDBEvent("ytbg-playlists-updated");
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("history", "by-date");
  return all.reverse().slice(0, 100);
}

export async function addToHistory(track: Track): Promise<void> {
  const db = await getDB();
  await db.add("history", { track, playedAt: Date.now() });

  const count = await db.count("history");
  if (count > 100) {
    const tx = db.transaction("history", "readwrite");
    const cursor = await tx.store.openCursor();
    if (cursor) {
      await cursor.delete();
    }
    await tx.done;
  }
  dispatchDBEvent("ytbg-history-updated");
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear("history");
  dispatchDBEvent("ytbg-history-updated");
}

export async function getFavorites(): Promise<Track[]> {
  const db = await getDB();
  const all = await db.getAll("favorites");
  return all.sort((a, b) => b.addedAt - a.addedAt).map((f) => f.track);
}

export async function isFavorite(trackId: string): Promise<boolean> {
  const db = await getDB();
  const item = await db.get("favorites", trackId);
  return !!item;
}

export async function toggleFavorite(track: Track): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get("favorites", track.id);
  if (existing) {
    await db.delete("favorites", track.id);
    dispatchDBEvent("ytbg-favorites-updated");
    return false;
  }
  await db.put("favorites", { track, addedAt: Date.now() });
  dispatchDBEvent("ytbg-favorites-updated");
  return true;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDB();
  const val = await db.get("settings", key);
  return (val as T) ?? fallback;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("settings", value, key);
}
