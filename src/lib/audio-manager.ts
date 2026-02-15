import type { Track, PlayerState } from "./types";
import {
  setupMediaSession,
  updateMediaMetadata,
  updatePlaybackState,
  updatePositionState,
  clearMediaSession,
} from "./media-session";
import { addToHistory, getMp3, saveMp3 } from "./db";
import { convertToMp3 } from "./ytbg-api";

type Listener = (state: PlayerState) => void;

const BLOB_URL_CACHE = new Map<string, string>();

// Minimal silent WAV for unlocking audio on mobile
const SILENCE_DATA_URI =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private state: PlayerState = {
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    shuffle: false,
    repeat: "none",
    isLoading: false,
    downloadProgress: 0,
    error: null,
  };
  private shuffledIndices: number[] = [];
  private unlocked = false;
  private consecutiveErrors = 0;

  init(): void {
    if (typeof window === "undefined") return;
    if (this.audio) return;

    this.audio = new Audio();
    this.audio.preload = "auto";

    this.audio.addEventListener("timeupdate", () => {
      this.setState({
        currentTime: this.audio!.currentTime,
        duration: this.audio!.duration || 0,
      });
      updatePositionState(
        this.audio!.duration || 0,
        this.audio!.currentTime,
      );
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.setState({ duration: this.audio!.duration, isLoading: false });
    });

    this.audio.addEventListener("playing", () => {
      this.consecutiveErrors = 0;
      this.setState({ isPlaying: true, error: null });
      updatePlaybackState("playing");
    });

    this.audio.addEventListener("pause", () => {
      this.setState({ isPlaying: false });
      updatePlaybackState("paused");
    });

    this.audio.addEventListener("ended", () => {
      this.playNext();
    });

    this.audio.addEventListener("error", () => {
      this.consecutiveErrors++;
      if (this.consecutiveErrors >= 3) {
        this.consecutiveErrors = 0;
        this.setState({
          isLoading: false,
          error: "재생 실패 — 다음 곡으로 이동",
        });
        setTimeout(() => this.playNext(), 1000);
      } else {
        this.setState({
          isLoading: false,
          error: "탭하여 재생",
        });
      }
    });

    this.audio.addEventListener("waiting", () => {
      this.setState({ isLoading: true });
    });

    this.audio.addEventListener("canplay", () => {
      this.setState({ isLoading: false });
    });

    setupMediaSession({
      onPlay: () => this.play(),
      onPause: () => this.pause(),
      onPrevious: () => this.playPrevious(),
      onNext: () => this.playNext(),
      onSeekForward: () => this.seekRelative(10),
      onSeekBackward: () => this.seekRelative(-10),
      onSeekTo: (time) => this.seekTo(time),
    });

    this.setupUnlockListener();
  }

  private setupUnlockListener(): void {
    if (this.unlocked) return;

    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;

      if (this.audio) {
        const prevSrc = this.audio.src;
        this.audio.src = SILENCE_DATA_URI;
        this.audio.play().then(() => {
          this.audio!.pause();
          if (prevSrc && prevSrc !== SILENCE_DATA_URI) {
            this.audio!.src = prevSrc;
          }
        }).catch(() => {
          this.unlocked = false;
        });
      }

      document.removeEventListener("click", unlock, true);
      document.removeEventListener("touchend", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };

    document.addEventListener("click", unlock, true);
    document.addEventListener("touchend", unlock, true);
    document.addEventListener("keydown", unlock, true);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): PlayerState {
    return this.state;
  }

  private setState(partial: Partial<PlayerState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  private getBlobUrl(trackId: string, blob: Blob): string {
    // Revoke old URL if different blob
    const existing = BLOB_URL_CACHE.get(trackId);
    if (existing) return existing;

    const url = URL.createObjectURL(blob);
    BLOB_URL_CACHE.set(trackId, url);
    return url;
  }

  private async getOrDownloadMp3(track: Track): Promise<string> {
    // 1) Check IndexedDB cache
    const cached = BLOB_URL_CACHE.get(track.id);
    if (cached) return cached;

    const stored = await getMp3(track.id);
    if (stored) {
      return this.getBlobUrl(track.id, stored);
    }

    // 2) Download from ytbg-server
    const youtubeUrl = `https://www.youtube.com/watch?v=${track.id}`;
    this.setState({ downloadProgress: 0 });

    const result = await convertToMp3(youtubeUrl, (pct) => {
      this.setState({ downloadProgress: pct });
    });

    // Save to IndexedDB
    await saveMp3(track.id, result.blob);

    this.setState({ downloadProgress: 100 });
    return this.getBlobUrl(track.id, result.blob);
  }

  async playTrack(track: Track, queue?: Track[], queueIndex?: number): Promise<void> {
    if (!this.audio) this.init();

    this.setState({
      currentTrack: track,
      isLoading: true,
      downloadProgress: 0,
      error: null,
      ...(queue ? { queue, queueIndex: queueIndex ?? 0 } : {}),
    });

    updateMediaMetadata(track);

    try {
      // Unlock audio element in the current user gesture context
      if (!this.unlocked && this.audio) {
        this.audio.src = SILENCE_DATA_URI;
        try {
          await this.audio.play();
          this.audio.pause();
          this.unlocked = true;
        } catch { /* empty */ }
      }

      const blobUrl = await this.getOrDownloadMp3(track);
      this.audio!.src = blobUrl;
      await this.audio!.play();
      this.consecutiveErrors = 0;
      addToHistory(track).catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : "재생 실패";
      this.setState({ isLoading: false, isPlaying: false, downloadProgress: 0, error: msg || "탭하여 재생" });
    }
  }

  play(): void {
    if (!this.audio) return;
    this.audio.play().catch(() => {
      this.setState({ error: "탭하여 재생", isPlaying: false });
    });
  }

  retryPlay(): void {
    if (!this.audio) return;

    this.setState({ error: null, isLoading: true });

    if (this.state.currentTrack && (!this.audio.src || this.audio.src === SILENCE_DATA_URI)) {
      this.playTrack(this.state.currentTrack);
    } else {
      this.audio.play().then(() => {
        this.consecutiveErrors = 0;
        this.setState({ isLoading: false, error: null });
      }).catch(() => {
        this.setState({ isLoading: false, error: "탭하여 재생", isPlaying: false });
      });
    }
  }

  pause(): void {
    this.audio?.pause();
  }

  togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekTo(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  seekRelative(offset: number): void {
    if (this.audio) {
      this.audio.currentTime = Math.max(
        0,
        Math.min(this.audio.currentTime + offset, this.audio.duration || 0),
      );
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = volume;
      this.setState({ volume, isMuted: volume === 0 });
    }
  }

  toggleMute(): void {
    if (this.audio) {
      if (this.state.isMuted) {
        this.audio.volume = this.state.volume || 1;
        this.setState({ isMuted: false });
      } else {
        this.audio.volume = 0;
        this.setState({ isMuted: true });
      }
    }
  }

  setShuffle(shuffle: boolean): void {
    this.setState({ shuffle });
    if (shuffle) {
      this.shuffledIndices = Array.from(
        { length: this.state.queue.length },
        (_, i) => i,
      );
      for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.shuffledIndices[i], this.shuffledIndices[j]] = [
          this.shuffledIndices[j],
          this.shuffledIndices[i],
        ];
      }
    }
  }

  setRepeat(repeat: "none" | "all" | "one"): void {
    this.setState({ repeat });
  }

  cycleRepeat(): void {
    const modes: Array<"none" | "all" | "one"> = ["none", "all", "one"];
    const current = modes.indexOf(this.state.repeat);
    this.setRepeat(modes[(current + 1) % modes.length]);
  }

  private getNextIndex(): number {
    const { queue, queueIndex, shuffle, repeat } = this.state;
    if (queue.length === 0) return -1;

    if (repeat === "one") return queueIndex;

    if (shuffle) {
      const currentShufflePos = this.shuffledIndices.indexOf(queueIndex);
      const nextShufflePos = currentShufflePos + 1;
      if (nextShufflePos < this.shuffledIndices.length) {
        return this.shuffledIndices[nextShufflePos];
      }
      if (repeat === "all") {
        this.setShuffle(true);
        return this.shuffledIndices[0];
      }
      return -1;
    }

    const next = queueIndex + 1;
    if (next < queue.length) return next;
    if (repeat === "all") return 0;
    return -1;
  }

  private getPreviousIndex(): number {
    const { queue, queueIndex, shuffle } = this.state;
    if (queue.length === 0) return -1;

    if (shuffle) {
      const currentShufflePos = this.shuffledIndices.indexOf(queueIndex);
      return currentShufflePos > 0
        ? this.shuffledIndices[currentShufflePos - 1]
        : this.shuffledIndices[this.shuffledIndices.length - 1];
    }

    return queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
  }

  playNext(): void {
    const nextIndex = this.getNextIndex();
    if (nextIndex >= 0 && this.state.queue[nextIndex]) {
      this.setState({ queueIndex: nextIndex });
      this.playTrack(this.state.queue[nextIndex]);
    } else {
      this.pause();
      this.setState({ isPlaying: false });
      updatePlaybackState("none");
    }
  }

  playPrevious(): void {
    if (this.audio && this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    const prevIndex = this.getPreviousIndex();
    if (prevIndex >= 0 && this.state.queue[prevIndex]) {
      this.setState({ queueIndex: prevIndex });
      this.playTrack(this.state.queue[prevIndex]);
    }
  }

  playQueue(tracks: Track[], startIndex = 0): void {
    if (tracks.length === 0) return;
    this.setState({ queue: tracks, queueIndex: startIndex });
    if (this.state.shuffle) {
      this.setShuffle(true);
    }
    this.playTrack(tracks[startIndex], tracks, startIndex);
  }

  addToQueue(track: Track): void {
    this.setState({ queue: [...this.state.queue, track] });
  }

  removeFromQueue(index: number): void {
    const newQueue = [...this.state.queue];
    newQueue.splice(index, 1);
    let newIndex = this.state.queueIndex;
    if (index < newIndex) newIndex--;
    if (index === newIndex && newIndex >= newQueue.length) {
      newIndex = Math.max(0, newQueue.length - 1);
    }
    this.setState({ queue: newQueue, queueIndex: newIndex });
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    clearMediaSession();
    this.listeners.clear();
    // Revoke all blob URLs
    for (const url of BLOB_URL_CACHE.values()) {
      URL.revokeObjectURL(url);
    }
    BLOB_URL_CACHE.clear();
    this.unlocked = false;
    this.consecutiveErrors = 0;
  }
}

export const audioManager = new AudioManager();
