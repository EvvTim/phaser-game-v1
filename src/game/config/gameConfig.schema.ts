import { z } from 'zod';

/**
 * Runtime-validated shape of the values we hand to `new Phaser.Game(...)`.
 * Keeps a bad config (e.g. a missing parent element id) from failing deep
 * inside Phaser with an opaque error.
 */
export const gameConfigSchema = z.object({
    parent: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type ValidatedGameConfig = z.infer<typeof gameConfigSchema>;
