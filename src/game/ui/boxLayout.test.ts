import { describe, expect, it } from 'vitest';
import { computeBoxLayout } from './boxLayout';

const fallback = { top: 10, right: 10, bottom: 10, left: 10 };

describe('computeBoxLayout', () => {
    it('sizes from content + fallback padding when both dimensions are omitted', () => {
        const layout = computeBoxLayout(100, 20, undefined, undefined, undefined, fallback);
        expect(layout).toEqual({ width: 120, height: 40, contentOffsetX: 0, contentOffsetY: 0 });
    });

    it('uses explicit dimensions as-is, ignoring content size', () => {
        const layout = computeBoxLayout(100, 20, 300, 80, undefined, fallback);
        expect(layout.width).toBe(300);
        expect(layout.height).toBe(80);
    });

    it('shifts content off-center for asymmetric padding, even with an explicit size', () => {
        const layout = computeBoxLayout(100, 20, 300, 80, { left: 40, right: 10 }, fallback);
        expect(layout.contentOffsetX).toBe(15);
        expect(layout.contentOffsetY).toBe(0);
    });

    it('keeps content centered for symmetric padding', () => {
        const layout = computeBoxLayout(100, 20, undefined, undefined, 30, fallback);
        expect(layout).toEqual({ width: 160, height: 80, contentOffsetX: 0, contentOffsetY: 0 });
    });
});
