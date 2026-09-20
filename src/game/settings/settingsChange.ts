import type { Settings } from './settingsSchema';

/**
 * What the Settings scene must do when a setting changes:
 * - `restart`: redraw everything (render quality and glow change how the UI
 *   itself is built, language changes every label);
 * - `rerender`: rebuild just the current tab (e.g. the highlighted track);
 * - `none`: the control that made the change already shows it — notably the
 *   volume sliders, which must not be rebuilt while being dragged.
 */
export type SettingsChangeEffect = 'restart' | 'rerender' | 'none';

export function getSettingsChangeEffect(previous: Settings, next: Settings): SettingsChangeEffect {
    if (
        previous.display.renderQuality !== next.display.renderQuality ||
        previous.display.glowQuality !== next.display.glowQuality ||
        previous.language.locale !== next.language.locale
    ) {
        return 'restart';
    }

    if (previous.audio.musicTrack !== next.audio.musicTrack) {
        return 'rerender';
    }

    return 'none';
}
