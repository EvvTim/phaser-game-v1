import { describe, expect, it } from 'vitest';
import {
    clampPercent,
    getMusicGain,
    getSfxGain,
    percentFromRatio,
    percentToGain,
    stepPercent,
    volumePercentSchema,
} from './volume';

describe('volume percents', () => {
    it('clamps and rounds to whole percents', () => {
        expect(clampPercent(-5)).toBe(0);
        expect(clampPercent(130)).toBe(100);
        expect(clampPercent(42.6)).toBe(43);
    });

    it('steps within 0-100', () => {
        expect(stepPercent(50, 10)).toBe(60);
        expect(stepPercent(95, 10)).toBe(100);
        expect(stepPercent(5, -10)).toBe(0);
    });

    it('maps a bar position to a snapped percent', () => {
        expect(percentFromRatio(0)).toBe(0);
        expect(percentFromRatio(1)).toBe(100);
        expect(percentFromRatio(0.5)).toBe(50);
        expect(percentFromRatio(0.512)).toBe(50);
        expect(percentFromRatio(0.53)).toBe(55);
    });

    it('treats positions off either end of the bar as its ends', () => {
        expect(percentFromRatio(-0.4)).toBe(0);
        expect(percentFromRatio(1.7)).toBe(100);
    });

    it('validates saved values', () => {
        expect(volumePercentSchema.safeParse(70).success).toBe(true);
        expect(volumePercentSchema.safeParse(101).success).toBe(false);
        expect(volumePercentSchema.safeParse(-1).success).toBe(false);
        expect(volumePercentSchema.safeParse(50.5).success).toBe(false);
    });
});

describe('gains', () => {
    it('converts a percent to a 0-1 gain', () => {
        expect(percentToGain(0)).toBe(0);
        expect(percentToGain(50)).toBe(0.5);
        expect(percentToGain(100)).toBe(1);
    });

    it('multiplies master by the channel volume', () => {
        const volumes = { masterVolume: 50, musicVolume: 80, sfxVolume: 40 };

        expect(getMusicGain(volumes)).toBeCloseTo(0.4);
        expect(getSfxGain(volumes)).toBeCloseTo(0.2);
    });

    it('mutes both channels when master is 0', () => {
        const volumes = { masterVolume: 0, musicVolume: 100, sfxVolume: 100 };

        expect(getMusicGain(volumes)).toBe(0);
        expect(getSfxGain(volumes)).toBe(0);
    });
});
