import { describe, expect, it } from 'vitest';
import { getSettingsChangeEffect, hasDisplayChanged } from './settingsChange';
import { settingsSchema, type Settings } from './settingsSchema';

const base = (): Settings => settingsSchema.parse({ language: { locale: 'en' } });

describe('getSettingsChangeEffect', () => {
    it('restarts for render quality and language changes', () => {
        const before = base();

        expect(getSettingsChangeEffect(before, { ...before, display: { ...before.display, renderQuality: 'low' } })).toBe(
            'restart',
        );
        expect(getSettingsChangeEffect(before, { ...before, language: { locale: 'pl' } })).toBe('restart');
    });

    it('leaves the scene alone when the music track changes — the selector shows it itself', () => {
        const before = base();
        const after = { ...before, audio: { ...before.audio, musicTrack: 'theme3' as const } };

        expect(getSettingsChangeEffect(before, after)).toBe('none');
    });

    it('leaves the scene alone for volume changes, so a slider can be dragged', () => {
        const before = base();

        for (const key of ['masterVolume', 'musicVolume', 'sfxVolume'] as const) {
            const after = { ...before, audio: { ...before.audio, [key]: 12 } };

            expect(getSettingsChangeEffect(before, after)).toBe('none');
        }
    });

    it('does nothing when nothing changed', () => {
        const before = base();

        expect(getSettingsChangeEffect(before, { ...before })).toBe('none');
    });
});

describe('hasDisplayChanged', () => {
    it('is true only when the render quality changed', () => {
        const before = base();

        expect(hasDisplayChanged(before.display, { ...before.display, renderQuality: 'low' })).toBe(true);
        expect(hasDisplayChanged(before.display, { ...before.display })).toBe(false);
    });

    it('ignores every non-display setting, so a volume drag does not re-fit the canvas', () => {
        const before = base();
        const after = { ...before, audio: { ...before.audio, masterVolume: 10 } };

        expect(hasDisplayChanged(before.display, after.display)).toBe(false);
    });
});
