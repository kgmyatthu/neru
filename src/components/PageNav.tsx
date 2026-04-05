/**
 * @component PageNav
 * Horizontal dot navigation fixed at the bottom of the viewport.
 * Highlights the active page and supports click-to-navigate.
 */

interface PageNavProps {
  /** Total number of pages. */
  total: number;
  /** Currently active page index. */
  current: number;
  /** Callback when a dot is clicked. */
  onNavigate: (index: number) => void;
}

export function PageNav({ total, current, onNavigate }: PageNavProps) {
  return (
    <div className="page-nav">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {i > 0 && <div className="dot-line" />}
          <div
            className={`dot${i === current ? ' active' : ''}`}
            onClick={() => onNavigate(i)}
          />
        </div>
      ))}
    </div>
  );
}
