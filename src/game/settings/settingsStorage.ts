import { settingsSchema, type Settings } from './settingsSchema';

export const SETTINGS_STORAGE_KEY = 'phaser-game-v1:settings';

export type ReadableStorage = Pick<Storage, 'getItem'>;
export type WritableStorage = Pick<Storage, 'setItem'>;

/**
 * The browser's localStorage, or `null` if it's unavailable — merely
 * touching `window.localStorage` can throw (blocked site data, some
 * sandboxed iframes), so this is the one place that guards for it.
 */
export function getBrowserStorage(): Storage | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

/** Reads and validates saved settings, falling back to defaults on missing, corrupt or incompatible data. */
export function loadSettings(storage: ReadableStorage | null): Settings {
    try {
        const raw = storage?.getItem(SETTINGS_STORAGE_KEY);
        return settingsSchema.parse(raw ? JSON.parse(raw) : {});
    } catch {
        // Corrupt JSON, an old/incompatible shape, or storage throwing all
        // just fall back to defaults.
        return settingsSchema.parse({});
    }
}

/** Best-effort save: if storage is unavailable or full, settings just won't survive a reload. */
export function saveSettings(storage: WritableStorage | null, settings: Settings): void {
    try {
        storage?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Not worth failing the settings update over.
    }
}
