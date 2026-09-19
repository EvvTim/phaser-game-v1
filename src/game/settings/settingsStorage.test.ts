import { describe, expect, it } from 'vitest';
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
