/**
 * @module pages
 * Assembles the complete ordered page list from content modules.
 * The page order here determines the order in the newspaper.
 */

import { articles } from './articles';
import { creditEntries } from './credits';
import { installSteps, installNote } from './install';
import type { PageData } from '@/types';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Builds the full page array. Call once at module level. */
export function buildPages(): PageData[] {
  const pages: PageData[] = [];

  // Hero
  pages.push({
    id: 'hero',
    type: 'hero',
    pageNumber: '— I —',
    youtubeVideoId: 'Z89n5qGeuUw',
    fallbackImage: 'images/hero-fallback.jpg',
    backdropVideo: 'videos/backdrop.mp4',
    trailerUrl: 'https://www.youtube.com/watch?v=Z89n5qGeuUw',
  });

  // Articles
  articles.forEach((article, i) => {
    pages.push({
      ...article,
      id: `article-${i}`,
      type: 'article',
      pageNumber: `— ${ROMAN[i + 1]} —`,
    });
  });

  // Download
  pages.push({
    id: 'download',
    type: 'download',
    pageNumber: `— ${ROMAN[articles.length + 1]} —`,
    downloadUrl: 'https://www.nexusmods.com/napoleontotalwar/mods/16?tab=files',
    version: 'v1.0',
    fileSize: 'approx. 2.4 GB',
    steps: installSteps,
    note: installNote,
  });

  // Discussion
  pages.push({
    id: 'discussion',
    type: 'discussion',
    pageNumber: `— ${ROMAN[articles.length + 2]} —`,
    repo: 'kgmyatthu/neru',
    repoId: 'R_kgDOR6kjRQ',
    category: 'General',
    categoryId: 'DIC_kwDOR6kjRc4C6axI',
  });

  // Credits
  pages.push({
    id: 'credits',
    type: 'credits',
    pageNumber: `— ${ROMAN[articles.length + 3]} —`,
    entries: creditEntries,
  });

  return pages;
}

export const pages = buildPages();
