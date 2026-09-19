import { describe, expect, it } from 'vitest';
import { gameConfigSchema } from './gameConfig.schema';

describe('gameConfigSchema', () => {
    it('accepts a valid config', () => {
        const result = gameConfigSchema.safeParse({
            parent: 'game-container',
            width: 1024,
            height: 768,
            backgroundColor: '#028af8',
        });

        expect(result.success).toBe(true);
    });

    it('rejects an empty parent id', () => {
        const result = gameConfigSchema.safeParse({
            parent: '',
            width: 1024,
            height: 768,
            backgroundColor: '#028af8',
        });

        expect(result.success).toBe(false);
    });

    it('rejects a malformed background color', () => {
        const result = gameConfigSchema.safeParse({
            parent: 'game-container',
            width: 1024,
            height: 768,
            backgroundColor: 'blue',
        });

        expect(result.success).toBe(false);
    });
});
