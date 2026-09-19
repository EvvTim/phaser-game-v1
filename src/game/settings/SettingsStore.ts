import { EventBus } from '../events/EventBus';
import { EVENTS } from '../events/GameEvents';
import { settingsSchema, type DisplaySettings, type Settings } from './settingsSchema';

const STORAGE_KEY = 'phaser-game-v1:settings';

function loadSettings(): Settings {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return settingsSchema.parse(raw ? JSON.parse(raw) : {});
    } catch {
        // Corrupt JSON, an old/incompatible shape, or storage being unavailable
        // (private browsing, quota) all just fall back to defaults.
        return settingsSchema.parse({});
    }
}

function persistSettings(settings: Settings): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Settings just won't survive a reload; not worth failing the update over.
    }
}

/**
 * Single source of truth for persisted game settings. Reads/writes
 * localStorage (validated through settingsSchema) and broadcasts changes
 * over the EventBus so anything that depends on a setting — the canvas
 * resize/zoom for render quality, a scene re-rendering its UI — can react
 * without being directly coupled to whatever screen changed it.
 */
class SettingsStoreImpl {
    private settings: Settings = loadSettings();

    get(): Settings {
        return this.settings;
    }

    setDisplay(patch: Partial<DisplaySettings>): void {
        this.settings = settingsSchema.parse({
            ...this.settings,
            display: { ...this.settings.display, ...patch },
        });

        persistSettings(this.settings);
        EventBus.emit(EVENTS.SETTINGS_CHANGED, this.settings);
    }
}

export const SettingsStore = new SettingsStoreImpl();
