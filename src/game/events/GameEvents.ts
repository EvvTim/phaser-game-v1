/**
 * Central registry of custom event names used with {@link EventBus}.
 * Add new entries here instead of using string literals at call sites,
 * so every emitter/listener pair stays discoverable and typo-proof.
 */
export const EVENTS = Object.freeze({
    GAME_READY: 'game-ready',
} as const);

export type GameEventName = (typeof EVENTS)[keyof typeof EVENTS];
