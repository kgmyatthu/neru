/**
 * @module usePageTurn
 * Custom hook that manages horizontal page-turning with 3D paper-warp animation.
 *
 * Wheel input drives the page transform *directly* from scroll accumulation:
 * once the boundary buffer is exhausted, each wheel event advances the page's
 * rotation by a proportional amount. The page stays at whatever angle the user
 * has scrolled it to — there is no auto-snap. Forward scroll completes the
 * turn when progress reaches 1; reverse scroll cancels it when progress
 * returns to 0. Keyboard/click-driven turns still use the classic timed path.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TurnDirection } from '@/types';

interface UsePageTurnConfig {
  /** Total number of pages in the newspaper. */
  totalPages: number;
  /** Initial page index to start on (0-based). */
  initialPage?: number;
  /** Duration of the keyboard/click turn animation in milliseconds. */
  animationDuration?: number;
  /** Legacy — kept for API compatibility. */
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
  swipeThreshold: 30,
} as const;

/** Scroll distance (accumulated absolute deltaY) at content's edge before the page starts turning. */
const BOUNDARY_THRESHOLD = 180;
/** Scroll distance past the boundary to drive the page fully from 0% to 100% turn. */
const TURN_COMMIT_DISTANCE = 320;

/** Applies the 3D paper-warp transform for a given turn progress (0..1). */
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

  /** Stack pages into their resting positions. */
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

  /** Abort any partial scroll-driven turn and restore the stack to the current page. */
  const abortScrollTurn = useCallback(() => {
    const pageEl = scrollTurnPageElRef.current;
    if (pageEl) pageEl.classList.remove('turning');
    scrollTurnPageElRef.current = null;
    scrollTurningRef.current = false;
    scrollTurnProgressRef.current = 0;
    boundaryAccumRef.current = 0;
    boundaryPassedRef.current = false;
    stackPages(currentRef.current);
    setScrollProgress(0);
  }, [stackPages]);

  /** Discrete timed turn (keyboard, click, touch swipe commit). */
  const turn = useCallback((direction: TurnDirection) => {
    if (animatingRef.current) return;
    if (scrollTurningRef.current) abortScrollTurn();

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
  }, [totalPages, animationDuration, stackPages, abortScrollTurn]);

  const goToPage = useCallback((index: number) => {
    if (animatingRef.current) return;
    if (scrollTurningRef.current) abortScrollTurn();
    if (index === currentRef.current) return;

    const clamped = Math.max(0, Math.min(index, totalPages - 1));
    currentRef.current = clamped;
    setCurrentPage(clamped);
    setScrollProgress(0);
    stackPages(clamped);
  }, [totalPages, stackPages, abortScrollTurn]);

  useEffect(() => {
    stackPages(initialPage);
  }, [stackPages]);

  /** Scroll-driven page turn: transform is updated in real time by wheel deltaY. */
  useEffect(() => {
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

    /** Finalize a committed turn — swap current page and reset. */
    const commitTurn = () => {
      const pageEl = scrollTurnPageElRef.current;
      const direction = scrollTurnDirectionRef.current;
      if (!pageEl) return;

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

    /** Abandon a partial turn on reverse-to-zero. */
    const cancelTurn = () => {
      const pageEl = scrollTurnPageElRef.current;
      if (pageEl) pageEl.classList.remove('turning');
      stackPages(currentRef.current);
      scrollTurnPageElRef.current = null;
      scrollTurningRef.current = false;
      scrollTurnProgressRef.current = 0;
      boundaryAccumRef.current = 0;
      boundaryPassedRef.current = false;
      setScrollProgress(0);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animatingRef.current) return;

      const dir: TurnDirection = e.deltaY > 0 ? 1 : -1;
      setScrollDirection(dir);

      // 1. Inner content scroll priority (only when not already turning)
      if (!scrollTurningRef.current) {
        const activePage = pageRefs.current[currentRef.current];
        const scrollEl = activePage?.querySelector('.art-body') as HTMLElement | null;
        const hasScrollable = scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 5;

        if (hasScrollable) {
          const atTop = scrollEl.scrollTop <= 1;
          const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
          if (e.deltaY > 0 && !atBottom) {
            scrollEl.scrollTop += e.deltaY;
            boundaryAccumRef.current = 0;
            boundaryPassedRef.current = false;
            setScrollProgress(0);
            return;
          }
          if (e.deltaY < 0 && !atTop) {
            scrollEl.scrollTop += e.deltaY;
            boundaryAccumRef.current = 0;
            boundaryPassedRef.current = false;
            setScrollProgress(0);
            return;
          }
        }
      }

      // 2. Boundary buffer — wait until the user has clearly pushed past the edge
      if (!boundaryPassedRef.current) {
        boundaryAccumRef.current += Math.abs(e.deltaY);
        setScrollProgress(Math.min(0.6, (boundaryAccumRef.current / BOUNDARY_THRESHOLD) * 0.6));
        if (boundaryAccumRef.current < BOUNDARY_THRESHOLD) return;

        // Boundary crossed — begin scroll-driven turning and apply any excess
        const excess = boundaryAccumRef.current - BOUNDARY_THRESHOLD;
        boundaryPassedRef.current = true;
        if (!beginScrollTurn(dir)) {
          // Can't turn (edge of book) — back out of the boundary state
          boundaryAccumRef.current = 0;
          boundaryPassedRef.current = false;
          setScrollProgress(0);
          return;
        }
        const newProg = Math.max(0, Math.min(1, excess / TURN_COMMIT_DISTANCE));
        scrollTurnProgressRef.current = newProg;
        applyTurnTransform(scrollTurnPageElRef.current!, dir, newProg);
        setScrollProgress(0.6 + newProg * 0.4);
        if (newProg >= 1) commitTurn();
        return;
      }

      // 3. Scroll-driven turning phase — every wheel event moves the page directly
      if (scrollTurningRef.current) {
        const pageEl = scrollTurnPageElRef.current;
        const turnDir = scrollTurnDirectionRef.current;
        if (!pageEl) return;

        const advance = (e.deltaY * turnDir) / TURN_COMMIT_DISTANCE;
        const next = Math.max(0, Math.min(1, scrollTurnProgressRef.current + advance));
        scrollTurnProgressRef.current = next;

        applyTurnTransform(pageEl, turnDir, next);
        setScrollProgress(0.6 + next * 0.4);

        if (next >= 1) {
          commitTurn();
          return;
        }
        if (next <= 0 && advance < 0) {
          cancelTurn();
        }
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [totalPages, stackPages]);

  /** Touch swipe — classic swipe-commit path. */
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
