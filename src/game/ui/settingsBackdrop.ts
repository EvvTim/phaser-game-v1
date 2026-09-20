import type { Scene } from 'phaser';
import { addMainMenuBackground } from './mainMenuBackground';
import { MOTION, motionMs, prefersReducedMotion } from './motion';
import { SETTINGS_COLORS } from './settingsTheme';

/**
 * Blur of the artwork, via Phaser 4's native Blur filter (applied after the
 * image is scaled, so the numbers are screen pixels): quality 1 (medium),
 * `offset` px per step, `steps` steps.
 */
const BLUR = { quality: 1, offset: 3, strength: 1, steps: 5 } as const;

/** How dark the curtain over the blurred artwork is (0 = none, 1 = black). */
const DARKNESS = 0.6;

/** How long the artwork takes to go from the main menu's sharp look to blurred and dark. */
const DEFOCUS_MS = motionMs(750);

/**
 * The settings screens' backdrop: the main menu artwork — in exactly the
 * main menu's position and size — blurred and darkened by a plain black
 * curtain, so the cream text and lines stay legible. Added first so
 * everything else draws over it.
 *
 * With `animate` it starts exactly as the main menu looks (sharp, undarkened)
 * and defocuses and darkens over `DEFOCUS_MS`, so going from the menu to the
 * settings reads as one continuous move instead of a cut.
 *
 * The blur is a filter, so it is redrawn every frame; that is one full-screen
 * blur, and the only filter on these screens. A blur mixes in transparent pixels at
 * the image's own edges, so the outermost few pixels of the window fade toward
 * the dark base colour under the image — invisible under the darkening.
 */
export function addSettingsBackdrop(scene: Scene, animate = false): void {
    const { width, height } = scene.scale;
    const defocus = animate && !prefersReducedMotion();

    // A dark base in case the artwork is missing or still loading.
    scene.add.rectangle(0, 0, width, height, SETTINGS_COLORS.curtain).setOrigin(0);

    // Exactly the main menu's placement and size — nothing is scaled or moved here.
    const { image } = addMainMenuBackground(scene);

    // enableFilters() is WebGL-only and leaves `filters` null without it —
    // the artwork is then just darkened, not blurred.
    image.enableFilters();
    const blur = image.filters?.external.addBlur(
        BLUR.quality,
        defocus ? 0 : BLUR.offset,
        defocus ? 0 : BLUR.offset,
        BLUR.strength,
        0xffffff,
        BLUR.steps,
    );

    const curtain = scene.add.rectangle(0, 0, width, height, 0x000000, defocus ? 0 : DARKNESS).setOrigin(0);

    if (defocus) {
        // A zero blur offset samples the same pixel every step, i.e. no blur at all.
        if (blur) {
            scene.tweens.add({ targets: blur, x: BLUR.offset, y: BLUR.offset, duration: DEFOCUS_MS, ease: MOTION.easeIn });
        }
        scene.tweens.add({ targets: curtain, fillAlpha: DARKNESS, duration: DEFOCUS_MS, ease: MOTION.easeIn });
    }
}
