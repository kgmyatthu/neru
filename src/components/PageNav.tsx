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
  /** Scroll progress toward next page turn: -1..0..1. */
  scrollProgress: number;
  /** Callback when a dot is clicked. */
  onNavigate: (index: number) => void;
}

export function PageNav({ total, current, scrollProgress, onNavigate }: PageNavProps) {
  return (
    <div className="page-nav">
      {Array.from({ length: total }, (_, i) => {
        // The line between dot i-1 and dot i
        // Fill forward: line after current dot (between current and current+1) → index i === current + 1
        // Fill backward: line before current dot (between current-1 and current) → index i === current
        let lineFill = 0;
        if (i > 0) {
          if (scrollProgress > 0 && i === current + 1) {
            lineFill = scrollProgress;
          } else if (scrollProgress < 0 && i === current) {
            lineFill = -scrollProgress;
          }
        }

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {i > 0 && (
              <div className="dot-line">
                {lineFill > 0 && (
                  <div
                    className="dot-line-fill"
                    style={{ width: `${lineFill * 100}%` }}
                  />
                )}
              </div>
            )}
            <div
              className={`dot${i === current ? ' active' : ''}`}
              onClick={() => onNavigate(i)}
            />
          </div>
        );
      })}
    </div>
  );
}
