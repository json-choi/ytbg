"use client";

import { useEffect, useState } from "react";
import { audioManager } from "@/lib/audio-manager";
import { getSetting, setSetting } from "@/lib/db";
import { MiniPlayer } from "./MiniPlayer";
import { FullPlayer } from "./FullPlayer";
import { usePlayer } from "@/lib/hooks/usePlayer";

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const { currentTrack, volume } = usePlayer();

  useEffect(() => {
    audioManager.init();

    getSetting<number>("volume", 1).then((v) => {
      audioManager.setVolume(v);
    });

    return () => {};
  }, []);

  useEffect(() => {
    if (volume !== undefined) {
      setSetting("volume", volume);
    }
  }, [volume]);

  // Toggle mini player space CSS variable so main content adjusts padding
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--mini-player-space",
      currentTrack ? "72px" : "0px",
    );
    return () => {
      document.documentElement.style.setProperty("--mini-player-space", "0px");
    };
  }, [currentTrack]);

  return (
    <>
      {children}
      {currentTrack && <MiniPlayer onExpand={() => setExpanded(true)} />}
      {expanded && currentTrack && (
        <FullPlayer onCollapse={() => setExpanded(false)} />
      )}
    </>
  );
}
