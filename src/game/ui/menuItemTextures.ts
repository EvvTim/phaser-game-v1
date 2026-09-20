import type { Scene } from 'phaser';

export type MenuItemSkin = 'idle' | 'active';

export interface MenuItemTexture {
    key: string;
    /**
     * Horizontal origin that puts the visible plate's left edge at the
     * image's position (the texture carries a transparent margin for the
     * glow). The vertical origin is always 0.5.
     */
    originX: number;
}

/** Glow room around the plate, as a share of its height. */
const MARGIN_SHARE = 0.6;

/** The plates' corner radius, as a share of their height. */
const RADIUS_SHARE = 0.28;

/**
 * Phaser has no rounded-rect-with-gradient-and-glow primitive (Graphics
 * gradients only fill plain rects), so the two menu plate skins are drawn
 * once per size with the Canvas 2D API and cached as textures. `width` and
 * `height` are the visible plate size in device pixels.
 *
 * Both skins are semi-transparent (normal blending), tuned so that over the
 * dark artwork of the mock-up they land on the colours measured from it —
 * a faint blue-grey plate, and a periwinkle bar that brightens to white at
 * its right end — while still reading well over bright artwork.
 */
export function ensureMenuItemTexture(scene: Scene, skin: MenuItemSkin, width: number, height: number): MenuItemTexture {
    const w = Math.round(width);
    const h = Math.round(height);
    const margin = Math.round(h * MARGIN_SHARE);
    const key = `menu-item-${skin}-${w}x${h}`;

    if (!scene.textures.exists(key)) {
        const texture = scene.textures.createCanvas(key, w + margin * 2, h + margin * 2);
        if (texture) {
            (skin === 'idle' ? drawIdle : drawActive)(texture.getContext(), margin, margin, w, h);
            texture.refresh();
        }
    }

    return { key, originX: margin / (w + margin * 2) };
}

/** A faint frosted plate with a thin lilac rim. */
function drawIdle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h * RADIUS_SHARE);

    ctx.fillStyle = 'rgba(60, 66, 95, 0.5)';
    ctx.fill();

    ctx.lineWidth = Math.max(1, h * 0.022);
    ctx.strokeStyle = 'rgba(140, 150, 230, 0.4)';
    ctx.stroke();
}

/** The highlighted plate: periwinkle brightening to white on the right, a bright rim and a soft halo. */
function drawActive(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, 'rgba(138, 178, 248, 0.9)');
    gradient.addColorStop(0.62, 'rgba(146, 192, 252, 0.9)');
    gradient.addColorStop(0.82, 'rgba(198, 228, 255, 0.94)');
    gradient.addColorStop(1, 'rgba(250, 252, 255, 0.96)');

    // The halo is the fill's own shadow, so it fades out from the plate's edge.
    ctx.shadowColor = 'rgba(160, 196, 255, 0.85)';
    ctx.shadowBlur = h * 0.45;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h * RADIUS_SHARE);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = Math.max(1, h * 0.025);
    ctx.strokeStyle = 'rgba(200, 222, 255, 0.6)';
    ctx.stroke();
}
