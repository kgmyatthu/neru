/**
 * @component DownloadPage
 * Renders the installation instructions page with numbered steps,
 * a warning note, and a download button linking to Google Drive.
 */

import { NewspaperMasthead } from './NewspaperMasthead';
import type { DownloadPageData } from '@/types';

interface DownloadPageProps {
  data: DownloadPageData;
  onNavigate?: (pageId: string) => void;
}

export function DownloadPage({ data, onNavigate }: DownloadPageProps) {
  return (
    <div className="article-wrap">
      <NewspaperMasthead label="Installation" activePage="download" onNavigate={onNavigate} />
      <div className="art-headline-area">
        <h2 className="art-headline">Instructions for Installation</h2>
        <p className="art-subhead">A brief guide to acquiring & deploying the modification</p>
        <div className="art-headline-rule" />
      </div>
      <div className="art-body">
        <ol className="steps">
          {data.steps.map((step) => (
            <li key={step.numeral}>
              <span className="num">{step.numeral}</span>
              <div className="step-text">{step.content}</div>
            </li>
          ))}
        </ol>
        <p className="note">{data.note}</p>
        <div className="dl-row">
          <a
            href={data.downloadUrl}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            ↓&ensp;Download
          </a>
          <a
            href="https://discord.gg/zvvFHtxx"
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            🎮&ensp;Join Discord
          </a>
          <span className="dl-meta">
            {data.version} · {data.fileSize}
          </span>
        </div>
      </div>
    </div>
  );
}
