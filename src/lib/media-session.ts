import type { Track } from "./types";

interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onSeekTo: (time: number) => void;
}

export function setupMediaSession(callbacks: MediaSessionCallbacks): void {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.setActionHandler("play", callbacks.onPlay);
  navigator.mediaSession.setActionHandler("pause", callbacks.onPause);
  navigator.mediaSession.setActionHandler("previoustrack", callbacks.onPrevious);
  navigator.mediaSession.setActionHandler("nexttrack", callbacks.onNext);

  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    callbacks.onSeekBackward();
    void details;
  });
  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    callbacks.onSeekForward();
    void details;
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null) {
      callbacks.onSeekTo(details.seekTime);
    }
  });
}

export function updateMediaMetadata(track: Track): void {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.channel,
    artwork: [
      { src: track.thumbnail, sizes: "120x90", type: "image/jpeg" },
      { src: track.thumbnail.replace("mqdefault", "hqdefault"), sizes: "480x360", type: "image/jpeg" },
    ],
  });
}

export function updatePlaybackState(state: "playing" | "paused" | "none"): void {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = state;
}

export function updatePositionState(
  duration: number,
  position: number,
  playbackRate = 1,
): void {
  if (!("mediaSession" in navigator)) return;
  if (duration > 0 && position >= 0 && position <= duration) {
    navigator.mediaSession.setPositionState({
      duration,
      position,
      playbackRate,
    });
  }
}

export function clearMediaSession(): void {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.setActionHandler("play", null);
  navigator.mediaSession.setActionHandler("pause", null);
  navigator.mediaSession.setActionHandler("previoustrack", null);
  navigator.mediaSession.setActionHandler("nexttrack", null);
  navigator.mediaSession.setActionHandler("seekbackward", null);
  navigator.mediaSession.setActionHandler("seekforward", null);
  navigator.mediaSession.setActionHandler("seekto", null);
}
