import type { Game } from 'phaser';
import { getPixelRatio, toDevicePixels } from './pixelRatio';

/**
 * Resizes the game canvas' backing buffer + zoom to match the current
 * window size and pixel ratio, and explicitly sets the canvas's own CSS
 * size to match too — used for both a window resize and a render-quality
 * change (see settings/applyDisplaySettings.ts), so this is the one place
 * that needs to get it right.
 *
 * The explicit style write matters: Phaser's `ScaleManager#resize` only
 * writes the canvas's inline CSS style when the zoomed size differs from
 * the raw pixel size — a check that's silently skipped whenever zoom is
 * exactly 1 (e.g. capped DPR 2 x "low" quality's 0.5x multiplier). Relying
 * on that left a stale CSS size from a previous zoom level in place, which
 * `Scale.CENTER_BOTH` then centered by shifting the oversized canvas up
 * and off-screen. Setting the style ourselves, unconditionally, avoids
 * depending on that internal, zoom-value-sensitive behavior entirely.
 */
export function syncCanvasSize(game: Game): void {
    const ratio = getPixelRatio();
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;

    game.scale.resize(toDevicePixels(cssWidth), toDevicePixels(cssHeight));
    game.scale.setZoom(1 / ratio);

    game.canvas.style.width = `${cssWidth}px`;
    game.canvas.style.height = `${cssHeight}px`;
}
