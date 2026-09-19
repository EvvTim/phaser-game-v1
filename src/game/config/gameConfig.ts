import { gameConfigSchema, type ValidatedGameConfig } from './gameConfig.schema';

const rawConfig = {
    width: 1024,
    height: 768,
    backgroundColor: '#028af8',
};

/**
 * Builds and validates the game config for a given parent DOM element id.
 * Throws a descriptive error at startup if the config is malformed, rather
 * than letting Phaser fail silently or ambiguously later.
 */
export function createValidatedGameConfig(parent: string): ValidatedGameConfig {
    return gameConfigSchema.parse({ ...rawConfig, parent });
}
