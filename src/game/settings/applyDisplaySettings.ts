import type { Game } from 'phaser';
import { setRenderQuality } from '../config/pixelRatio';
import { syncCanvasSize } from '../config/canvasSize';
import type { DisplaySettings } from './settingsSchema';

/**
 * Applies display settings to the live game: updates the active pixel ratio
 * and re-syncs the canvas to match (see game/config/canvasSize.ts for why
 * that can't just be a plain `scale.resize()` call).
 */
export function applyDisplaySettings(game: Game, display: DisplaySettings): void {
    setRenderQuality(display.renderQuality);
    syncCanvasSize(game);
}
