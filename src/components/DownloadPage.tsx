/**
 * @component DownloadPage
 * Renders the installation instructions page with numbered steps,
 * a warning note, and a download button linking to Google Drive.
 */

import type { DownloadPageData } from '@/types';

interface DownloadPageProps {
  data: DownloadPageData;
}

export function DownloadPage({ data }: DownloadPageProps) {
  return (
    <div className="util-page">
      <div className="util-masthead">
        <div className="paper-name">Napoleon Empire Realism Ultimate</div>
        <div className="page-date">Acquisition &amp; Deployment</div>
      </div>
      <div className="section-head">
        <h2>Instructions for Installation</h2>
        <p className="dek">A brief guide to acquiring &amp; deploying the modification</p>
        <hr className="thin-rule" />
      </div>
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
        <span className="dl-meta">
          {data.version} · {data.fileSize}
        </span>
      </div>
    </div>
  );
}
