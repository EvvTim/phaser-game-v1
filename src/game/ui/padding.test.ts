import { describe, expect, it } from 'vitest';
import { resolvePadding, type PaddingBox } from './padding';

const fallback: PaddingBox = { top: 1, right: 2, bottom: 3, left: 4 };

describe('resolvePadding', () => {
    it('uses the fallback when padding is omitted', () => {
        expect(resolvePadding(undefined, fallback)).toEqual(fallback);
    });

    it('applies a single number to all sides', () => {
        expect(resolvePadding(10, fallback)).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    });

    it('applies x/y to the matching side pairs', () => {
        expect(resolvePadding({ x: 20, y: 5 }, fallback)).toEqual({ top: 5, right: 20, bottom: 5, left: 20 });
    });

    it('lets individual sides override x/y', () => {
        expect(resolvePadding({ x: 20, left: 40 }, fallback)).toEqual({
            top: fallback.top,
            right: 20,
            bottom: fallback.bottom,
            left: 40,
        });
    });

    it('falls back per-side for anything unspecified', () => {
        expect(resolvePadding({ top: 9 }, fallback)).toEqual({ top: 9, right: 2, bottom: 3, left: 4 });
    });
});
