/**
 * Central registry of custom event names used with {@link EventBus}.
 * Add new entries here instead of using string literals at call sites,
 * so every emitter/listener pair stays discoverable and typo-proof.
 */
export const EVENTS = Object.freeze({
    GAME_READY: 'game-ready',
    SETTINGS_CHANGED: 'settings-changed',
    /** A menu-flow scene is up: the Audio scene should be playing the chosen menu track. */
    MUSIC_MENU_START: 'music-menu-start',
    /** Menu music is no longer wanted (e.g. gameplay started): fade it out. */
    MUSIC_STOP: 'music-stop',
} as const);

export type GameEventName = (typeof EVENTS)[keyof typeof EVENTS];
