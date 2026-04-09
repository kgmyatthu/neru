/**
 * @module usePageTurn
 * Custom hook that manages horizontal page-turning with 3D paper-warp animation.
 *
 * Captures vertical scroll, touch swipe, and keyboard input to trigger
 * horizontal page turns with configurable animation duration and easing.
 *
 * @example
 * ```tsx
 * const { currentPage, isAnimating, turn, goToPage } = usePageTurn({
 *   totalPages: 8,
 *   animationDuration: 450,
 *   scrollThreshold: 40,
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TurnDirection } from '@/types';

interface UsePageTurnConfig {
  /** Total number of pages in the newspaper. */
  totalPages: number;
  /** Initial page index to start on (0-based). */
  initialPage?: number;
  /** Duration of the turn animation in milliseconds. */
  animationDuration?: number;
  /** Scroll delta threshold to trigger a page turn. */
  scrollThreshold?: number;
  /** Touch swipe distance threshold in pixels. */
  swipeThreshold?: number;
}

interface UsePageTurnReturn {
  /** Currently visible page index (0-based). */
  currentPage: number;
  /** Whether a page turn animation is currently playing. */
  isAnimating: boolean;
  /** Combined scroll progress toward next page turn (0 to 1). */
  scrollProgress: number;
  /** Current scroll direction: 1 = forward, -1 = backward. */
  scrollDirection: TurnDirection;
  /** Trigger a page turn in the given direction. */
  turn: (direction: TurnDirection) => void;
  /** Jump directly to a page index (no animation). */
  goToPage: (index: number) => void;
  /** Ref to attach to the page container for scroll capture. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Refs array for individual page elements. */
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

/** Default animation configuration. */
const DEFAULTS = {
  animationDuration: 450,
  scrollThreshold: 40,
  swipeThreshold: 30,
} as const;

export function usePageTurn(config: UsePageTurnConfig): UsePageTurnReturn {
  const {
    totalPages,
    initialPage = 0,
    animationDuration = DEFAULTS.animationDuration,
    scrollThreshold = DEFAULTS.scrollThreshold,
    swipeThreshold = DEFAULTS.swipeThreshold,
  } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<TurnDirection>(1);
  const scrollAccumRef = useRef(0);
  const boundaryAccumRef = useRef(0);
  const boundaryPassedRef = useRef(false);
  const touchStartRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animatingRef = useRef(false);
  const currentRef = useRef(initialPage);

  /** Synchronise refs with state for use in animation frames. */
  useEffect(() => {
    currentRef.current = currentPage;
  }, [currentPage]);

  /**
   * Applies the visual stack ordering to all pages.
   * Pages before current are rotated away, current is on top, rest underneath.
   */
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

  /**
   * Animates a page turn with 3D paper-warp effect.
   * Uses requestAnimationFrame for smooth 60fps animation.
   */
  const turn = useCallback((direction: TurnDirection) => {
    if (animatingRef.current) return;
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
      const ease = 1 - Math.pow(1 - t, 3); // fast ease-out

      const rotY = direction === 1 ? -180 * ease : -180 + 180 * ease;
      const bend = Math.sin(ease * Math.PI) * 6;
      const skew = Math.sin(ease * Math.PI) * (direction === 1 ? 2.5 : -2.5);
      const scaleX = 1 - Math.sin(ease * Math.PI) * 0.035;

      pageEl.style.transform =
        `rotateY(${rotY}deg) rotateX(${bend * 0.3}deg) skewY(${skew}deg) scaleX(${scaleX})`;

      // Fold highlight
      const highlight = pageEl.querySelector('.page-curl-highlight') as HTMLElement | null;
      if (highlight) {
        const p = direction === 1 ? ease * 100 : (1 - ease) * 100;
        highlight.style.background = `linear-gradient(90deg,transparent ${Math.max(0, p - 30)}%,rgba(255,255,255,0.04) ${p - 10}%,rgba(255,255,255,0.18) ${p}%,rgba(0,0,0,0.06) ${p + 5}%,transparent ${Math.min(100, p + 25)}%)`;
        highlight.style.opacity = Math.sin(ease * Math.PI) > 0.1 ? '1' : '0';
      }

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

  /** Jump directly to a page without animation. */
  const goToPage = useCallback((index: number) => {
    if (animatingRef.current || index === currentRef.current) return;
    const clamped = Math.max(0, Math.min(index, totalPages - 1));
    currentRef.current = clamped;
    setCurrentPage(clamped);
    setScrollProgress(0);
    stackPages(clamped);
  }, [totalPages, stackPages]);

  /** Initialise page stack on mount. */
  useEffect(() => {
    stackPages(initialPage);
  }, [stackPages]);

  /** Wheel event handler — scrolls inner content first, then turns pages. */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animatingRef.current) return;

      const dir: TurnDirection = e.deltaY > 0 ? 1 : -1;
      setScrollDirection(dir);

      // Check for scrollable inner content
      const activePage = pageRefs.current[currentRef.current];
      const scrollEl = activePage?.querySelector('.art-body') as HTMLElement | null;
      const hasScrollable = scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 5;

      if (hasScrollable) {
        const atTop = scrollEl.scrollTop <= 1;
        const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
        if (e.deltaY > 0 && !atBottom) {
          scrollEl.scrollTop += e.deltaY;
          scrollAccumRef.current = 0;
          boundaryAccumRef.current = 0;
          boundaryPassedRef.current = false;
          setScrollProgress(0);
          return;
        }
        if (e.deltaY < 0 && !atTop) {
          scrollEl.scrollTop += e.deltaY;
          scrollAccumRef.current = 0;
          boundaryAccumRef.current = 0;
          boundaryPassedRef.current = false;
          setScrollProgress(0);
          return;
        }
        // At boundary — accumulate before allowing page turn
        if (!boundaryPassedRef.current) {
          boundaryAccumRef.current += Math.abs(e.deltaY);
          setScrollProgress(Math.min(0.6, (boundaryAccumRef.current / 180) * 0.6));
          if (boundaryAccumRef.current < 180) return;
          boundaryPassedRef.current = true;
          scrollAccumRef.current = 0;
          return;
        }
      }

      scrollAccumRef.current += e.deltaY;
      const baseProgress = hasScrollable ? 0.6 : 0;
      const range = hasScrollable ? 0.4 : 1;
      setScrollProgress(
        baseProgress + Math.min(range, (Math.abs(scrollAccumRef.current) / scrollThreshold) * range),
      );

      if (scrollAccumRef.current > scrollThreshold) {
        scrollAccumRef.current = 0;
        setScrollProgress(0);
        turn(1);
      } else if (scrollAccumRef.current < -scrollThreshold) {
        scrollAccumRef.current = 0;
        setScrollProgress(0);
        turn(-1);
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [turn, scrollThreshold]);

  /** Touch event handlers for mobile swipe — scrolls inner content first. */
  useEffect(() => {
    let touchScrollEl: HTMLElement | null = null;
    let touchConsumed = false;
    let touchBoundaryAccum = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
      touchConsumed = false;
      touchBoundaryAccum = 0;
      setScrollProgress(0);

      // Check if the active page has a scrollable .art-body
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
      const delta = touchStartRef.current - currentY; // positive = finger moving up
      const dir: TurnDirection = delta > 0 ? 1 : -1;
      setScrollDirection(dir);

      // No scrollable content — show progress toward page turn
      if (!touchScrollEl) {
        setScrollProgress(Math.min(1, Math.abs(delta) / (swipeThreshold * 3)));
        return;
      }

      const atTop = touchScrollEl.scrollTop <= 1;
      const atBottom =
        touchScrollEl.scrollTop + touchScrollEl.clientHeight >=
        touchScrollEl.scrollHeight - 1;

      // If there's room to scroll in the swipe direction, scroll the content
      if ((delta > 0 && !atBottom) || (delta < 0 && !atTop)) {
        touchConsumed = true;
        touchBoundaryAccum = 0;
        touchScrollEl.scrollTop += delta * 2.5;
        touchStartRef.current = currentY;
        setScrollProgress(0);
      } else if (touchScrollEl) {
        // At boundary — accumulate extra swipe distance before allowing page turn
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
      if (animatingRef.current) return;

      // If the touch was consumed by scrolling content, don't turn
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

  /** Keyboard arrow key handlers. */
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
