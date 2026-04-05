/**
 * @component ArticlePage
 * Renders a newspaper-style article page with masthead, headline area,
 * and flexible content slot. Used for all feature articles.
 *
 * Content is passed as ReactNode, allowing different layout patterns
 * (flowing text with inline images, two-column text, etc.) per article.
 */

import { NewspaperMasthead } from './NewspaperMasthead';
import type { ArticlePageData } from '@/types';

interface ArticlePageProps {
  /** Article page data. */
  data: ArticlePageData;
}

export function ArticlePage({ data }: ArticlePageProps) {
  return (
    <div className="article-wrap">
      <NewspaperMasthead label={data.articleLabel} section="Features" />
      <div className="art-headline-area">
        <h2 className="art-headline">{data.headline}</h2>
        <p className="art-subhead">{data.subhead}</p>
        <div className="art-headline-rule" />
      </div>
      <div className="art-body">
        {data.content}
      </div>
    </div>
  );
}
