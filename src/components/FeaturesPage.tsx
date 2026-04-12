import { NewspaperMasthead } from './NewspaperMasthead';
import type { FeaturesPageData } from '@/types';

interface FeaturesPageProps {
  data: FeaturesPageData;
}

/** Articles at these indices span the full row for visual variety. */
const WIDE_INDICES = new Set([0, 3]);

export function FeaturesPage({ data }: FeaturesPageProps) {
  return (
    <div className="article-wrap">
      <NewspaperMasthead label="Features" section="Features" />
      <div className="art-body">
        <div className="features-grid">
          {data.articles.map((article, i) => (
            <section
              key={i}
              className={`features-section${WIDE_INDICES.has(i) ? ' wide' : ''}`}
            >
              <div className="art-headline-area">
                <h2 className="art-headline">{article.headline}</h2>
                <p className="art-subhead">{article.subhead}</p>
              </div>
              <div className="features-section-body">
                {article.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
