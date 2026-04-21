/**
 * @module usePageTurn
 * Custom hook that manages horizontal page transitions with a microfilm-advance
 * animation: the outgoing page slides off in the direction of travel, the
 * incoming page slides in behind it, and both carry a gaussian motion blur
 * that peaks at mid-transition and vanishes at the endpoints — the iconic
 * film-reader look from classic movies.
 *
 * Input (wheel / touch swipe / keyboard / click) is still threshold-gated,
 * not scroll-driven — once the user commits, the transition runs on its own
 * timed animation.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TurnDirection } from '@/types';

interface UsePageTurnConfig {
  /** Total number of pages in the newspaper. */
  totalPages: number;
  /** Initial page index to start on (0-based). */
  initialPage?: number;
  /** Duration of the microfilm transition in milliseconds. */
  animationDuration?: number;
  /** Wheel-delta threshold to commit a page advance. */
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
  animationDuration: 520,
  scrollThreshold: 100,
  swipeThreshold: 30,
} as const;

/** Maximum gaussian blur applied at peak mid-transition velocity. */
const MICROFILM_BLUR_MAX = 26;
/** Horizontal stretch applied in sync with velocity for extra motion cue. */
const MICROFILM_STRETCH_MAX = 0.06;
/** Scroll distance at content's edge that must accumulate before a turn fires. */
const BOUNDARY_THRESHOLD = 180;

/** Cubic ease-in-out. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Applies the microfilm transform: translateX + a small outward scaleX stretch,
 * and a gaussian blur proportional to instantaneous velocity.
 */
