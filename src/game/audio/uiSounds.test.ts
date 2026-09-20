import { describe, expect, it } from 'vitest';
import { getRelativeGain, getUiSoundKey, getUiSoundUrls, UI_SOUND_KINDS, uiSoundSchema } from './uiSounds';

describe('ui sound registry', () => {
    it('gives every kind a distinct cache key', () => {
        const keys = UI_SOUND_KINDS.map(getUiSoundKey);

        expect(new Set(keys).size).toBe(UI_SOUND_KINDS.length);
    });

    it('offers an Ogg and an M4A file per kind, under assets/sfx', () => {
        for (const kind of UI_SOUND_KINDS) {
            const urls = getUiSoundUrls(kind);

            expect(urls).toHaveLength(2);
            expect(urls[0]).toMatch(/^assets\/sfx\/.+\.ogg$/);
            expect(urls[1]).toMatch(/^assets\/sfx\/.+\.m4a$/);
        }
    });

    it('keeps every relative gain within 0-1', () => {
        for (const kind of UI_SOUND_KINDS) {
            expect(getRelativeGain(kind)).toBeGreaterThan(0);
            expect(getRelativeGain(kind)).toBeLessThanOrEqual(1);
        }
    });
});

describe('uiSoundSchema', () => {
    it('accepts known kinds and rejects anything else', () => {
        expect(uiSoundSchema.safeParse('select').success).toBe(true);
        expect(uiSoundSchema.safeParse('explosion').success).toBe(false);
        expect(uiSoundSchema.safeParse(undefined).success).toBe(false);
    });
});
