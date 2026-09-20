import { describe, expect, it } from 'vitest';
import { RENDER_QUALITIES } from '../config/pixelRatio';
import { getMenuEffects } from './mainMenuEffectsConfig';

describe('getMenuEffects', () => {
    it('always keeps the film grain, whatever the quality', () => {
        for (const quality of RENDER_QUALITIES) {
            expect(getMenuEffects(quality).grain).toBe(true);
        }
    });

    it('drops the filters and the dust at low quality', () => {
        expect(getMenuEffects('low')).toMatchObject({ filters: false, dustCount: 0 });
    });

    it('runs the filters at every other quality', () => {
        for (const quality of ['auto', 'high', 'medium'] as const) {
            expect(getMenuEffects(quality).filters).toBe(true);
        }
    });

    it('thins the dust at medium and runs the most at auto / high', () => {
        expect(getMenuEffects('medium').dustCount).toBeGreaterThan(0);
        expect(getMenuEffects('medium').dustCount).toBeLessThan(getMenuEffects('high').dustCount);
        expect(getMenuEffects('auto').dustCount).toBe(getMenuEffects('high').dustCount);
    });
});
