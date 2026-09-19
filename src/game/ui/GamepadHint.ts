import { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';

/**
 * A small on-screen hint naming a controller button (e.g. "L" / "R" next to
 * a tab bar). Text-only for now — swap the label for an icon sprite once
 * button-icon assets exist, without touching call sites. Hidden until
 * `show()` is called; does not add itself to the scene — call
 * `scene.add.existing(hint)`.
 */
export class GamepadHint extends GameObjects.Container {
    private readonly label: GameObjects.Text;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);

        this.label = scene.add
            .text(0, 0, '', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(20),
                color: '#ffffff',
                stroke: '#3b2410',
                strokeThickness: toDevicePixels(3),
            })
            .setOrigin(0.5);

        this.add(this.label);
        this.setVisible(false);
    }

    show(buttonLabel: string): void {
        this.label.setText(buttonLabel);
        this.setVisible(true);
    }

    hide(): void {
        this.setVisible(false);
    }
}
