export const RENDER_QUALITIES = ['auto', 'high', 'medium', 'low'] as const;
export type RenderQuality = (typeof RENDER_QUALITIES)[number];

const MAX_PIXEL_RATIO = 2;

/**
 * How much of the (capped) devicePixelRatio to actually render at. This is
 * what the Display settings tab's "render quality" option controls — lower
 * quality trades sharpness for fill-rate on weaker GPUs.
 */
const QUALITY_SCALE: Record<RenderQuality, number> = {
    auto: 1,
    high: 1,
    medium: 0.75,
    low: 0.5,
};

/**
 * Caps a raw `devicePixelRatio` value. Rendering at the full, uncapped ratio
 * (3-4 on some phones) roughly quadruples the pixels the GPU has to fill for
 * little visible gain over 2x, so we clamp it.
 */
export function capDevicePixelRatio(rawRatio: number, max: number = MAX_PIXEL_RATIO): number {
    return Math.min(rawRatio || 1, max);
}

export function getQualityScale(quality: RenderQuality): number {
    return QUALITY_SCALE[quality];
}

let currentQuality: RenderQuality = 'auto';

/** Sets the active render quality (see game/settings). Takes effect on the next resize/zoom apply. */
export function setRenderQuality(quality: RenderQuality): void {
    currentQuality = quality;
}

export function getRenderQuality(): RenderQuality {
    return currentQuality;
}

/** The ratio between device pixels and CSS pixels the game currently renders at. */
export function getPixelRatio(): number {
    return capDevicePixelRatio(window.devicePixelRatio) * getQualityScale(currentQuality);
}

/**
 * Converts a CSS-pixel size (e.g. a font size, stroke width, or UI element
 * dimension) into the game's internal device-pixel coordinate space.
 *
 * The game canvas renders at `getPixelRatio()` times the window's CSS size
 * (see game/main.ts) for crisp text/shapes on HiDPI screens, which means
 * every in-game unit is a device pixel, not a CSS pixel. Any size that
 * should look visually consistent across screens (fonts, UI chrome) must be
 * converted with this helper rather than used as a raw number.
 */
export function toDevicePixels(cssPixels: number): number {
    return Math.round(cssPixels * getPixelRatio());
}
