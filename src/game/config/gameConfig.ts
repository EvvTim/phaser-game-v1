import { gameConfigSchema, type ValidatedGameConfig } from './gameConfig.schema';

const backgroundColor = '#028af8';

/**
 * Builds and validates the game config for a given parent DOM element id.
 * Width/height are the window size at startup — the Scale Manager (mode:
 * RESIZE, see game/main.ts) keeps the canvas in sync with the window after
 * that, so these are just sane initial values, not a fixed resolution.
 * Throws a descriptive error at startup if the config is malformed, rather
 * than letting Phaser fail silently or ambiguously later.
 */
export function createValidatedGameConfig(parent: string): ValidatedGameConfig {
    return gameConfigSchema.parse({
        parent,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor,
    });
}
