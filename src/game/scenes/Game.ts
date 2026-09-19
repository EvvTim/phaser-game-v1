import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create(): void {
        const { width, height } = this.scale;

        // TODO: replace with real gameplay setup.
        this.add
            .text(width / 2, height / 2, 'Game', {
                fontFamily: 'Arial',
                fontSize: 38,
                color: '#ffffff',
            })
            .setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameOver');
        });
    }
}
