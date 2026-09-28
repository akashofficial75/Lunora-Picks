/**
 * Eased smooth scroll utility for refined, gliding navigation.
 * Uses easeInOutCubic over ~850ms with interactive interrupt handling
 * and full accessibility support for prefers-reduced-motion.
 */

let currentScrollAnimation: number | null = null;
let cancelListener: (() => void) | null = null;

// Buttery-smooth easeInOutCubic curve
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothScrollTo(
  target: string | HTMLElement | number,
  options: {
    duration?: number;
    offset?: number;
    onComplete?: () => void;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const { duration = 850, offset = 80, onComplete } = options;

  // Check prefers-reduced-motion for accessibility
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calculate target scroll position
  let targetPosition = 0;

  if (typeof target === 'number') {
    targetPosition = target;
  } else if (typeof target === 'string') {
    if (target === 'hero' || target === 'top') {
      targetPosition = 0;
    } else {
      const el = document.getElementById(target);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      targetPosition = rect.top + window.pageYOffset - offset;
    }
  } else if (target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect();
    targetPosition = rect.top + window.pageYOffset - offset;
  }

  // Ensure within document bounds
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  targetPosition = Math.max(0, Math.min(targetPosition, maxScroll));

  // If user prefers reduced motion, snap immediately
  if (prefersReduced || duration <= 0) {
    window.scrollTo({ top: targetPosition, behavior: 'auto' });
    onComplete?.();
    return;
  }

  // Cancel any ongoing animation
  if (currentScrollAnimation !== null) {
    cancelAnimationFrame(currentScrollAnimation);
    currentScrollAnimation = null;
  }
  if (cancelListener) {
    cancelListener();
    cancelListener = null;
  }

  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;

  // If practically at target, return
  if (Math.abs(distance) < 2) {
    window.scrollTo(0, targetPosition);
    onComplete?.();
    return;
  }

  const startTime = performance.now();

  // Stop animation if user touches or uses mousewheel
  const onUserInteraction = () => {
    if (currentScrollAnimation !== null) {
      cancelAnimationFrame(currentScrollAnimation);
      currentScrollAnimation = null;
    }
    cleanupListeners();
  };

  const cleanupListeners = () => {
    window.removeEventListener('wheel', onUserInteraction);
    window.removeEventListener('touchstart', onUserInteraction);
    cancelListener = null;
  };

  window.addEventListener('wheel', onUserInteraction, { passive: true });
  window.addEventListener('touchstart', onUserInteraction, { passive: true });
  cancelListener = cleanupListeners;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * easedProgress);

    if (progress < 1) {
      currentScrollAnimation = requestAnimationFrame(step);
    } else {
      currentScrollAnimation = null;
      cleanupListeners();
      onComplete?.();
    }
  };

  currentScrollAnimation = requestAnimationFrame(step);
}
