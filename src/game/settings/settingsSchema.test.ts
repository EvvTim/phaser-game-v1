import { describe, expect, it } from 'vitest';
import { settingsSchema } from './settingsSchema';

describe('settingsSchema', () => {
    it('fills in defaults when given an empty object', () => {
        const result = settingsSchema.parse({});
        expect(result.display.renderQuality).toBe('auto');
    });

    it('accepts a valid render quality', () => {
        const result = settingsSchema.parse({ display: { renderQuality: 'medium' } });
        expect(result.display.renderQuality).toBe('medium');
    });

    it('rejects an unknown render quality', () => {
        const result = settingsSchema.safeParse({ display: { renderQuality: 'ultra' } });
        expect(result.success).toBe(false);
    });
});
