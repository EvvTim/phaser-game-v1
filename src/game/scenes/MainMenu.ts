import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width, height } = this.scale;

        // TODO: replace with real menu UI.
        this.add
            .text(width / 2, height / 2, 'Main Menu', {
                fontFamily: 'Arial',
                fontSize: 38,
                color: '#ffffff',
            })
            .setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
