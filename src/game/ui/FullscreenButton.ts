import { GameObjects, Scene } from 'phaser';
import { z } from 'zod';
import { emitUiSound } from '../audio/emitUiSound';
import { SETTINGS_COLORS } from './settingsTheme';

export const fullscreenButtonConfigSchema = z.object({
    /** Side of the square button, device pixels. */
    size: z.number().positive(),
    /** Whether the game is fullscreen right now (decides which icon is shown). */
    fullscreen: z.boolean(),
});

export interface FullscreenButtonOptions extends z.input<typeof fullscreenButtonConfigSchema> {
    /** Called when the button is pressed — the scene toggles fullscreen. */
    onToggle: () => void;
}

const PLATE_ALPHA = { idle: 0.32, hover: 0.55 } as const;
const RIM_ALPHA = { idle: 0.5, hover: 1 } as const;

/**
 * An icon-only square button: a translucent dark plate with a thin cream rim
 * and four corner brackets — pointing outward ("go fullscreen") or inward
 * ("leave fullscreen"). Everything is drawn with Graphics (no assets), and the
 * rim brightens under the pointer. It fires on `pointerup` so it also counts
 * as a valid user gesture for browsers' fullscreen rules on touch screens.
 * The container's position is the button's centre. Does not add itself to the
 * scene — call `scene.add.existing(button)`.
 */
export class FullscreenButton extends GameObjects.Container {
    private readonly plate: GameObjects.Graphics;
    private readonly icon: GameObjects.Graphics;
    private readonly size_: number;
    private fullscreen: boolean;
    private hovered = false;

    constructor(scene: Scene, x: number, y: number, options: FullscreenButtonOptions) {
        super(scene, x, y);

        const { size, fullscreen } = fullscreenButtonConfigSchema.parse(options);
        this.size_ = size;
        this.fullscreen = fullscreen;
        this.setSize(size, size);

        this.plate = scene.add.graphics();
        this.icon = scene.add.graphics();

        const hitArea = scene.add.zone(0, 0, size, size).setInteractive({ useHandCursor: true });
        hitArea.on('pointerup', () => {
            emitUiSound('select');
            options.onToggle();
        });
        hitArea.on('pointerover', () => this.setHovered(true));
        hitArea.on('pointerout', () => this.setHovered(false));

        this.add([this.plate, this.icon, hitArea]);
        this.redraw();
    }

    /** Shows the "leave fullscreen" icon while the game is fullscreen, the "go fullscreen" one otherwise. */
    setFullscreen(fullscreen: boolean): void {
        if (fullscreen !== this.fullscreen) {
            this.fullscreen = fullscreen;
            this.redraw();
        }
    }

    private setHovered(hovered: boolean): void {
        this.hovered = hovered;
        this.redraw();
    }

    private redraw(): void {
        const size = this.size_;
        const half = size / 2;
        const state = this.hovered ? 'hover' : 'idle';

        this.plate.clear();
        this.plate.fillStyle(0x000000, PLATE_ALPHA[state]);
        this.plate.fillRoundedRect(-half, -half, size, size, size * 0.18);
        this.plate.lineStyle(Math.max(1, size * 0.04), SETTINGS_COLORS.cream, RIM_ALPHA[state]);
        this.plate.strokeRoundedRect(-half, -half, size, size, size * 0.18);

        // Corner brackets: an L at each corner, its arms `arm` long. Not fullscreen ("go fullscreen"):
        // the L's hug the plate's outer corners and their arms run inward along the edges, like the
        // corners of a frame. Fullscreen ("leave"): the L's sit near the centre with their corners
        // pointing at the middle and their arms running outward, as if the frame shrank.
        const arm = size * 0.17;
        const corner = this.fullscreen ? size * 0.11 : size * 0.29;
        // +1: arms run toward the centre from the corner point; -1: away from it.
        const inward = this.fullscreen ? -1 : 1;

        this.icon.clear();
        this.icon.lineStyle(Math.max(2, size * 0.07), SETTINGS_COLORS.cream, this.hovered ? 1 : 0.9);
        for (const sx of [-1, 1]) {
            for (const sy of [-1, 1]) {
                const cx = sx * corner;
                const cy = sy * corner;
                this.icon.beginPath();
                this.icon.moveTo(cx - sx * arm * inward, cy);
                this.icon.lineTo(cx, cy);
                this.icon.lineTo(cx, cy - sy * arm * inward);
                this.icon.strokePath();
            }
        }
    }
}
