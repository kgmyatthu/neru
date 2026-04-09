/**
 * @module types
 * Core type definitions for the NERU mod website.
 */

import type { ReactNode } from 'react';

// ─── Page System ────────────────────────────────────────────

/** Discriminated union for page types used in the page-turn system. */
export type PageType = 'hero' | 'article' | 'download' | 'credits' | 'discussion';

/** Base page definition shared across all page types. */
export interface BasePage {
  /** Unique identifier for the page. */
  id: string;
  /** Page type determines which component renders the content. */
  type: PageType;
  /** Roman numeral displayed at the bottom of the page. */
  pageNumber: string;
  /** URL path for this page (e.g., "/", "/article1"). */
  path: string;
}

/** Hero/landing page with video backdrop. */
export interface HeroPageData extends BasePage {
  type: 'hero';
  /** YouTube video ID for the backdrop. */
  youtubeVideoId: string;
  /** Path to the static fallback image. */
  fallbackImage: string;
  /** Path to self-hosted backdrop video (MP4). */
  backdropVideo: string;
  /** YouTube trailer URL for the "Watch Trailer" button. */
  trailerUrl: string;
}

/** Article/feature page with newspaper-style layout. */
export interface ArticlePageData extends BasePage {
  type: 'article';
  /** Article number label (e.g., "Article I"). */
  articleLabel: string;
  /** Main headline text. */
  headline: string;
  /** Subheadline text beneath the headline. */
  subhead: string;
  /** Article body content as React nodes for flexible layouts. */
  content: ReactNode;
}

/** Download/installation instructions page. */
export interface DownloadPageData extends BasePage {
  type: 'download';
  /** Google Drive download URL. */
  downloadUrl: string;
  /** Version string (e.g., "v1.0"). */
  version: string;
  /** Approximate file size string. */
  fileSize: string;
  /** Installation steps. */
  steps: InstallStep[];
  /** Warning/note text. */
  note: string;
}

/** Credits/acknowledgements page. */
export interface CreditsPageData extends BasePage {
  type: 'credits';
  /** List of credit entries. */
  entries: CreditEntry[];
}

/** Discussion/comments page powered by Giscus (GitHub Discussions). */
export interface DiscussionPageData extends BasePage {
  type: 'discussion';
  /** GitHub repository in "owner/repo" format. */
  repo: string;
  /** GitHub Discussions category ID (from Giscus setup). */
  repoId: string;
  /** Category name for discussions. */
  category: string;
  /** Category ID for discussions. */
  categoryId: string;
}

/** Union of all page data types. */
export type PageData = HeroPageData | ArticlePageData | DownloadPageData | CreditsPageData | DiscussionPageData;

// ─── Content Primitives ─────────────────────────────────────

/** A single installation step. */
export interface InstallStep {
  /** Roman numeral label (e.g., "I."). */
  numeral: string;
  /** Step instruction content as React node (supports inline code). */
  content: ReactNode;
}

/** A single credit entry. */
export interface CreditEntry {
  /** Display name of the contributor/mod. */
  name: string;
  /** Role or contribution description. */
  role: string;
  /** Optional external URL (e.g., ModDB page). */
  url?: string;
}

/** Inline figure props for images embedded in article text. */
export interface InlineFigureProps {
  /** Image source path. */
  src: string;
  /** Alt text for accessibility. */
  alt: string;
  /** Caption text beneath the image. */
  caption: string;
  /** Float direction within the text flow. */
  float?: 'left' | 'right';
  /** Optional width override (CSS value). */
  width?: string;
}

// ─── Page Turn System ───────────────────────────────────────

/** Direction of a page turn. */
export type TurnDirection = 1 | -1;

/** State managed by the usePageTurn hook. */
export interface PageTurnState {
  /** Index of the currently visible page. */
  currentPage: number;
  /** Whether a turn animation is in progress. */
  isAnimating: boolean;
  /** Total number of pages. */
  totalPages: number;
}

/** Actions exposed by the usePageTurn hook. */
export interface PageTurnActions {
  /** Turn to the next or previous page. */
  turn: (direction: TurnDirection) => void;
  /** Jump directly to a specific page index. */
  goToPage: (index: number) => void;
}

// ─── YouTube Player ─────────────────────────────────────────

/** Simplified YouTube player interface for audio control. */
export interface YouTubePlayer {
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  playVideo: () => void;
  seekTo: (seconds: number) => void;
}

/** Global YouTube API types. */
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          host?: string;
          videoId: string;
          playerVars: Record<string, number | string>;
          events: Record<string, (event: { target: YouTubePlayer; data?: number }) => void>;
        }
      ) => YouTubePlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
