export interface Track {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  track: Track;
  playedAt: number;
}

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: "none" | "all" | "one";
  isLoading: boolean;
  error: string | null;
}

export interface StreamResponse {
  url: string;
  expiresAt: number;
}

export interface ParseResponse {
  type: "video" | "playlist";
  tracks: Track[];
  playlistTitle?: string;
}
