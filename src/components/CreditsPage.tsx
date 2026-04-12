/**
 * @component CreditsPage
 * Renders the credits/acknowledgements page with a two-column layout.
 * Contributor names with URLs render as clickable links.
 */

import { NewspaperMasthead } from './NewspaperMasthead';
import type { CreditsPageData } from '@/types';

interface CreditsPageProps {
  data: CreditsPageData;
}

export function CreditsPage({ data }: CreditsPageProps) {
  return (
    <div className="article-wrap">
      <NewspaperMasthead label="Credits" section="Acknowledgements" />
      <div className="art-headline-area">
        <h2 className="art-headline">Credits & Acknowledgements</h2>
        <p className="art-subhead">The persons responsible for this endeavour</p>
        <div className="art-headline-rule" />
      </div>
      <div className="credit-columns">
        {data.entries.map((entry) => (
          <div className="credit-entry" key={entry.name}>
            <span className="name">
              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  {entry.name}
                </a>
              ) : (
                entry.name
              )}
            </span>
            <span className="role">{entry.role}</span>
          </div>
        ))}
      </div>
      <div className="finis">
        <span className="end-mark">— FINIS —</span>
        <p>
          Fan-made modification for Napoleon: Total War.
          <br />
          Not affiliated with Creative Assembly or SEGA.
        </p>
      </div>
    </div>
  );
}
