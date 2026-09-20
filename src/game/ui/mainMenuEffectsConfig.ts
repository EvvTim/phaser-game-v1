import type { RenderQuality } from '../config/pixelRatio';

/** Which of the main menu's background effects run, for a given render quality. */
export interface MenuEffects {
    /** Softening blur + vignette filters on the artwork (two extra full-screen passes). */
    filters: boolean;
    /** The film-grain overlay — nearly free, so it always runs. */
    grain: boolean;
    /** How many star-dust motes may be alive at once (0 = none). */
    dustCount: number;
}

/**
 * The effects that hide the artwork's low source resolution cost fill-rate,
 * so they follow the player's render quality: the filters and the dust are
 * dropped at `low`, and the dust is thinned at `medium`.
 */
export function getMenuEffects(quality: RenderQuality): MenuEffects {
    switch (quality) {
        case 'low':
            return { filters: false, grain: true, dustCount: 0 };
        case 'medium':
            return { filters: true, grain: true, dustCount: 28 };
        default:
            return { filters: true, grain: true, dustCount: 60 };
    }
}
