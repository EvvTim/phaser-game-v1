import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOTION, MOTION_SPEED, motionMs, prefersReducedMotion, staggerDelay } from './motion';

describe('staggerDelay', () => {
    it('starts at 0 and steps by the given amount', () => {
        expect(staggerDelay(0, 70)).toBe(0);
        expect(staggerDelay(1, 70)).toBe(70);
        expect(staggerDelay(3, 70)).toBe(210);
    });

    it('stops growing after the maximum number of steps', () => {
        expect(staggerDelay(7, 70, 7)).toBe(490);
        expect(staggerDelay(50, 70, 7)).toBe(490);
    });

    it('ignores negative indices', () => {
        expect(staggerDelay(-2, 70)).toBe(0);
    });

    it('defaults to the shared motion timings', () => {
        expect(staggerDelay(2)).toBe(2 * MOTION.staggerMs);
    });
});

describe('motionMs', () => {
    it('plays design timings at MOTION_SPEED times faster, rounded to whole ms', () => {
        expect(MOTION_SPEED).toBeGreaterThan(1);
        expect(motionMs(480)).toBe(Math.round(480 / MOTION_SPEED));
        expect(motionMs(480)).toBeLessThan(480);
    });

    it('keeps zero at zero and never goes negative', () => {
        expect(motionMs(0)).toBe(0);
        expect(motionMs(1)).toBeGreaterThanOrEqual(0);
    });
});

describe('MOTION', () => {
    it('is faster than the original design timings', () => {
        expect(MOTION.enterMs).toBeLessThan(480);
        expect(MOTION.exitMs).toBeLessThan(240);
        expect(MOTION.staggerMs).toBeLessThan(70);
    });

    it('makes leaving quicker than arriving', () => {
        expect(MOTION.exitMs).toBeLessThan(MOTION.enterMs);
        expect(MOTION.sectionOutMs).toBeLessThan(MOTION.sectionInMs);
        expect(MOTION.fadeOutMs).toBeLessThan(MOTION.fadeInMs);
    });

    it('keeps the longest stagger well below the enter duration', () => {
        expect(staggerDelay(MOTION.maxStaggerSteps)).toBeLessThan(MOTION.enterMs * 1.5);
    });
});

describe('prefersReducedMotion', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('is false where there is no window (tests, SSR)', () => {
        expect(prefersReducedMotion()).toBe(false);
    });

    it('follows the (prefers-reduced-motion: reduce) media query', () => {
        vi.stubGlobal('window', { matchMedia: (query: string) => ({ matches: query.includes('reduce') }) });
        expect(prefersReducedMotion()).toBe(true);

        vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
        expect(prefersReducedMotion()).toBe(false);
    });
});
