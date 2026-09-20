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
        // Runs alongside every other scene for the whole session (see scenes/Audio.ts).
        this.scene.launch('Audio');
        // The fullscreen button, drawn above every scene (see scenes/FullscreenOverlay.ts).
        this.scene.launch('FullscreenOverlay');
        this.scene.start('Preloader');
    }
}
