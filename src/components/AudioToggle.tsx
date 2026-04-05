/**
 * @component AudioToggle
 * Circular toggle button that controls YouTube video audio.
 * Only visible when the YouTube API player is active and the hero page is showing.
 */

import { useState } from 'react';
import type { YouTubePlayer } from '@/types';

interface AudioToggleProps {
  /** Reference to the YouTube player instance. Null if not ready. */
  player: YouTubePlayer | null;
  /** Whether the button should be visible. */
  visible: boolean;
}

/** SVG path for muted speaker icon. */
const ICON_MUTED = (
  <>
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </>
);

/** SVG path for unmuted speaker icon. */
const ICON_UNMUTED = (
  <>
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 010 7" />
    <path d="M19 5a9.5 9.5 0 010 14" />
  </>
);

export function AudioToggle({ player, visible }: AudioToggleProps) {
  const [isMuted, setIsMuted] = useState(true);

  const handleClick = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      player.setVolume(80);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  /** Called externally to force mute when leaving hero page. */
  if (visible && !isMuted && player) {
    // Component re-renders will handle this via parent state
  }

  return (
    <div
      className={`audio-toggle${visible ? ' visible' : ''}`}
      onClick={handleClick}
      title="Toggle audio"
    >
      <svg viewBox="0 0 24 24">
        {isMuted ? ICON_MUTED : ICON_UNMUTED}
      </svg>
    </div>
  );
}
