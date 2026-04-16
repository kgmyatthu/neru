import { NewspaperMasthead } from './NewspaperMasthead';
import type { FeaturesPageData } from '@/types';

interface FeaturesPageProps {
  data: FeaturesPageData;
  onNavigate?: (pageId: string) => void;
}

export function FeaturesPage({ data, onNavigate }: FeaturesPageProps) {
  return (
    <div className="article-wrap">
      <NewspaperMasthead label="Features" activePage="features" onNavigate={onNavigate} />
      <div className="art-body">
        <div className="features-grid">
          {data.articles.map((article, i) => (
            <section key={i} className="features-section">
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
