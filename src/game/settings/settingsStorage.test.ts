import { describe, expect, it } from 'vitest';
import { DEFAULT_MUSIC_TRACK } from '../audio/musicTracks';
import { DEFAULT_MASTER_VOLUME, DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_VOLUME } from '../audio/volume';
import { settingsSchema } from './settingsSchema';
import { SETTINGS_STORAGE_KEY, loadSettings, saveSettings } from './settingsStorage';

function fakeStorage(initial: Record<string, string> = {}): Storage {
    const data = new Map(Object.entries(initial));
    return {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
    } as Storage;
}

describe('settings persistence', () => {
    it('restores exactly what was saved (simulated reload)', () => {
        const storage = fakeStorage();
        const chosen = settingsSchema.parse({
            display: { renderQuality: 'medium', glowQuality: 'high' },
            language: { locale: 'pl' },
            audio: { musicTrack: 'theme3', masterVolume: 80, musicVolume: 30, sfxVolume: 100 },
        });

        saveSettings(storage, chosen);

        expect(loadSettings(storage)).toEqual(chosen);
    });

    it('overwrites the previous save with the latest choice', () => {
        const storage = fakeStorage();

        saveSettings(storage, settingsSchema.parse({ language: { locale: 'uk' } }));
        saveSettings(storage, settingsSchema.parse({ language: { locale: 'en' } }));

        expect(loadSettings(storage).language.locale).toBe('en');
    });

    it('fills defaults for fields missing from an older save', () => {
        const storage = fakeStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ display: { renderQuality: 'low' } }) });

        const loaded = loadSettings(storage);

        expect(loaded.display.renderQuality).toBe('low');
        expect(loaded.display.glowQuality).toBe('low');
    });

    it('defaults the music track for a save made before the audio setting existed', () => {
        const storage = fakeStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ language: { locale: 'en' } }) });

        expect(loadSettings(storage).audio.musicTrack).toBe(DEFAULT_MUSIC_TRACK);
    });

    it('defaults the volumes for a save made before they existed', () => {
        const storage = fakeStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ audio: { musicTrack: 'theme2' } }) });

        expect(loadSettings(storage).audio).toEqual({
            musicTrack: 'theme2',
            masterVolume: DEFAULT_MASTER_VOLUME,
            musicVolume: DEFAULT_MUSIC_VOLUME,
            sfxVolume: DEFAULT_SFX_VOLUME,
        });
    });

    it('falls back to defaults when a saved volume is out of range', () => {
        const storage = fakeStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ audio: { musicVolume: 400 } }) });

        expect(loadSettings(storage)).toEqual(settingsSchema.parse({}));
    });

    it('falls back to defaults when the saved music track no longer exists', () => {
        const storage = fakeStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ audio: { musicTrack: 'removed-track' } }) });

        expect(loadSettings(storage)).toEqual(settingsSchema.parse({}));
    });

    it('falls back to defaults on corrupt or incompatible data', () => {
        expect(loadSettings(fakeStorage({ [SETTINGS_STORAGE_KEY]: '{not json' }))).toEqual(settingsSchema.parse({}));
        expect(loadSettings(fakeStorage({ [SETTINGS_STORAGE_KEY]: '{"display":{"renderQuality":"ultra"}}' }))).toEqual(
            settingsSchema.parse({}),
        );
    });

    it('does not throw when storage is unavailable or full', () => {
        const throwing = {
            getItem: () => {
                throw new Error('blocked');
            },
            setItem: () => {
                throw new Error('quota');
            },
        };

        expect(loadSettings(throwing)).toEqual(settingsSchema.parse({}));
        expect(() => saveSettings(throwing, settingsSchema.parse({}))).not.toThrow();
        expect(loadSettings(null)).toEqual(settingsSchema.parse({}));
        expect(() => saveSettings(null, settingsSchema.parse({}))).not.toThrow();
    });
});
