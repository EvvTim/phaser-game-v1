import type { GameObjects } from 'phaser';

/**
 * Anything GamepadNavigator can move focus between: a positioned game
 * object that can show a highlight and be triggered. `Button` and
 * `MenuItem` both implement it.
 */
export interface NavigableItem {
    getWorldTransformMatrix: GameObjects.Container['getWorldTransformMatrix'];
    setFocused(focused: boolean): void;
    activate(): void;
}
