import { describe, expect, it } from 'vitest';
import { getSettingsChangeEffect } from './settingsChange';
import { settingsSchema, type Settings } from './settingsSchema';

const base = (): Settings => settingsSchema.parse({ language: { locale: 'en' } });

describe('getSettingsChangeEffect', () => {
    it('restarts for render quality, glow quality and language changes', () => {
        const before = base();

        expect(getSettingsChangeEffect(before, { ...before, display: { ...before.display, renderQuality: 'low' } })).toBe(
            'restart',
        );
        expect(getSettingsChangeEffect(before, { ...before, display: { ...before.display, glowQuality: 'high' } })).toBe(
            'restart',
        );
        expect(getSettingsChangeEffect(before, { ...before, language: { locale: 'pl' } })).toBe('restart');
    });

    it('only rebuilds the tab when the music track changes', () => {
        const before = base();
        const after = { ...before, audio: { ...before.audio, musicTrack: 'theme3' as const } };

        expect(getSettingsChangeEffect(before, after)).toBe('rerender');
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
