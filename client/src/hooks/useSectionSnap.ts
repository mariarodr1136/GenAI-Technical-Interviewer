import { useEffect } from "react";

/**
 * One scroll gesture (or swipe, or arrow key) moves the page by exactly one
 * full-height section. Ported from the same technique used on the portfolio
 * site: accumulate wheel deltas so trackpad inertia can't fire twice, then
 * lock out further snaps until the smooth scroll has settled.
 *
 * Snapping is skipped on narrow or short viewports, where native scrolling
 * reads better and the sections no longer fit a single screen.
 */

const MIN_WIDTH = 860;
const MIN_HEIGHT = 560;
const WHEEL_THRESHOLD = 100;
const WHEEL_RESET_MS = 300;
const LOCK_MS = 900;
const SWIPE_THRESHOLD = 50;

export default function useSectionSnap(sectionIds: string[]): void {
  const key = sectionIds.join(",");

  useEffect(() => {
    const ids = key.split(",");
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    let locked = false;
    let wheelAcc = 0;
    let wheelResetTimer: number | undefined;
    let unlockTimer: number | undefined;
    let touchStartY = 0;

    const enabled = (): boolean =>
      window.innerWidth >= MIN_WIDTH && window.innerHeight >= MIN_HEIGHT;

    function lock(): void {
      locked = true;
      wheelAcc = 0;
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        locked = false;
        wheelAcc = 0;
      }, LOCK_MS);
    }

    /**
     * Derived from the live scroll position rather than remembered, so a
     * stray flick, an anchor jump or an interrupted animation can never leave
     * the snap index pointing at the wrong panel: whichever section the top of
     * the viewport currently sits in is the current one.
     */
    function currentIndex(): number {
      const y = window.scrollY + 2;
      let idx = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= y) idx = i;
      });
      return idx;
    }

    function snapTo(idx: number): void {
      const el = document.getElementById(ids[idx]);
      if (!el) return;
      lock();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior });
    }

    /**
     * A section taller than the viewport (short laptop screens, big text) is
     * scrolled through a screenful at a time before we move to the next one,
     * so a snap never hides content.
     */
    function advance(dir: 1 | -1): void {
      if (locked) return;
      const current = currentIndex();
      const el = document.getElementById(ids[current]);
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const remaining = dir === 1 ? rect.bottom - vh : -rect.top;
        if (remaining > 4) {
          lock();
          window.scrollBy({ top: dir * Math.min(remaining, vh - 80), behavior });
          return;
        }
      }
      const next = current + dir;
      if (next < 0 || next >= ids.length) return;
      snapTo(next);
    }

    function onWheel(e: WheelEvent): void {
      if (!enabled() || e.ctrlKey) return;
      // Let the horizontal feature carousel keep its own trackpad gestures.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (locked) {
        wheelAcc = 0;
        return;
      }
      wheelAcc += e.deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAcc = 0;
      }, WHEEL_RESET_MS);
      if (Math.abs(wheelAcc) > WHEEL_THRESHOLD) advance(wheelAcc > 0 ? 1 : -1);
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (!enabled() || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        advance(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        advance(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        snapTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        snapTo(ids.length - 1);
      }
    }

    function onTouchStart(e: TouchEvent): void {
      touchStartY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent): void {
      if (!enabled()) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > SWIPE_THRESHOLD) advance(dy > 0 ? 1 : -1);
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(wheelResetTimer);
      window.clearTimeout(unlockTimer);
    };
  }, [key]);
}