function applyMicrofilmTransform(
  pageEl: HTMLElement,
  offsetFraction: number,
  velocity: number,
) {
  const blurPx = Math.abs(velocity) * MICROFILM_BLUR_MAX;
  const stretch = 1 + Math.abs(velocity) * MICROFILM_STRETCH_MAX;
  pageEl.style.transform = `translate3d(${offsetFraction * 100}%, 0, 0) scaleX(${stretch})`;
  pageEl.style.filter = blurPx > 0.4 ? `blur(${blurPx}px)` : '';
}

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

  useEffect(() => {
    currentRef.current = currentPage;
  }, [currentPage]);

  /**
   * Lays out the pages as a film strip: pages before current rest off-screen
   * left, pages after rest off-screen right, current is centered. Clears any
   * leftover inline filter/transition so a new transition starts from clean state.
   */
  const stackPages = useCallback((targetPage: number) => {
    pageRefs.current.forEach((el, i) => {
      if (!el) return;
      el.classList.remove('active', 'turning');
      el.style.transition = '';
      el.style.filter = '';
      if (i < targetPage) {
        el.style.transform = 'translate3d(-100%, 0, 0)';
        el.style.zIndex = String(i);
        el.style.opacity = '1';
      } else if (i === targetPage) {
        el.classList.add('active');
        el.style.transform = 'translate3d(0, 0, 0)';
        el.style.zIndex = String(totalPages + 1);
        el.style.opacity = '1';
      } else {
        el.style.transform = 'translate3d(100%, 0, 0)';
        el.style.zIndex = String(totalPages - i);
        el.style.opacity = '1';
      }
    });
  }, [totalPages]);

  /**
   * Runs a microfilm advance: both outgoing and incoming pages animate their
   * horizontal position together with a shared motion-blur envelope. Velocity
   * (which drives blur and stretch) is derived from the ease curve's
   * derivative, peaking at t=0.5.
   */
  const turn = useCallback((direction: TurnDirection) => {
    if (animatingRef.current) return;
    const current = currentRef.current;
    if (direction === 1 && current >= totalPages - 1) return;
    if (direction === -1 && current <= 0) return;

    const outgoingEl = pageRefs.current[current];
    const incomingEl = pageRefs.current[current + direction];
    if (!outgoingEl || !incomingEl) return;

    animatingRef.current = true;
    setIsAnimating(true);
    setScrollProgress(0);

    // Set initial positions — incoming starts just off-screen in the travel direction.
    outgoingEl.classList.add('turning');
    incomingEl.classList.add('turning');
    outgoingEl.style.zIndex = String(totalPages + 10);
    incomingEl.style.zIndex = String(totalPages + 11);
    outgoingEl.style.opacity = '1';
    incomingEl.style.opacity = '1';
    applyMicrofilmTransform(outgoingEl, 0, 0);
    applyMicrofilmTransform(incomingEl, direction, 0);

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / animationDuration, 1);
      const ease = easeInOut(t);
      // Velocity envelope: peaks at t=0.5, zero at endpoints. sin(πt) is
      // a close approximation of the ease-in-out cubic's derivative and
      // visually equivalent for blur strength.
      const velocity = Math.sin(t * Math.PI);

      // Outgoing: 0 → -direction (slides off in the direction of travel)
      // Incoming: +direction → 0 (slides in from the same side)
      const outgoingOffset = -direction * ease;
      const incomingOffset = direction * (1 - ease);

      applyMicrofilmTransform(outgoingEl, outgoingOffset, velocity);
      applyMicrofilmTransform(incomingEl, incomingOffset, velocity);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        outgoingEl.classList.remove('turning');
        incomingEl.classList.remove('turning');
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

  /** Jump directly to a page index without animation. */
  const goToPage = useCallback((index: number) => {
    if (animatingRef.current || index === currentRef.current) return;
    const clamped = Math.max(0, Math.min(index, totalPages - 1));
    currentRef.current = clamped;
    setCurrentPage(clamped);
    setScrollProgress(0);
    stackPages(clamped);
  }, [totalPages, stackPages]);

  useEffect(() => {
    stackPages(initialPage);
  }, [stackPages]);

  /** Wheel — scroll inner content first, then accumulate boundary buffer, then fire turn. */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animatingRef.current) return;

      const dir: TurnDirection = e.deltaY > 0 ? 1 : -1;
      setScrollDirection(dir);

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
      }

      if (!boundaryPassedRef.current) {
        boundaryAccumRef.current += Math.abs(e.deltaY);
        setScrollProgress(Math.min(0.6, (boundaryAccumRef.current / BOUNDARY_THRESHOLD) * 0.6));
        if (boundaryAccumRef.current < BOUNDARY_THRESHOLD) return;
        boundaryPassedRef.current = true;
        scrollAccumRef.current = 0;
        return;
      }

      scrollAccumRef.current += e.deltaY;
      setScrollProgress(
        0.6 + Math.min(0.4, (Math.abs(scrollAccumRef.current) / scrollThreshold) * 0.4),
      );

      if (scrollAccumRef.current > scrollThreshold) {
        scrollAccumRef.current = 0;
        boundaryAccumRef.current = 0;
        boundaryPassedRef.current = false;
        setScrollProgress(0);
        turn(1);
      } else if (scrollAccumRef.current < -scrollThreshold) {
        scrollAccumRef.current = 0;
        boundaryAccumRef.current = 0;
        boundaryPassedRef.current = false;
        setScrollProgress(0);
        turn(-1);
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [turn, scrollThreshold]);

  /** Touch — scroll inner content first, accumulate swipe, commit on release. */
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
        if (touchBoundaryAccum < BOUNDARY_THRESHOLD) {
          touchStartRef.current = currentY;
          touchConsumed = true;
          setScrollProgress(Math.min(0.6, (touchBoundaryAccum / BOUNDARY_THRESHOLD) * 0.6));
        } else {
          touchConsumed = false;
          setScrollProgress(0.6 + Math.min(0.4, ((touchBoundaryAccum - BOUNDARY_THRESHOLD) / 100) * 0.4));
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setScrollProgress(0);
      if (animatingRef.current) return;
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
