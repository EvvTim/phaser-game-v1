import { describe, expect, it } from 'vitest';
import { computeFullscreenButtonLayout } from './fullscreenButtonLayout';

describe('computeFullscreenButtonLayout', () => {
    it('reproduces the reference size and margin at 1920x1080', () => {
        const layout = computeFullscreenButtonLayout(1920, 1080, 20);

        expect(layout.size).toBe(46);
        // Its right edge is 22 px from the right of the window, its top edge 22 px from the top.
        expect(layout.x + layout.size / 2).toBe(1920 - 22);
        expect(layout.y - layout.size / 2).toBe(22);
    });

    it('sits in the top-right corner', () => {
        const layout = computeFullscreenButtonLayout(1920, 1080, 20);

        expect(layout.x).toBeGreaterThan(1920 / 2);
        expect(layout.y).toBeLessThan(1080 / 2);
    });

    it('scales with the window', () => {
        const half = computeFullscreenButtonLayout(960, 540, 10);
        const full = computeFullscreenButtonLayout(1920, 1080, 10);

        expect(half.size).toBe(full.size / 2);
    });

    it('never gets smaller than the minimum size', () => {
        const layout = computeFullscreenButtonLayout(400, 300, 36);

        expect(layout.size).toBe(36);
    });

    it('always stays fully inside the window', () => {
        for (const [width, height] of [
            [1920, 1080],
            [1280, 720],
            [640, 360],
            [400, 800],
        ]) {
            const { x, y, size } = computeFullscreenButtonLayout(width, height, 36);

            expect(x + size / 2).toBeLessThanOrEqual(width);
            expect(x - size / 2).toBeGreaterThanOrEqual(0);
            expect(y - size / 2).toBeGreaterThanOrEqual(0);
            expect(y + size / 2).toBeLessThanOrEqual(height);
        }
    });
});
