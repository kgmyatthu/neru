/**
 * @component PageNav
 * Horizontal dot navigation fixed at the bottom of the viewport.
 * Highlights the active page and supports click-to-navigate.
 * Shows scroll progress as a fill line between dots.
 */

import type { TurnDirection } from '@/types';

interface PageNavProps {
  /** Total number of pages. */
  total: number;
  /** Currently active page index. */
  current: number;
  /** Combined scroll progress toward next page (0 to 1). */
  scrollProgress: number;
  /** Scroll direction: 1 = forward, -1 = backward. */
  scrollDirection: TurnDirection;
  /** Callback when a dot is clicked. */
  onNavigate: (index: number) => void;
}

export function PageNav({ total, current, scrollProgress, scrollDirection, onNavigate }: PageNavProps) {
  return (
    <div className="page-nav-wrap">
    <div className="page-nav">
      {Array.from({ length: total }, (_, i) => {
        let lineFill = 0;
        if (i > 0 && scrollProgress > 0) {
          if (scrollDirection === 1 && i === current + 1) lineFill = scrollProgress;
          if (scrollDirection === -1 && i === current) lineFill = scrollProgress;
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
    </div>
  );
}
