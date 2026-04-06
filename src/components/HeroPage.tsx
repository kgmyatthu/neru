/**
 * @component HeroPage
 * Full-viewport landing page with video backdrop.
 *
 * Fallback hierarchy:
 *   1. YouTube IFrame API — best quality, zero hosting cost
 *   2. Static fallback image — shown immediately while…
 *   3. Self-hosted MP4 loads in the background — swaps in once ready
 *
 * If YouTube succeeds, the MP4 never loads.
 * If YouTube fails (bot-check, network, timeout), the user sees the image
 * until the MP4 is buffered enough to play, then it fades in.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { HeroPageData } from '@/types';

const API_LOAD_TIMEOUT = 6000;
const PLAY_TIMEOUT = 4000;

interface HeroPageProps {
  data: HeroPageData;
}

export function HeroPage({ data }: HeroPageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const settled = useRef(false);
  const playTimer = useRef<ReturnType<typeof setTimeout>>();

  /** Start loading the self-hosted MP4 and swap it in when ready. */
  const startSelfHostedVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      video.play().then(() => {
        video.style.opacity = '1';
        if (fallbackRef.current) fallbackRef.current.style.display = 'none';
      }).catch(() => {
        // autoplay blocked — keep showing image
      });
    };

    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.src = data.backdropVideo;
    video.load();
  }, [data.backdropVideo]);

  /** Settle: YouTube succeeded or failed. */
  const settle = useCallback(
    (ytSuccess: boolean) => {
      if (settled.current) return;
      settled.current = true;
      clearTimeout(playTimer.current);

      if (ytSuccess) {
        // YouTube is playing — hide image, don't bother with MP4
        if (fallbackRef.current) fallbackRef.current.style.display = 'none';
      } else {
        // YouTube failed — clean up its DOM, keep image, start MP4 download
        if (fallbackRef.current) fallbackRef.current.style.display = '';
        const wrap = wrapRef.current?.querySelector('#yt-player-wrap');
        if (wrap) wrap.innerHTML = '';
        startSelfHostedVideo();
      }
    },
    [startSelfHostedVideo],
  );

  useEffect(() => {
    const VID = data.youtubeVideoId;

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
            playTimer.current = setTimeout(() => settle(false), PLAY_TIMEOUT);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              clearTimeout(globalTimeout);
              settle(true);
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
        <video
          ref={videoRef}
          className="hero-selfhosted-video"
          muted
          loop
          playsInline
          preload="none"
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
