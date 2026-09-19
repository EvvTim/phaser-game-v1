const MAX_PIXEL_RATIO = 2;

/**
 * Caps a raw `devicePixelRatio` value. Rendering at the full, uncapped ratio
 * (3-4 on some phones) roughly quadruples the pixels the GPU has to fill for
 * little visible gain over 2x, so we clamp it.
 */
export function capDevicePixelRatio(rawRatio: number, max: number = MAX_PIXEL_RATIO): number {
    return Math.min(rawRatio || 1, max);
}

/** The (capped) ratio between device pixels and CSS pixels for the current display. */
export function getPixelRatio(): number {
    return capDevicePixelRatio(window.devicePixelRatio);
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
