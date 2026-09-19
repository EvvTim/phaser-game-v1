import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create(): void {
        const { width, height } = this.scale;

        this.add
            .text(width / 2, height / 2, 'Game Over', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(64),
                color: '#ffffff',
            })
            .setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
