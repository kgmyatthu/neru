/**
 * @module usePageTurn
 * Microfilm transition: outgoing + incoming pages slide horizontally past each
 * other, carrying a directional motion blur and a rolling-shutter skew that
 * both peak at mid-transition. The directional blur is implemented via an
 * inline SVG filter (`feGaussianBlur` with `stdDeviation="Nx 0"`) — a pure
 * horizontal smear rather than the radial fog produced by CSS `filter: blur()`.
 * The skew simulates the top/bottom row-scan offset of a rolling-shutter
 * capture: vertical lines tilt in the direction of motion during fast advance.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TurnDirection } from '@/types';

interface UsePageTurnConfig {
  totalPages: number;
  initialPage?: number;
  animationDuration?: number;
  scrollThreshold?: number;
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

/** Maximum horizontal streak length (px) — distance to the farthest ghost sample at peak velocity.
 *  Real motion blur is a trail of time-offset exposures, not a gaussian fade; we composite
 *  5 progressively faded copies of the page at fractional offsets to simulate this. */
const MOTION_STREAK_MAX_PX = 80;
/** Rolling-shutter skew angle (deg) — deliberately strong for a visible jello/wobble. */
const ROLLING_SHUTTER_MAX_DEG = 8;
/** Horizontal stretch at peak velocity. */
const STRETCH_MAX = 0.035;
/** Opacity slopes for each of the 5 ghost samples (farthest from source first is faintest). */
const GHOST_SLOPES = [0.55, 0.35, 0.22, 0.13, 0.06] as const;
/** Fractional offset multipliers for the 5 ghost samples (1.0 = MOTION_STREAK_MAX_PX). */
const GHOST_FRACTIONS = [0.2, 0.4, 0.6, 0.8, 1.0] as const;
/** Boundary buffer before wheel/touch can commit a page advance. */
const BOUNDARY_THRESHOLD = 180;
/** ID of the inline SVG filter used for directional motion blur. */
const MOTION_BLUR_FILTER_ID = 'microfilm-motion-blur';
/** ID of the container SVG element. */
const MOTION_BLUR_SVG_ID = '__microfilm-filter-defs';

/** Cubic ease-in-out. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Injects the SVG motion-blur filter (idempotent) and returns refs to the five
 * feOffset nodes so the animation loop can update their `dx` attribute per frame.
 *
 * The filter is a classic compositing motion-blur: five progressively faded,
 * horizontally offset copies of the source are merged behind the source itself,
 * producing a ghost trail exactly like the multi-sample accumulation that real
 * cameras and film exposures produce. Pure horizontal — no gaussian bell — so
 * vertical edges stay knife-sharp and the image cannot read as DOF.
 */
function ensureMotionBlurFilter(): SVGElement[] | null {
  if (typeof document === 'undefined') return null;
  let svg = document.getElementById(MOTION_BLUR_SVG_ID) as unknown as SVGSVGElement | null;
  if (!svg) {
    const ns = 'http://www.w3.org/2000/svg';
    svg = document.createElementNS(ns, 'svg');
    svg.id = MOTION_BLUR_SVG_ID;
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    svg.style.pointerEvents = 'none';

    const defs = document.createElementNS(ns, 'defs');
    const filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', MOTION_BLUR_FILTER_ID);
    // Oversized filter region so ghost trails don't clip at the page edges.
    filter.setAttribute('x', '-40%');
    filter.setAttribute('y', '-5%');
    filter.setAttribute('width', '180%');
    filter.setAttribute('height', '110%');

    // Build 5 offset + fade pairs.
    const merge = document.createElementNS(ns, 'feMerge');
    GHOST_SLOPES.forEach((slope, i) => {
      const offset = document.createElementNS(ns, 'feOffset');
      offset.setAttribute('in', 'SourceGraphic');
      offset.setAttribute('dx', '0');
      offset.setAttribute('dy', '0');
      offset.setAttribute('result', `mb-off-${i}`);
      filter.appendChild(offset);

      const fade = document.createElementNS(ns, 'feComponentTransfer');
      fade.setAttribute('in', `mb-off-${i}`);
      fade.setAttribute('result', `mb-fade-${i}`);
      const funcA = document.createElementNS(ns, 'feFuncA');
      funcA.setAttribute('type', 'linear');
      funcA.setAttribute('slope', String(slope));
      fade.appendChild(funcA);
      filter.appendChild(fade);
    });

    // Merge from farthest-faintest up to the sharp source on top.
    for (let i = GHOST_SLOPES.length - 1; i >= 0; i--) {
      const mergeNode = document.createElementNS(ns, 'feMergeNode');
      mergeNode.setAttribute('in', `mb-fade-${i}`);
      merge.appendChild(mergeNode);
    }
    const sourceNode = document.createElementNS(ns, 'feMergeNode');
    sourceNode.setAttribute('in', 'SourceGraphic');
    merge.appendChild(sourceNode);

    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }
  return Array.from(svg.querySelectorAll('feOffset'));
}

