import { Scene } from 'phaser';

/**
 * First scene to run. Load only what the Preloader itself needs here
 * (e.g. a loading-screen background) — keep it minimal, it has no
 * progress bar of its own.
 */
export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload(): void {
        // TODO: load any assets required by the Preloader scene.
    }

    create(): void {
        this.scene.start('Preloader');
    }
}
