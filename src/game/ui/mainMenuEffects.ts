import { BlendModes, type GameObjects, type Scene } from 'phaser';
import { getRenderQuality, toDevicePixels } from '../config/pixelRatio';
import type { MainMenuBackground } from './mainMenuBackground';
import { getMenuEffects } from './mainMenuEffectsConfig';

/**
 * The main menu artwork is a small picture that was scaled up, so at full size
 * it shows halos, flat posterized patches and soft detail. These effects don't
 * fix it, they make it read as an intentional soft-focus, filmic look and give
 * the eye crisp small things to land on: a light blur, a vignette, film grain
 * and drifting star dust. Everything is native Phaser 4 (filters, a
 * TileSprite, a particle emitter); the two textures are generated on the fly, so
 * there are no image assets. What runs depends on the render quality (see
 * getMenuEffects).
 */

/** A very light softening blur, in screen px (quality 0 = the cheapest kernel): enough to take the edge off the artwork's halos, not enough to look out of focus. */
const BLUR = { quality: 0, offset: 0.5, strength: 1, steps: 2 } as const;

/**
 * Vignette: centred on the artwork (a little above its middle, as the window
 * shows the top of a taller image), strong enough to pull the eye inward but
 * not to look like a frame. See Phaser's Vignette: darkness grows from the
 * centre to `radius`.
 */
const VIGNETTE = { x: 0.5, y: 0.42, radius: 1.1, strength: 0.22 } as const;

const GRAIN_TEXTURE = 'menu-grain';
const GRAIN_SIZE = 256;
/** Grain tile shifts to a random offset this often (ms) — a ~12 fps flicker like film. */
const GRAIN_STEP_MS = 80;
const GRAIN_ALPHA = 0.3;

const DUST_TEXTURE = 'menu-dust';
const DUST_SIZE = 32;

export function addMainMenuEffects(scene: Scene, background: MainMenuBackground): void {
    const effects = getMenuEffects(getRenderQuality());

    if (effects.filters) {
        addArtworkFilters(scene, background.image);
    }
    if (effects.dustCount > 0) {
        addStarDust(scene, effects.dustCount);
    }
    if (effects.grain) {
        addFilmGrain(scene);
    }
}

function addArtworkFilters(scene: Scene, image: GameObjects.Image): void {
    // A blur mixes in transparent pixels at the image's own edges, so the game's
    // (blue) background colour would show as a thin rim around the window.
    scene.cameras.main.setBackgroundColor(0x000000);

    // enableFilters() is WebGL-only and leaves `filters` null without it —
    // the artwork is then simply shown without them.
    image.enableFilters();
    image.filters?.external.addBlur(BLUR.quality, BLUR.offset, BLUR.offset, BLUR.strength, 0xffffff, BLUR.steps);
    image.filters?.external.addVignette(VIGNETTE.x, VIGNETTE.y, VIGNETTE.radius, VIGNETTE.strength, 0x000000);
}

/**
 * Zero-mean grain: each pixel is white or black with a random opacity, so it
 * lightens and darkens equally instead of veiling the black of space with grey.
 * Drawn once into a canvas texture and tiled over the whole window.
 */
function ensureGrainTexture(scene: Scene): void {
    if (scene.textures.exists(GRAIN_TEXTURE)) {
        return;
    }

    const texture = scene.textures.createCanvas(GRAIN_TEXTURE, GRAIN_SIZE, GRAIN_SIZE);
    if (!texture) {
        return;
    }

    const context = texture.getContext();
    const pixels = context.createImageData(GRAIN_SIZE, GRAIN_SIZE);
    for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i += 1) {
        // Sum of uniforms ~ a bell curve: mostly faint, a few strong specks.
        const noise = Math.random() + Math.random() + Math.random() - 1.5;
        const shade = noise > 0 ? 255 : 0;
        pixels.data[i * 4] = shade;
        pixels.data[i * 4 + 1] = shade;
        pixels.data[i * 4 + 2] = shade;
        pixels.data[i * 4 + 3] = Math.min(255, Math.abs(noise) * 110);
    }
    context.putImageData(pixels, 0, 0);
    texture.refresh();
}

function addFilmGrain(scene: Scene): void {
    ensureGrainTexture(scene);

    const { width, height } = scene.scale;
    const grain = scene.add.tileSprite(0, 0, width, height, GRAIN_TEXTURE).setOrigin(0).setAlpha(GRAIN_ALPHA);

    scene.time.addEvent({
        delay: GRAIN_STEP_MS,
        loop: true,
        callback: () => grain.setTilePosition(Math.random() * GRAIN_SIZE, Math.random() * GRAIN_SIZE),
    });
}

/** A soft round dot: opaque white in the middle fading to nothing at the edge. */
function ensureDustTexture(scene: Scene): void {
    if (scene.textures.exists(DUST_TEXTURE)) {
        return;
    }

    const texture = scene.textures.createCanvas(DUST_TEXTURE, DUST_SIZE, DUST_SIZE);
    if (!texture) {
        return;
    }

    const context = texture.getContext();
    const half = DUST_SIZE / 2;
    const gradient = context.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.35, 'rgba(255, 244, 230, 0.55)');
    gradient.addColorStop(1, 'rgba(255, 244, 230, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, DUST_SIZE, DUST_SIZE);
    texture.refresh();
}

/**
 * Sparse, slow motes that fade in and out (a native particle emitter — Phaser
 * pools and reuses the particles, and `maxAliveParticles` caps them). Additive
 * blending so they read as tiny lights, not specks of grey.
 */
function addStarDust(scene: Scene, maxAlive: number): void {
    ensureDustTexture(scene);

    const { width, height } = scene.scale;
    const drift = toDevicePixels(7);
    const peakAlpha = 0.85;

    scene.add.particles(0, 0, DUST_TEXTURE, {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: { min: 3500, max: 8000 },
        speedX: { min: -drift, max: drift },
        speedY: { min: -drift * 0.6, max: drift * 0.3 },
        scale: { min: toDevicePixels(0.05), max: toDevicePixels(0.22) },
        alpha: { onEmit: () => 0, onUpdate: (_particle, _key, t: number) => Math.sin(t * Math.PI) * peakAlpha },
        blendMode: BlendModes.ADD,
        frequency: 110,
        quantity: 1,
        maxAliveParticles: maxAlive,
    });
}
