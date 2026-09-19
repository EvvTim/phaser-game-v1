import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { UI_ATLAS_KEY } from '../ui/uiAtlas';

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
        const barWidth = toDevicePixels(460);
        const barX = width / 2 - barWidth / 2;

        this.add
            .rectangle(width / 2, height / 2, toDevicePixels(468), toDevicePixels(32))
            .setStrokeStyle(toDevicePixels(1), 0xffffff);
        const bar = this.add.rectangle(barX, height / 2, toDevicePixels(4), toDevicePixels(28), 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = toDevicePixels(4) + barWidth * progress;
        });
    }

    preload(): void {
        this.load.setPath('assets');
        this.load.atlas(UI_ATLAS_KEY, 'ui/menu-atlas.png', 'ui/menu-atlas.json');
    }

    create(): void {
        this.scene.start('MainMenu');
    }
}
