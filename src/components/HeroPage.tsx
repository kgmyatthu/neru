/**
 * @component HeroPage
 * Full-viewport landing page with YouTube video backdrop.
 * Implements a three-tier fallback: YouTube API → iframe → static image.
 *
 * The video plays muted and looped as a background element.
 * Audio can be toggled via the AudioToggle component.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { HeroPageData, YouTubePlayer } from '@/types';

interface HeroPageProps {
  /** Hero page data. */
  data: HeroPageData;
  /** Callback to expose the YouTube player for audio control. */
  onPlayerReady?: (player: YouTubePlayer) => void;
}

export function HeroPage({ data, onPlayerReady }: HeroPageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const resolvedRef = useRef(false);
  const fallbackRef = useRef<HTMLImageElement>(null);

  const hideImage = useCallback(() => {
    if (fallbackRef.current) fallbackRef.current.style.display = 'none';
  }, []);

  /** Fallback tier 2: plain iframe embed. */
  const tryIframe = useCallback(() => {
    if (resolvedRef.current || !wrapRef.current) return;
    resolvedRef.current = true;
    const wrap = wrapRef.current.querySelector('#yt-player-wrap');
    if (!wrap) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${data.youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${data.youtubeVideoId}&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3&playsinline=1`;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.style.cssText = 'width:100%;height:100%;pointer-events:none';
    wrap.appendChild(iframe);

    iframe.addEventListener('load', hideImage);
    setTimeout(hideImage, 4000);
  }, [data.youtubeVideoId, hideImage]);

  /** Initialise YouTube API on mount. */
  useEffect(() => {
    const VID = data.youtubeVideoId;

    const timeout = setTimeout(() => {
      if (!resolvedRef.current) tryIframe();
    }, 5000);

    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      if (resolvedRef.current) return;

      const wrap = wrapRef.current?.querySelector('#yt-player-wrap');
      if (!wrap) return;

      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-api-player';
      wrap.appendChild(playerDiv);

      new window.YT.Player('yt-api-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId: VID,
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, showinfo: 0,
          modestbranding: 1, rel: 0, loop: 1, playlist: VID,
          disablekb: 1, iv_load_policy: 3, playsinline: 1,
          fs: 0, cc_load_policy: 0, origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            resolvedRef.current = true;
            e.target.mute();
            e.target.playVideo();
            hideImage();
            onPlayerReady?.(e.target);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
          },
          onError: () => {
            playerDiv.remove();
            tryIframe();
          },
        },
      });
    };

    // Load API script (nocookie variant avoids "sign in" bot-check walls)
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube-nocookie.com/iframe_api';
    tag.onerror = () => tryIframe();
    document.head.appendChild(tag);

    return () => clearTimeout(timeout);
  }, [data.youtubeVideoId, hideImage, tryIframe, onPlayerReady]);

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
