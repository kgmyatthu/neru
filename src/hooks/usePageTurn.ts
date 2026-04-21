/**
 * @module usePageTurn
 * Custom hook that manages horizontal page-turning with 3D paper-warp animation.
 *
 * Wheel input sets a *target* turn progress (0..1); a requestAnimationFrame loop
 * smoothly lerps the rendered progress toward that target each frame, so the
 * visible rotation is fluid and granular regardless of how chunky the wheel's
 * delta values are. The page holds its rotation between inputs — no auto-snap.
 * Forward scroll brings target to 1 → commit; reverse scroll brings it to 0 →
 * cancel. Keyboard/click turns still use the classic timed animation path.
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

/** Scroll distance (accumulated abs(deltaY)) at content's edge before the page starts turning. */
const BOUNDARY_THRESHOLD = 180;
/** Scroll distance past the boundary that drives the page from 0% to 100% turn. */
const TURN_COMMIT_DISTANCE = 320;
/** Smoothing time-constant in ms — visible progress catches up to target with this characteristic time. */
const SMOOTHING_TAU_MS = 75;
/** Convergence epsilon — below this, visible snaps to target and the RAF loop can exit. */
const CONVERGE_EPSILON = 0.0008;

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
  /** Target turn progress (0..1) set by wheel events. */
  const targetProgressRef = useRef(0);
  /** Rendered/visible turn progress (0..1) lerped each frame. */
  const visibleProgressRef = useRef(0);
  const scrollTurnDirectionRef = useRef<TurnDirection>(1);
  const scrollTurnPageElRef = useRef<HTMLElement | null>(null);
  const scrollTurningRef = useRef(false);
  /** Set true when user has reversed back to target=0 — triggers cancel after visible catches up. */
  const cancelPendingRef = useRef(false);

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

  /** Forget a partial scroll-turn and restore the stack to the current page. */
  const abortScrollTurn = useCallback(() => {
    const pageEl = scrollTurnPageElRef.current;
    if (pageEl) pageEl.classList.remove('turning');
    scrollTurnPageElRef.current = null;
    scrollTurningRef.current = false;
    targetProgressRef.current = 0;
    visibleProgressRef.current = 0;
    cancelPendingRef.current = false;
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

  /** Scroll-driven turn: wheel events move the target; RAF lerps visible toward target. */
  useEffect(() => {
    let rafId: number | null = null;
    let lastTickTs = 0;

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
      targetProgressRef.current = 0;
      visibleProgressRef.current = 0;
      cancelPendingRef.current = false;
      scrollTurningRef.current = true;
      applyTurnTransform(pageEl, direction, 0);
      return true;
    };

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
      targetProgressRef.current = 0;
      visibleProgressRef.current = 0;
      cancelPendingRef.current = false;
      boundaryAccumRef.current = 0;
      boundaryPassedRef.current = false;
      setScrollProgress(0);
    };

    const cancelTurn = () => {
      const pageEl = scrollTurnPageElRef.current;
      if (pageEl) pageEl.classList.remove('turning');
      stackPages(currentRef.current);
      scrollTurnPageElRef.current = null;
      scrollTurningRef.current = false;
      targetProgressRef.current = 0;
      visibleProgressRef.current = 0;
      cancelPendingRef.current = false;
      boundaryAccumRef.current = 0;
      boundaryPassedRef.current = false;
      setScrollProgress(0);
    };

    /** One frame of smoothing: lerp visible toward target; apply transform; settle or schedule next. */
    const tick = (ts: number) => {
      const dt = lastTickTs === 0 ? 16 : Math.min(50, ts - lastTickTs);
      lastTickTs = ts;

      const pageEl = scrollTurnPageElRef.current;
      if (!pageEl) {
        rafId = null;
        lastTickTs = 0;
        return;
      }
      const dir = scrollTurnDirectionRef.current;
      const visible = visibleProgressRef.current;
      const target = targetProgressRef.current;
      const diff = target - visible;

      if (Math.abs(diff) < CONVERGE_EPSILON) {
        // Converged. Snap exactly and decide what to do next.
        visibleProgressRef.current = target;
        applyTurnTransform(pageEl, dir, target);
        setScrollProgress(0.6 + target * 0.4);

        if (target >= 1) {
          commitTurn();
          rafId = null;
          lastTickTs = 0;
          return;
        }
        if (target <= 0 && cancelPendingRef.current) {
          cancelPendingRef.current = false;
          cancelTurn();
          rafId = null;
          lastTickTs = 0;
          return;
        }
        // Settled mid-turn — stop the RAF loop, wait for the next wheel event.
        rafId = null;
        lastTickTs = 0;
        return;
      }

      // Frame-rate-independent exponential approach.
      const alpha = 1 - Math.exp(-dt / SMOOTHING_TAU_MS);
      const nextVisible = visible + diff * alpha;
      visibleProgressRef.current = nextVisible;
      applyTurnTransform(pageEl, dir, nextVisible);
      setScrollProgress(0.6 + nextVisible * 0.4);

      rafId = requestAnimationFrame(tick);
    };

    const ensureTicking = () => {
      if (rafId !== null) return;
      lastTickTs = 0;
      rafId = requestAnimationFrame(tick);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animatingRef.current) return;

      const dir: TurnDirection = e.deltaY > 0 ? 1 : -1;
      setScrollDirection(dir);

      // 1. Inner content scroll takes priority (only when not already turning)
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

      // 2. Boundary buffer — require intent before starting the visual turn
      if (!boundaryPassedRef.current) {
        boundaryAccumRef.current += Math.abs(e.deltaY);
        setScrollProgress(Math.min(0.6, (boundaryAccumRef.current / BOUNDARY_THRESHOLD) * 0.6));
        if (boundaryAccumRef.current < BOUNDARY_THRESHOLD) return;

        const excess = boundaryAccumRef.current - BOUNDARY_THRESHOLD;
        boundaryPassedRef.current = true;
        if (!beginScrollTurn(dir)) {
          boundaryAccumRef.current = 0;
          boundaryPassedRef.current = false;
          setScrollProgress(0);
          return;
        }
        targetProgressRef.current = Math.min(1, excess / TURN_COMMIT_DISTANCE);
        ensureTicking();
        return;
      }

      // 3. Scroll-driven turning — wheel moves target, tick renders
      if (scrollTurningRef.current) {
        const turnDir = scrollTurnDirectionRef.current;
        const advance = (e.deltaY * turnDir) / TURN_COMMIT_DISTANCE;
        const proposed = targetProgressRef.current + advance;

        if (proposed <= 0 && advance < 0) {
          targetProgressRef.current = 0;
          cancelPendingRef.current = true;
        } else {
          targetProgressRef.current = Math.max(0, Math.min(1, proposed));
          // Only clear cancel-pending if user started moving forward again
          if (advance > 0) cancelPendingRef.current = false;
        }
        ensureTicking();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
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
