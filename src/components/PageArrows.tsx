/**
 * @component PageArrows
 * Fixed left/right arrow buttons for manual page turning.
 * Auto-hides at first/last page boundaries.
 */

import type { TurnDirection } from '@/types';

interface PageArrowsProps {
  /** Current page index. */
  current: number;
  /** Total pages. */
  total: number;
  /** Callback to trigger a page turn. */
  onTurn: (direction: TurnDirection) => void;
}

export function PageArrows({ current, total, onTurn }: PageArrowsProps) {
  return (
    <>
      <div
        className={`page-arrow${current === 0 ? ' hidden' : ''}`}
        id="prevArrow"
        onClick={() => onTurn(-1)}
      >
        ◂
      </div>
      <div
        className={`page-arrow${current === total - 1 ? ' hidden' : ''}`}
        id="nextArrow"
        onClick={() => onTurn(1)}
      >
        ▸
      </div>
    </>
  );
}
