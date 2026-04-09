import { NewspaperMasthead } from './NewspaperMasthead';
import type { FeaturesPageData } from '@/types';

interface FeaturesPageProps {
  data: FeaturesPageData;
}

export function FeaturesPage({ data }: FeaturesPageProps) {
  return (
    <div className="article-wrap">
      <NewspaperMasthead label="Features" section="Features" />
      <div className="art-body">
        {data.articles.map((article, i) => (
          <section key={i} className="features-section">
            {i > 0 && <div className="features-divider" />}
            <div className="art-headline-area">
              <h2 className="art-headline">{article.headline}</h2>
              <p className="art-subhead">{article.subhead}</p>
              <div className="art-headline-rule" />
            </div>
            <div className="features-section-body">
              {article.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
