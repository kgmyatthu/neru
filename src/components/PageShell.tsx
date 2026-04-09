/**
 * @component PageShell
 * Structural wrapper for each page in the newspaper.
 * Provides the 3D transform surface (front/back faces) and visual
 * elements needed for the page-turn animation.
 *
 * Hero pages render without the parchment paper styling.
 * All other pages get the paper texture, film grain, and vignette.
 *
 * @example
 * ```tsx
 * <PageShell isHero={false} pageNumber="— II —" ref={pageRef}>
 *   <ArticlePage data={articleData} />
 * </PageShell>
 * ```
 */

import { forwardRef, type ReactNode } from 'react';

interface PageShellProps {
  /** Page content to render on the front face. */
  children: ReactNode;
  /** Whether this is the hero page (no paper styling). */
  isHero: boolean;
  /** Roman numeral page number displayed at the bottom. */
  pageNumber: string;
}

export const PageShell = forwardRef<HTMLDivElement, PageShellProps>(
  function PageShell({ children, isHero, pageNumber }, ref) {
    return (
      <div
        ref={ref}
        className={`page${isHero ? '' : ' page-paper'}`}
      >
        <div className="page-front">
          {children}
        </div>
        <div className="page-back" />
        <div className="page-curl-highlight" />
      </div>
    );
  }
);
