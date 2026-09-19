export const GLOW_QUALITIES = ['high', 'medium', 'low'] as const;
export type GlowQuality = (typeof GLOW_QUALITIES)[number];

/** Cheapest preset by default — glow is decoration, so weaker GPUs shouldn't pay for it unless the player opts in. */
export const DEFAULT_GLOW_QUALITY: GlowQuality = 'low';

/**
 * Phaser's Glow shader samples the texture `distance × quality` times per
 * pixel (two nested loops), and both values are compiled into the shader —
 * so they can't change on an existing filter, only when one is created.
 * Lower presets cut the sample count and compensate with a larger `scale`
 * (which stretches the sampling step) so the halo keeps roughly the same
 * width, just coarser at the edges: `distance × scale` stays ≈ 8 throughout.
 */
export interface GlowParams {
    quality: number;
    distance: number;
    scale: number;
}

const GLOW_PARAMS: Record<GlowQuality, GlowParams> = {
    high: { quality: 10, distance: 8, scale: 1 }, // 80 samples — the original look
    medium: { quality: 6, distance: 6, scale: 1.3 }, // 36 samples
    low: { quality: 4, distance: 4, scale: 2 }, // 16 samples
};

let currentQuality: GlowQuality = DEFAULT_GLOW_QUALITY;

/** Sets the active glow quality (see game/settings). Applies to glows created afterwards. */
export function setGlowQuality(quality: GlowQuality): void {
    currentQuality = quality;
}

export function getGlowParams(quality: GlowQuality = currentQuality): GlowParams {
    return GLOW_PARAMS[quality];
}
