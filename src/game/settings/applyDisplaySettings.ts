import type { Game } from 'phaser';
import { getPixelRatio, setRenderQuality, toDevicePixels, type RenderQuality } from '../config/pixelRatio';

/**
 * Applies a render-quality change to the live game: updates the active
 * pixel ratio and re-syncs the canvas backing buffer + zoom to match (see
 * game/main.ts for why that pair of calls, instead of Scale.RESIZE, is
 * what keeps the canvas both full-window and DPR-aware).
 */
export function applyDisplaySettings(game: Game, quality: RenderQuality): void {
    setRenderQuality(quality);

    const ratio = getPixelRatio();
    game.scale.setZoom(1 / ratio);
    game.scale.resize(toDevicePixels(window.innerWidth), toDevicePixels(window.innerHeight));
}
