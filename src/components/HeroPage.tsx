/**
 * @component HeroPage
 * Full-viewport landing page with YouTube video backdrop.
 * Uses the YouTube IFrame API with robust failure detection:
 *   - API script fails to load → fallback image
 *   - Player fires an error → fallback image
 *   - Player "ready" but never reaches PLAYING within timeout → fallback image
 *   - Overall timeout (API never initialises) → fallback image
 *
 * The iframe-only fallback is intentionally omitted because YouTube's
 * "sign in to confirm you're not a bot" wall renders inside the iframe
 * with no cross-origin way to detect it.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { HeroPageData, YouTubePlayer } from '@/types';

/** Max ms to wait for the API script + player to reach PLAYING. */
const API_LOAD_TIMEOUT = 6000;
/** Max ms after onReady to wait for the video to actually start playing. */
const PLAY_TIMEOUT = 4000;

interface HeroPageProps {
  data: HeroPageData;
  onPlayerReady?: (player: YouTubePlayer) => void;
}

export function HeroPage({ data, onPlayerReady }: HeroPageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const settled = useRef(false);
  const playTimer = useRef<ReturnType<typeof setTimeout>>();

  /** Lock in a result — either video is playing or we show the image. */
  const settle = useCallback(
    (success: boolean, player?: YouTubePlayer) => {
      if (settled.current) return;
      settled.current = true;
      clearTimeout(playTimer.current);

      if (success) {
        // Video is confirmed playing — hide the image
        if (fallbackRef.current) fallbackRef.current.style.display = 'none';
        if (player) onPlayerReady?.(player);
      } else {
        // YouTube failed — make sure image stays visible and remove player
        if (fallbackRef.current) fallbackRef.current.style.display = '';
        const wrap = wrapRef.current?.querySelector('#yt-player-wrap');
        if (wrap) wrap.innerHTML = '';
      }
    },
    [onPlayerReady],
  );

  useEffect(() => {
    const VID = data.youtubeVideoId;

    // Overall timeout — if nothing has settled by now, give up
    const globalTimeout = setTimeout(() => settle(false), API_LOAD_TIMEOUT);

    window.onYouTubeIframeAPIReady = () => {
      if (settled.current) return;

      const wrap = wrapRef.current?.querySelector('#yt-player-wrap');
      if (!wrap) { settle(false); return; }

      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-api-player';
      wrap.appendChild(playerDiv);

      new window.YT.Player('yt-api-player', {
        videoId: VID,
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, showinfo: 0,
          modestbranding: 1, rel: 0, loop: 1, playlist: VID,
          disablekb: 1, iv_load_policy: 3, playsinline: 1,
          fs: 0, cc_load_policy: 0, origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
            // The player is "ready" but that doesn't mean video is playing.
            // Start a timer — if we don't see PLAYING soon, it's blocked.
            playTimer.current = setTimeout(() => settle(false), PLAY_TIMEOUT);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              // Confirmed: video frames are actually rendering
              clearTimeout(globalTimeout);
              settle(true, e.target);
            } else if (e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
          },
          onError: () => {
            clearTimeout(globalTimeout);
            settle(false);
          },
        },
      });
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => { clearTimeout(globalTimeout); settle(false); };
    document.head.appendChild(tag);

    return () => {
      clearTimeout(globalTimeout);
      clearTimeout(playTimer.current);
    };
  }, [data.youtubeVideoId, settle]);

  return (
    <div className="hero-inner">
      <div className="video-wrap" ref={wrapRef}>
        <img
          ref={fallbackRef}
          src={data.fallbackImage}
          alt=""
          className="hero-fallback-img"
        />
        <div id="yt-player-wrap" />
      </div>
      <div className="hero-dim" />
      <div className="hero-grain" />
      <div className="hero-content">
        <p className="hero-date">Published for the Modding Community — Anno Domini MMXXVI</p>
        <hr className="hero-rule-top" />
        <h1 className="hero-masthead">Napoleon Empire Realism Ultimate</h1>
        <hr className="hero-rule-bot" />
        <div className="hero-subtitle-row">
          <span className="flourish">✦</span>
          <span className="hero-edition">A Napoleon: Total War Modification</span>
          <span className="flourish">✦</span>
        </div>
        <p className="hero-headline">
          Built on NER's core — engage battles at Napoleonic-era corps scale.
        </p>
        <a
          href={data.trailerUrl}
          className="btn"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: '1.5rem' }}
        >
          ▶&ensp;Watch Trailer
        </a>
      </div>
    </div>
  );
}
