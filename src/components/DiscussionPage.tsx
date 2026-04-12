/**
 * @component DiscussionPage
 * Renders a discussion/comments page powered by Giscus (GitHub Discussions).
 * Users authenticate via GitHub to leave comments.
 */

import { useEffect, useRef, useState } from 'react';
import { NewspaperMasthead } from './NewspaperMasthead';
import type { DiscussionPageData } from '@/types';

interface DiscussionPageProps {
  data: DiscussionPageData;
}

export function DiscussionPage({ data }: DiscussionPageProps) {
  const giscusRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (loaded.current || !giscusRef.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', data.repo);
    script.setAttribute('data-repo-id', data.repoId);
    script.setAttribute('data-category', data.category);
    script.setAttribute('data-category-id', data.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', 'General Discussion');
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'gruvbox');
    script.setAttribute('data-lang', 'en');
    script.crossOrigin = 'anonymous';
    script.async = true;

    giscusRef.current.appendChild(script);
  }, [data]);

  return (
    <div className="article-wrap">
      <NewspaperMasthead label="Discussion" section="Community Forum" />
      <div className="art-headline-area">
        <h2 className="art-headline">Discussion</h2>
        <p className="art-subhead">Join the conversation — sign in with GitHub to comment</p>
        <div className="art-headline-rule" />
      </div>
      <div
        className={`art-body discussion-body${interactive ? ' interactive' : ''}`}
        ref={giscusRef}
        onClick={() => setInteractive(true)}
        onMouseLeave={() => setInteractive(false)}
      />
    </div>
  );
}
