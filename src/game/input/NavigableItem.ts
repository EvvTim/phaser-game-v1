import type { GameObjects } from 'phaser';
import type { Direction } from './gamepadMapping';

/**
 * Anything GamepadNavigator can move focus between: a positioned game
 * object that can show a highlight and be triggered. `MenuItem`, and the
 * settings controls (`ChoiceChip`, `ArrowSelector`, `LineSlider`,
 * `TextButton`) implement it.
 */
export interface NavigableItem {
    getWorldTransformMatrix: GameObjects.Container['getWorldTransformMatrix'];
    setFocused(focused: boolean): void;
    activate(): void;
    /**
     * Optional: lets the focused item use a D-pad direction itself — a slider
     * takes left/right to change its value, an arrow selector to cycle.
     * Return `true` if the direction was used (focus then stays put), `false`
     * to let the navigator move focus to the neighbouring item as usual.
     */
    handleDirection?(direction: Direction): boolean;
}
