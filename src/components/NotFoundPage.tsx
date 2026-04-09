import { NewspaperMasthead } from './NewspaperMasthead';

interface NotFoundPageProps {
  path: string;
  onGoHome: () => void;
}

export function NotFoundPage({ path, onGoHome }: NotFoundPageProps) {
  return (
    <div className="article-wrap">
      <NewspaperMasthead section="Notice" />
      <div className="art-headline-area">
        <h2 className="art-headline">404 — Page Not Found</h2>
        <p className="art-subhead">
          The address <em>{path}</em> does not correspond to any known dispatch
        </p>
        <div className="art-headline-rule" />
      </div>
      <div className="art-body not-found-body">
        <p>
          We regret to inform the reader that the requested page could not be
          located within these archives. It may have been removed, renamed, or
          perhaps never existed at all.
        </p>
        <button className="btn" onClick={onGoHome}>
          Return to the Front Page
        </button>
      </div>
    </div>
  );
}
