import { GameObjects, Scene } from 'phaser';
import { SETTINGS_COLORS } from './settingsTheme';

/**
 * The gamepad-focus (and mouse-hover) marker of a settings control: a plain
 * thin cream frame around it, shown only while focused. No effects.
 *
 * Add `frame.shape` to the owning container.
 */
export class FocusFrame {
    readonly shape: GameObjects.Rectangle;

    constructor(scene: Scene, x: number, y: number, width: number, height: number, stroke: number) {
        this.shape = scene.add
            .rectangle(x, y, width, height)
            .setStrokeStyle(stroke, SETTINGS_COLORS.cream)
            .setVisible(false);
    }

    setFocused(focused: boolean): void {
        this.shape.setVisible(focused);
    }
}
