import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { attachGamepadLogger } from '../input/gamepadLogger';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width, height } = this.scale;

        attachGamepadLogger(this);

        // TODO: replace with real menu UI.
        this.add
            .text(width / 2, height / 2, 'Main Menu', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(38),
                color: '#ffffff',
            })
            .setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
