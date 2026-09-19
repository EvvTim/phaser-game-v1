import { EventBus } from '../events/EventBus';
import { EVENTS } from '../events/GameEvents';
import { settingsSchema, type DisplaySettings, type LanguageSettings, type Settings } from './settingsSchema';
import { getBrowserStorage, loadSettings, saveSettings } from './settingsStorage';

/**
 * Single source of truth for persisted game settings. Reads/writes
 * localStorage (validated through settingsSchema; see settingsStorage.ts)
 * and broadcasts changes
 * over the EventBus so anything that depends on a setting — the canvas
 * resize/zoom for render quality, a scene re-rendering its UI — can react
 * without being directly coupled to whatever screen changed it.
 */
class SettingsStoreImpl {
    private settings: Settings = loadSettings(getBrowserStorage());

    get(): Settings {
        return this.settings;
    }

    setDisplay(patch: Partial<DisplaySettings>): void {
        this.commit({ ...this.settings, display: { ...this.settings.display, ...patch } });
    }

    setLanguage(patch: Partial<LanguageSettings>): void {
        this.commit({ ...this.settings, language: { ...this.settings.language, ...patch } });
    }

    private commit(next: Settings): void {
        this.settings = settingsSchema.parse(next);

        saveSettings(getBrowserStorage(), this.settings);
        EventBus.emit(EVENTS.SETTINGS_CHANGED, this.settings);
    }
}

export const SettingsStore = new SettingsStoreImpl();
