import type { Scene } from 'phaser';
import { addMainMenuBackground } from './mainMenuBackground';
import { SETTINGS_COLORS } from './settingsTheme';

/**
 * Blur of the artwork, via Phaser 4's native Blur filter (applied after the
 * image is scaled, so the numbers are screen pixels): quality 1 (medium),
 * `OFFSET` px per step, `STEPS` steps.
 */
const BLUR = { quality: 1, offset: 3, strength: 1, steps: 5 } as const;

/** How dark the curtain over the blurred artwork is (0 = none, 1 = black). */
const DARKNESS = 0.6;

/**
 * The settings screens' backdrop: the main menu artwork — in exactly the
 * main menu's position and size — blurred and darkened by a plain black
 * curtain, so the cream text and lines stay legible. Added first so
 * everything else draws over it.
 *
 * The blur is a filter, so it is redrawn every frame; that is one full-screen
 * blur, and the only filter in the game. A blur mixes in transparent pixels at
 * the image's own edges, so the outermost few pixels of the window fade toward
 * the dark base colour under the image — invisible under the darkening.
 */
export function addSettingsBackdrop(scene: Scene): void {
    const { width, height } = scene.scale;

    // A dark base in case the artwork is missing or still loading.
    scene.add.rectangle(0, 0, width, height, SETTINGS_COLORS.curtain).setOrigin(0);

    // Exactly the main menu's placement and size — nothing is scaled or moved here.
    const { image } = addMainMenuBackground(scene);

    // enableFilters() is WebGL-only and leaves `filters` null without it —
    // the artwork is then just darkened, not blurred.
    image.enableFilters();
    image.filters?.external.addBlur(BLUR.quality, BLUR.offset, BLUR.offset, BLUR.strength, 0xffffff, BLUR.steps);

    scene.add.rectangle(0, 0, width, height, 0x000000, DARKNESS).setOrigin(0);
}
