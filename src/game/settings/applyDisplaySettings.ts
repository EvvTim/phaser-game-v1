import type { Game } from 'phaser';
import { setRenderQuality, type RenderQuality } from '../config/pixelRatio';
import { syncCanvasSize } from '../config/canvasSize';

/**
 * Applies a render-quality change to the live game: updates the active
 * pixel ratio and re-syncs the canvas to match (see game/config/canvasSize.ts
 * for why that can't just be a plain `scale.resize()` call).
 */
export function applyDisplaySettings(game: Game, quality: RenderQuality): void {
    setRenderQuality(quality);
    syncCanvasSize(game);
}
