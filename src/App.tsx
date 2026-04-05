/**
 * @component App
 * Root application component for the Napoleon Empire Realism Ultimate mod website.
 *
 * Orchestrates the page-turn newspaper system by:
 * - Rendering all pages inside PageShell wrappers
 * - Managing page navigation via usePageTurn hook
 * - Handling YouTube audio toggle state
 * - Applying hero/parchment color modes based on current page
 *
 * Architecture:
 * - Pages are data-driven via `src/data/pages.ts`
 * - To add a new article, add an entry to `src/data/articles.tsx`
 * - Page ordering is determined by the `pages` array
 */

import { useState, useEffect, useCallback } from 'react';
import { usePageTurn } from '@/hooks/usePageTurn';
import { pages } from '@/data/pages';
import { PageShell } from '@/components/PageShell';
import { HeroPage } from '@/components/HeroPage';
import { ArticlePage } from '@/components/ArticlePage';
import { DownloadPage } from '@/components/DownloadPage';
import { CreditsPage } from '@/components/CreditsPage';
import { PageNav } from '@/components/PageNav';
import { PageArrows } from '@/components/PageArrows';
import { AudioToggle } from '@/components/AudioToggle';
import type {
  PageData,
  HeroPageData,
  ArticlePageData,
  DownloadPageData,
  CreditsPageData,
  YouTubePlayer,
} from '@/types';

import '@/styles/global.css';

/** Renders the correct content component based on page type. */
function renderPageContent(
  page: PageData,
  onPlayerReady: (player: YouTubePlayer) => void
) {
  switch (page.type) {
    case 'hero':
      return <HeroPage data={page as HeroPageData} onPlayerReady={onPlayerReady} />;
    case 'article':
      return <ArticlePage data={page as ArticlePageData} />;
    case 'download':
      return <DownloadPage data={page as DownloadPageData} />;
    case 'credits':
      return <CreditsPage data={page as CreditsPageData} />;
  }
}

export default function App() {
  const { currentPage, turn, goToPage, pageRefs } = usePageTurn({
    totalPages: pages.length,
    animationDuration: 450,
    scrollThreshold: 40,
  });

  const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);
  const isOnHero = currentPage === 0;

  /** Apply body class for hero/parchment color mode. */
  useEffect(() => {
    document.body.classList.toggle('on-hero', isOnHero);
  }, [isOnHero]);

  /** Mute audio when leaving hero page. */
  useEffect(() => {
    if (!isOnHero && ytPlayer) {
      ytPlayer.mute();
    }
  }, [isOnHero, ytPlayer]);

  const handlePlayerReady = useCallback((player: YouTubePlayer) => {
    setYtPlayer(player);
  }, []);

  return (
    <>
      {/* Navigation UI */}
      <PageNav
        total={pages.length}
        current={currentPage}
        onNavigate={goToPage}
      />

      {isOnHero && (
        <div className="scroll-hint">Scroll to turn pages</div>
      )}

      <PageArrows
        current={currentPage}
        total={pages.length}
        onTurn={turn}
      />

      <AudioToggle
        player={ytPlayer}
        visible={isOnHero && ytPlayer !== null}
      />

      {/* Page Stage */}
      <div className="stage">
        {pages.map((page, i) => (
          <PageShell
            key={page.id}
            ref={(el) => { pageRefs.current[i] = el; }}
            isHero={page.type === 'hero'}
            pageNumber={page.pageNumber}
          >
            {renderPageContent(page, handlePlayerReady)}
          </PageShell>
        ))}
      </div>
    </>
  );
}
