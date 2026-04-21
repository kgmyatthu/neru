/**
 * @module usePageTurn
 * Custom hook that manages horizontal page-turning with 3D paper-warp animation.
 *
 * Wheel input drives the page transform *directly* from scroll accumulation:
 * once the boundary buffer is exhausted, each wheel event advances the page's
 * visible rotation by a proportional amount. On release (no wheel events for a
 * short window) the page snaps to whichever endpoint is nearer — if it's past
 * halfway, it completes the turn; otherwise it snaps back. Keyboard and touch
 * input still go through a classic timed animation path.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TurnDirection } from '@/types';

interface UsePageTurnConfig {
  /** Total number of pages in the newspaper. */
  totalPages: number;
  /** Initial page index to start on (0-based). */
  initialPage?: number;
  /** Duration of the keyboard/touch turn animation in milliseconds. */
  animationDuration?: number;
  /** Scroll delta threshold to trigger a page turn via keyboard path (legacy). */
  scrollThreshold?: number;
  /** Touch swipe distance threshold in pixels. */
  swipeThreshold?: number;
}

interface UsePageTurnReturn {
  currentPage: number;
  isAnimating: boolean;
  scrollProgress: number;
  scrollDirection: TurnDirection;
  turn: (direction: TurnDirection) => void;
  goToPage: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

const DEFAULTS = {
  animationDuration: 450,
  scrollThreshold: 40,
  swipeThreshold: 30,
} as const;

/** Scroll distance (accumulated absolute deltaY) at boundary before the page starts turning. */
const BOUNDARY_THRESHOLD = 180;
/** Scroll distance (post-boundary) required to drive the page fully from 0% to 100% turn. */
const TURN_COMMIT_DISTANCE = 320;
/** Duration of the release-snap animation (complete or back). */
const SNAP_DURATION = 220;
/** Idle time after last wheel event before snap fires. */
const RELEASE_TIMEOUT_MS = 140;

/**
 * Applies the 3D paper-warp transform corresponding to a given turn progress.
 * `t` runs 0..1 where 0 = page at rest, 1 = page fully turned.
 */
function applyTurnTransform(pageEl: HTMLElement, direction: TurnDirection, t: number) {
  const rotY = direction === 1 ? -180 * t : -180 + 180 * t;
  const bend = Math.sin(t * Math.PI) * 6;
  const skew = Math.sin(t * Math.PI) * (direction === 1 ? 2.5 : -2.5);
  const scaleX = 1 - Math.sin(t * Math.PI) * 0.035;

  pageEl.style.transform =
    `rotateY(${rotY}deg) rotateX(${bend * 0.3}deg) skewY(${skew}deg) scaleX(${scaleX})`;

  const highlight = pageEl.querySelector('.page-curl-highlight') as HTMLElement | null;
  if (highlight) {
    const p = direction === 1 ? t * 100 : (1 - t) * 100;
    highlight.style.background = `linear-gradient(90deg,transparent ${Math.max(0, p - 30)}%,rgba(255,255,255,0.04) ${p - 10}%,rgba(255,255,255,0.18) ${p}%,rgba(0,0,0,0.06) ${p + 5}%,transparent ${Math.min(100, p + 25)}%)`;
    highlight.style.opacity = Math.sin(t * Math.PI) > 0.1 ? '1' : '0';
  }
}

export function usePageTurn(config: UsePageTurnConfig): UsePageTurnReturn {
  const {
    totalPages,
    initialPage = 0,
    animationDuration = DEFAULTS.animationDuration,
    swipeThreshold = DEFAULTS.swipeThreshold,
  } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<TurnDirection>(1);

  // Boundary + scroll-turn state
  const boundaryAccumRef = useRef(0);
  const boundaryPassedRef = useRef(false);
  const scrollTurnProgressRef = useRef(0);
  const scrollTurnDirectionRef = useRef<TurnDirection>(1);
  const scrollTurnPageElRef = useRef<HTMLElement | null>(null);
  const scrollTurningRef = useRef(false);
  const releaseTimerRef = useRef<number | null>(null);

  // Touch state
  const touchStartRef = useRef(0);

  // Shared refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animatingRef = useRef(false);
  const currentRef = useRef(initialPage);

  useEffect(() => {
    currentRef.current = currentPage;
  }, [currentPage]);

  /** Stack pages into their resting positions (pre-turn current, post-turn rest). */
  const stackPages = useCallback((targetPage: number) => {
    pageRefs.current.forEach((el, i) => {
      if (!el) return;
      el.classList.remove('active', 'turning');
      el.style.transition = '';
      if (i < targetPage) {
        el.style.transform = 'rotateY(-180deg)';
        el.style.zIndex = String(i);
        el.style.opacity = '0';
      } else if (i === targetPage) {
        el.classList.add('active');
        el.style.transform = 'rotateY(0deg)';
        el.style.zIndex = String(totalPages + 1);
        el.style.opacity = '1';
      } else {
        el.style.transform = 'rotateY(0deg)';
        el.style.zIndex = String(totalPages - i);
        el.style.opacity = '1';
      }
    });
  }, [totalPages]);

  /** Discrete timed turn (keyboard, touch swipe commit, click). */
  const turn = useCallback((direction: TurnDirection) => {
    if (animatingRef.current || scrollTurningRef.current) return;
    const current = currentRef.current;
    if (direction === 1 && current >= totalPages - 1) return;
    if (direction === -1 && current <= 0) return;

    animatingRef.current = true;
    setIsAnimating(true);
    setScrollProgress(0);

    const pageEl = direction === 1
      ? pageRefs.current[current]
      : pageRefs.current[current - 1];

    if (!pageEl) return;

    pageEl.classList.add('turning');
    pageEl.style.zIndex = String(totalPages + 10);
    if (direction === -1) pageEl.style.opacity = '1';

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / animationDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      applyTurnTransform(pageEl, direction, ease);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        pageEl.classList.remove('turning');
        const newPage = current + direction;
        currentRef.current = newPage;
        setCurrentPage(newPage);
        stackPages(newPage);
        animatingRef.current = false;
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [totalPages, animationDuration, stackPages]);

  const goToPage = useCallback((index: number) => {
    if (animatingRef.current || scrollTurningRef.current || index === currentRef.current) return;
    const clamped = Math.max(0, Math.min(index, totalPages - 1));
    currentRef.current = clamped;
    setCurrentPage(clamped);
    setScrollProgress(0);
    stackPages(clamped);
  }, [totalPages, stackPages]);

  useEffect(() => {
    stackPages(initialPage);
  }, [stackPages]);

  /** Scroll-driven page turn logic — applied to every wheel event past the boundary. */
  useEffect(() => {
    /** Clear the release-snap timer if armed. */
    const clearReleaseTimer = () => {
      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
    };

    /** Reset everything related to scroll-driven turning. */
    const resetTurnState = () => {
      clearReleaseTimer();
      boundaryAccumRef.current = 0;
      boundaryPassedRef.current = false;
      scrollTurnProgressRef.current = 0;
      scrollTurningRef.current = false;
      scrollTurnPageElRef.current = null;
      setScrollProgress(0);
    };

    /** Transition from boundary-buffer into visible turning; returns false if turn is impossible. */
    const beginScrollTurn = (direction: TurnDirection): boolean => {
      const current = currentRef.current;
      if (direction === 1 && current >= totalPages - 1) return false;
      if (direction === -1 && current <= 0) return false;

      const pageEl = direction === 1
        ? pageRefs.current[current]
        : pageRefs.current[current - 1];
      if (!pageEl) return false;

      pageEl.classList.add('turning');
      pageEl.style.transition = '';
      pageEl.style.zIndex = String(totalPages + 10);
      if (direction === -1) pageEl.style.opacity = '1';

      scrollTurnPageElRef.current = pageEl;
      scrollTurnDirectionRef.current = direction;
      scrollTurnProgressRef.current = 0;
      scrollTurningRef.current = true;
      applyTurnTransform(pageEl, direction, 0);
      return true;
    };

    /** Finalize a committed turn: swap current page and reset. */
    const commitTurn = () => {
      const pageEl = scrollTurnPageElRef.current;
      const direction = scrollTurnDirectionRef.current;
      if (!pageEl) { resetTurnState(); return; }

      clearReleaseTimer();
      pageEl.classList.remove('turning');
      const newPage = currentRef.current + direction;
      currentRef.current = newPage;
      setCurrentPage(newPage);
      stackPages(newPage);
      scrollTurnPageElRef.current = null;
      scrollTurningRef.current = false;
      scrollTurnProgressRef.current = 0;
      boundaryAccumRef.current = 0;
      boundaryPassedRef.current = false;
      setScrollProgress(0);
    };

    /** Abandon a partial turn and restore the stack. */
    const cancelTurn = () => {
      clearReleaseTimer();
      const pageEl = scrollTurnPageElRef.current;
      if (pageEl) {
        pageEl.classList.remove('turning');
      }
      stackPages(currentRef.current);
      scrollTurnPageElRef.current = null;
      scrollTurningRef.current = false;
      scrollTurnProgressRef.current = 0;
      boundaryAccumRef.current = 0;
      boundaryPassedRef.current = false;
      setScrollProgress(0);
    };

    /** Animate the remaining progress to 1 on release past halfway. */
    const snapToComplete = () => {
      const pageEl = scrollTurnPageElRef.current;
      const direction = scrollTurnDirectionRef.current;
      if (!pageEl) return;
      const startT = scrollTurnProgressRef.current;
      const startTime = performance.now();
      const step = () => {
        if (!scrollTurnPageElRef.current) return;
        const elapsed = performance.now() - startTime;
        const raw = Math.min(elapsed / SNAP_DURATION, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        const t = startT + (1 - startT) * eased;
        scrollTurnProgressRef.current = t;
        applyTurnTransform(pageEl, direction, t);
        setScrollProgress(0.6 + t * 0.4);
        if (raw < 1) {
          requestAnimationFrame(step);
        } else {
          commitTurn();
        }
      };
      requestAnimationFrame(step);
    };

    /** Animate the progress back to 0 on release before halfway. */
    const snapBack = () => {
      const pageEl = scrollTurnPageElRef.current;
      const direction = scrollTurnDirectionRef.current;
      if (!pageEl) return;
      const startT = scrollTurnProgressRef.current;
      const startTime = performance.now();
      const step = () => {
        if (!scrollTurnPageElRef.current) return;
        const elapsed = performance.now() - startTime;
        const raw = Math.min(elapsed / SNAP_DURATION, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        const t = startT * (1 - eased);
        scrollTurnProgressRef.current = t;
        applyTurnTransform(pageEl, direction, t);
        setScrollProgress(0.6 + t * 0.4);
        if (raw < 1) {
          requestAnimationFrame(step);
        } else {
          cancelTurn();
        }
      };
      requestAnimationFrame(step);
    };

    /** Arm the release snap — runs once the user stops scrolling briefly. */
    const armReleaseSnap = () => {
      clearReleaseTimer();
      releaseTimerRef.current = window.setTimeout(() => {
        releaseTimerRef.current = null;
        if (!scrollTurnPageElRef.current) return;
        if (scrollTurnProgressRef.current >= 0.5) {
          snapToComplete();
        } else {
          snapBack();
        }
      }, RELEASE_TIMEOUT_MS);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animatingRef.current) return;

      const dir: TurnDirection = e.deltaY > 0 ? 1 : -1;
      setScrollDirection(dir);

      // --- 1. Inner content scrolling takes priority (only when NOT already scroll-turning) ---
      if (!scrollTurningRef.current) {
        const activePage = pageRefs.current[currentRef.current];
        const scrollEl = activePage?.querySelector('.art-body') as HTMLElement | null;
        const hasScrollable = scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 5;

        if (hasScrollable) {
          const atTop = scrollEl.scrollTop <= 1;
          const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
          if (e.deltaY > 0 && !atBottom) {
            scrollEl.scrollTop += e.deltaY;
            resetTurnState();
            return;
          }
          if (e.deltaY < 0 && !atTop) {
            scrollEl.scrollTop += e.deltaY;
            resetTurnState();
            return;
          }
        }
      }

      // --- 2. Boundary buffer ---
      if (!boundaryPassedRef.current) {
        boundaryAccumRef.current += Math.abs(e.deltaY);
        setScrollProgress(Math.min(0.6, (boundaryAccumRef.current / BOUNDARY_THRESHOLD) * 0.6));
        if (boundaryAccumRef.current < BOUNDARY_THRESHOLD) return;

        // Crossed boundary — enter scroll-turning phase
        const excess = boundaryAccumRef.current - BOUNDARY_THRESHOLD;
        boundaryPassedRef.current = true;
        if (!beginScrollTurn(dir)) {
          // Edge of book — hold at 0.6 progress bar, stay buffered
          resetTurnState();
          return;
        }
        // Apply any excess scroll from this event toward turn progress
        scrollTurnProgressRef.current = Math.max(0, Math.min(1, excess / TURN_COMMIT_DISTANCE));
        const pageEl = scrollTurnPageElRef.current!;
        applyTurnTransform(pageEl, dir, scrollTurnProgressRef.current);
        setScrollProgress(0.6 + scrollTurnProgressRef.current * 0.4);
        if (scrollTurnProgressRef.current >= 1) {
          commitTurn();
        } else {
          armReleaseSnap();
        }
        return;
      }

      // --- 3. Scroll-driven turning phase ---
      if (scrollTurningRef.current) {
        const pageEl = scrollTurnPageElRef.current;
        const turnDir = scrollTurnDirectionRef.current;
        if (!pageEl) { resetTurnState(); return; }

        // Scrolling in the turn direction advances progress; opposite reduces it.
        const advance = (e.deltaY * turnDir) / TURN_COMMIT_DISTANCE;
        scrollTurnProgressRef.current = Math.max(0, Math.min(1, scrollTurnProgressRef.current + advance));

        applyTurnTransform(pageEl, turnDir, scrollTurnProgressRef.current);
        setScrollProgress(0.6 + scrollTurnProgressRef.current * 0.4);

        if (scrollTurnProgressRef.current >= 1) {
          commitTurn();
          return;
        }
        if (scrollTurnProgressRef.current <= 0 && advance < 0) {
          cancelTurn();
          return;
        }
        armReleaseSnap();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
      clearReleaseTimer();
    };
  }, [totalPages, stackPages]);

  /** Touch swipe — unchanged classic path. */
  useEffect(() => {
    let touchScrollEl: HTMLElement | null = null;
    let touchConsumed = false;
    let touchBoundaryAccum = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
      touchConsumed = false;
      touchBoundaryAccum = 0;
      setScrollProgress(0);

      const activePage = pageRefs.current[currentRef.current];
      const scrollEl = activePage?.querySelector('.art-body') as HTMLElement | null;
      if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 5) {
        touchScrollEl = scrollEl;
      } else {
        touchScrollEl = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const delta = touchStartRef.current - currentY;
      const dir: TurnDirection = delta > 0 ? 1 : -1;
      setScrollDirection(dir);

      if (!touchScrollEl) {
        setScrollProgress(Math.min(1, Math.abs(delta) / (swipeThreshold * 3)));
        return;
      }

      const atTop = touchScrollEl.scrollTop <= 1;
      const atBottom =
        touchScrollEl.scrollTop + touchScrollEl.clientHeight >=
        touchScrollEl.scrollHeight - 1;

      if ((delta > 0 && !atBottom) || (delta < 0 && !atTop)) {
        touchConsumed = true;
        touchBoundaryAccum = 0;
        touchScrollEl.scrollTop += delta * 2.5;
        touchStartRef.current = currentY;
        setScrollProgress(0);
      } else if (touchScrollEl) {
        touchBoundaryAccum += Math.abs(delta);
        if (touchBoundaryAccum < 180) {
          touchStartRef.current = currentY;
          touchConsumed = true;
          setScrollProgress(Math.min(0.6, (touchBoundaryAccum / 180) * 0.6));
        } else {
          touchConsumed = false;
          setScrollProgress(0.6 + Math.min(0.4, ((touchBoundaryAccum - 180) / 100) * 0.4));
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setScrollProgress(0);
      if (animatingRef.current || scrollTurningRef.current) return;
      if (touchConsumed) return;

      const delta = touchStartRef.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) > swipeThreshold) {
        turn(delta > 0 ? 1 : -1);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [turn, swipeThreshold]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') turn(1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') turn(-1);
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [turn]);

  return {
    currentPage,
    isAnimating,
    scrollProgress,
    scrollDirection,
    turn,
    goToPage,
    containerRef,
    pageRefs,
  };
}
