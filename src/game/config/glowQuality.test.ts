import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_GLOW_QUALITY, GLOW_QUALITIES, getGlowParams, setGlowQuality } from './glowQuality';

const samples = (quality: (typeof GLOW_QUALITIES)[number]): number => {
    const { distance, quality: q } = getGlowParams(quality);
    return distance * q;
};

describe('glowQuality', () => {
    afterEach(() => setGlowQuality(DEFAULT_GLOW_QUALITY));

    it('keeps the original glow look at high quality', () => {
        expect(getGlowParams('high')).toEqual({ quality: 10, distance: 8, scale: 1 });
    });

    it('defaults to low quality', () => {
        expect(DEFAULT_GLOW_QUALITY).toBe('low');
        expect(getGlowParams()).toEqual(getGlowParams('low'));
    });

    it('takes fewer shader samples at each lower quality', () => {
        expect(samples('high')).toBeGreaterThan(samples('medium'));
        expect(samples('medium')).toBeGreaterThan(samples('low'));
    });

    it('keeps roughly the same halo width across qualities', () => {
        for (const quality of GLOW_QUALITIES) {
            const { distance, scale } = getGlowParams(quality);
            expect(distance * scale).toBeGreaterThanOrEqual(7.5);
            expect(distance * scale).toBeLessThanOrEqual(8.5);
        }
    });

    it('uses integer quality/distance (they are compiled into the shader as defines)', () => {
        for (const quality of GLOW_QUALITIES) {
            const params = getGlowParams(quality);
            expect(Number.isInteger(params.quality)).toBe(true);
            expect(Number.isInteger(params.distance)).toBe(true);
        }
    });

    it('returns the active quality by default', () => {
        setGlowQuality('low');
        expect(getGlowParams()).toEqual(getGlowParams('low'));
    });
});
