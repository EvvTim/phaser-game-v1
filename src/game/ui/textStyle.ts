import type { Types } from 'phaser';
import { GAME_FONT_STACK, GAME_FONT_WEIGHT } from './gameFont';

/**
 * The style of every Text in the game: the game font at its bundled weight,
 * plus whatever the caller adds (size, colour, stroke, ...). Sizes are
 * device pixels — pass `toDevicePixels(n)`.
 */
export function gameTextStyle(style: Types.GameObjects.Text.TextStyle = {}): Types.GameObjects.Text.TextStyle {
    return { fontFamily: GAME_FONT_STACK, fontStyle: GAME_FONT_WEIGHT, ...style };
}