/**
 * Applies the microfilm transform to a single page. `velocity` ∈ [0,1] drives
 * the shared visual envelope (blur, skew, stretch); `direction` selects which
 * way the rolling-shutter skew leans.
 */
function applyMicrofilmTransform(
  pageEl: HTMLElement,
  offsetFraction: number,
  velocity: number,
  direction: TurnDirection,
) {
  const shutterSkew = velocity * ROLLING_SHUTTER_MAX_DEG * -direction;
  const stretch = 1 + velocity * STRETCH_MAX;

  pageEl.style.transform =
    `translate3d(${offsetFraction * 100}%, 0, 0) skewX(${shutterSkew}deg) scaleX(${stretch})`;

  // Directional (x-axis-only) blur via SVG — no radial component, so it reads
  // as motion rather than DOF. The filter's stdDeviation is updated per frame
  // by the animation loop.
  pageEl.style.filter = velocity > 0.015 ? `url(#${MOTION_BLUR_FILTER_ID})` : '';
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
  const offsetNodesRef = useRef<SVGElement[] | null>(null);

  useEffect(() => {
    currentRef.current = currentPage;
  }, [currentPage]);

  // Inject SVG filter once on mount.
  useEffect(() => {
    offsetNodesRef.current = ensureMotionBlurFilter();
  }, []);

  /** Film-strip layout: pages before current rest off-screen left, after off-screen right. */
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

    outgoingEl.classList.add('turning');
    incomingEl.classList.add('turning');
    outgoingEl.style.zIndex = String(totalPages + 10);
    incomingEl.style.zIndex = String(totalPages + 11);
    outgoingEl.style.opacity = '1';
    incomingEl.style.opacity = '1';
    applyMicrofilmTransform(outgoingEl, 0, 0, direction);
    applyMicrofilmTransform(incomingEl, direction, 0, direction);

    let startTime: number | null = null;
    const offsetNodes = offsetNodesRef.current;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / animationDuration, 1);
      const ease = easeInOut(t);
      // Velocity envelope — `sin(πt)` approximates the derivative of the cubic
      // ease-in-out: zero at endpoints, unity peak at t=0.5.
      const velocity = Math.sin(t * Math.PI);

      // Update the ghost-offset trail on the shared SVG filter.
      if (offsetNodes) {
        // Ghosts trail BEHIND motion: for forward turn (direction=1) pages move
        // leftward, so ghosts sit to the right (+dx). For backward turn the
        // sign flips.
        const streak = velocity * MOTION_STREAK_MAX_PX * direction;
        for (let i = 0; i < offsetNodes.length; i++) {
          const dx = streak * GHOST_FRACTIONS[i];
          offsetNodes[i].setAttribute('dx', dx.toFixed(2));
        }
      }

      const outgoingOffset = -direction * ease;
      const incomingOffset = direction * (1 - ease);
      applyMicrofilmTransform(outgoingEl, outgoingOffset, velocity, direction);
      applyMicrofilmTransform(incomingEl, incomingOffset, velocity, direction);

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

  /** Wheel — scroll inner content first, accumulate boundary, then commit via `turn`. */
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
