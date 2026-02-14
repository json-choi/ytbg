"use client";

import { useSyncExternalStore, useCallback } from "react";
import { audioManager } from "../audio-manager";
import type { Track, PlayerState } from "../types";

function subscribe(callback: () => void) {
  return audioManager.subscribe(() => callback());
}

function getSnapshot(): PlayerState {
  return audioManager.getState();
}

function getServerSnapshot(): PlayerState {
  return {
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
    error: null,
  };
}

export function usePlayer() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const playTrack = useCallback((track: Track, queue?: Track[], index?: number) => {
    audioManager.playTrack(track, queue, index);
  }, []);

  const playQueue = useCallback((tracks: Track[], startIndex?: number) => {
    audioManager.playQueue(tracks, startIndex);
  }, []);

  const togglePlay = useCallback(() => audioManager.togglePlay(), []);
  const playNext = useCallback(() => audioManager.playNext(), []);
  const playPrevious = useCallback(() => audioManager.playPrevious(), []);
  const seekTo = useCallback((time: number) => audioManager.seekTo(time), []);
  const setVolume = useCallback((v: number) => audioManager.setVolume(v), []);
  const toggleMute = useCallback(() => audioManager.toggleMute(), []);
  const toggleShuffle = useCallback(() => audioManager.setShuffle(!audioManager.getState().shuffle), []);
  const cycleRepeat = useCallback(() => audioManager.cycleRepeat(), []);
  const addToQueue = useCallback((t: Track) => audioManager.addToQueue(t), []);
  const removeFromQueue = useCallback((i: number) => audioManager.removeFromQueue(i), []);

  return {
    ...state,
    playTrack,
    playQueue,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    addToQueue,
    removeFromQueue,
  };
}
