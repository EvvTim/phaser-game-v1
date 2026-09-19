import { Scene } from 'phaser';

/**
 * Loads all assets needed by the rest of the game, with a visible
 * progress bar driven by the Loader's native 'progress' event.
 */
export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init(): void {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(width / 2 - 230, height / 2, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + 460 * progress;
        });
    }

    preload(): void {
        this.load.setPath('assets');
        // TODO: load game assets here, e.g. this.load.image('key', 'file.png');
    }

    create(): void {
        this.scene.start('MainMenu');
    }
}
