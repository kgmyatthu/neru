/**
 * @component DiscussionPage
 * Renders a discussion/comments page powered by Giscus (GitHub Discussions).
 * Users authenticate via GitHub to leave comments.
 */

import { useEffect, useRef } from 'react';
import type { DiscussionPageData } from '@/types';

interface DiscussionPageProps {
  data: DiscussionPageData;
}

export function DiscussionPage({ data }: DiscussionPageProps) {
  const giscusRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

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
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'gruvbox');
    script.setAttribute('data-lang', 'en');
    script.crossOrigin = 'anonymous';
    script.async = true;

    giscusRef.current.appendChild(script);
  }, [data]);

  return (
    <div className="util-page">
      <div className="util-masthead">
        <div className="paper-name">Napoleon Empire Realism Ultimate</div>
        <div className="page-date">Community Forum</div>
      </div>
      <div className="section-head">
        <h2>Discussion</h2>
        <p className="dek">Join the conversation &mdash; sign in with GitHub to comment</p>
        <hr className="thin-rule" />
      </div>
      <div className="discussion-body" ref={giscusRef} />
    </div>
  );
}
