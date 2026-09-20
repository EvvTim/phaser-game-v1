import type { Settings } from './settingsSchema';

/**
 * What the Settings scene must do when a setting changes:
 * - `restart`: redraw everything (render quality changes the pixel ratio the
 *   UI is built at, language changes every label);
 * - `none`: the control that made the change already shows it — every other
 *   setting, notably the volume sliders, which must not be rebuilt while
 *   being dragged.
 */
export type SettingsChangeEffect = 'restart' | 'none';

export function getSettingsChangeEffect(previous: Settings, next: Settings): SettingsChangeEffect {
    const rebuildsUi =
        previous.display.renderQuality !== next.display.renderQuality ||
        previous.language.locale !== next.language.locale;

    return rebuildsUi ? 'restart' : 'none';
}

/**
 * Whether the display settings changed — the only case where the canvas must
 * be re-fitted (see applyDisplaySettings). Doing that on every settings
 * change made Phaser emit a resize each time, which rebuilt scenes mid-drag.
 */
export function hasDisplayChanged(previous: Settings['display'], next: Settings['display']): boolean {
    return previous.renderQuality !== next.renderQuality;
}
