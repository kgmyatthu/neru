/**
 * @component App
 * Root application component for the Napoleon Empire Realism Ultimate mod website.
 *
 * Orchestrates the page-turn newspaper system by:
 * - Rendering all pages inside PageShell wrappers
 * - Managing page navigation via usePageTurn hook
 * - Applying hero/parchment color modes based on current page
 *
 * Architecture:
 * - Pages are data-driven via `src/data/pages.ts`
 * - To add a new article, add an entry to `src/data/articles.tsx`
 * - Page ordering is determined by the `pages` array
 */

import { useEffect, useMemo, useCallback } from 'react';
import { usePageTurn } from '@/hooks/usePageTurn';
import { pages } from '@/data/pages';
import { PageShell } from '@/components/PageShell';
import { HeroPage } from '@/components/HeroPage';
import { ArticlePage } from '@/components/ArticlePage';
import { FeaturesPage } from '@/components/FeaturesPage';
import { DownloadPage } from '@/components/DownloadPage';
import { CreditsPage } from '@/components/CreditsPage';
import { DiscussionPage } from '@/components/DiscussionPage';
import { PageNav } from '@/components/PageNav';
import { PageArrows } from '@/components/PageArrows';
import type {
  PageData,
  HeroPageData,
  ArticlePageData,
  FeaturesPageData,
  DownloadPageData,
  CreditsPageData,
  DiscussionPageData,
} from '@/types';

import '@/styles/global.css';

/** Renders the correct content component based on page type. */
function renderPageContent(page: PageData, onNavigate?: (pageId: string) => void) {
  switch (page.type) {
    case 'hero':
      return <HeroPage data={page as HeroPageData} onNavigate={onNavigate} />;
    case 'article':
      return <ArticlePage data={page as ArticlePageData} />;
    case 'features':
      return <FeaturesPage data={page as FeaturesPageData} />;
    case 'download':
      return <DownloadPage data={page as DownloadPageData} />;
    case 'credits':
      return <CreditsPage data={page as CreditsPageData} />;
    case 'discussion':
      return <DiscussionPage data={page as DiscussionPageData} />;
  }
}

/** Resolve initial page index from the current URL path. */
function getInitialPage(): number {
  const path = window.location.pathname;
  const idx = pages.findIndex((p) => p.path === path);
  return idx >= 0 ? idx : 0;
}

export default function App() {
  const initialPage = useMemo(getInitialPage, []);

  const { currentPage, scrollProgress, scrollDirection, turn, goToPage, pageRefs } = usePageTurn({
    totalPages: pages.length,
    initialPage,
    animationDuration: 450,
    scrollThreshold: 100,
  });

  const isOnHero = currentPage === 0;

  /** Navigate to a page by its id (e.g., 'download', 'discussion'). */
  const navigateById = useCallback((pageId: string) => {
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx >= 0) goToPage(idx);
  }, [goToPage]);

  /** Sync URL when page changes. */
  useEffect(() => {
    const targetPath = pages[currentPage].path;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [currentPage]);

  /** Handle browser back/forward navigation. */
  useEffect(() => {
    const handlePopState = () => {
      const idx = pages.findIndex((p) => p.path === window.location.pathname);
      if (idx >= 0 && idx !== currentPage) {
        goToPage(idx);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage, goToPage]);

  /** Apply body class for hero/parchment color mode. */
  useEffect(() => {
    document.body.classList.toggle('on-hero', isOnHero);
  }, [isOnHero]);

  return (
    <>
      {/* Navigation UI */}
      <PageNav
        total={pages.length}
        current={currentPage}
        scrollProgress={scrollProgress}
        scrollDirection={scrollDirection}
        onNavigate={goToPage}
      />

      <PageArrows
        current={currentPage}
        total={pages.length}
        onTurn={turn}
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
            {renderPageContent(page, navigateById)}
          </PageShell>
        ))}
      </div>
    </>
  );
}
