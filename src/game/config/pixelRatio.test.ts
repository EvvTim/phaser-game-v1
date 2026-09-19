import { describe, expect, it } from 'vitest';
import { capDevicePixelRatio } from './pixelRatio';

describe('capDevicePixelRatio', () => {
    it('passes through ratios at or below the cap', () => {
        expect(capDevicePixelRatio(1)).toBe(1);
        expect(capDevicePixelRatio(2)).toBe(2);
    });

    it('clamps ratios above the cap', () => {
        expect(capDevicePixelRatio(3)).toBe(2);
        expect(capDevicePixelRatio(4, 2)).toBe(2);
    });

    it('treats a falsy ratio as 1', () => {
        expect(capDevicePixelRatio(0)).toBe(1);
    });

    it('respects a custom max', () => {
        expect(capDevicePixelRatio(3, 4)).toBe(3);
    });
});
