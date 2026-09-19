import { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { UI_ATLAS_KEY, UI_FRAMES } from './uiAtlas';
import type { Padding, PaddingBox } from './padding';
import { computeBoxLayout } from './boxLayout';

export type ButtonPadding = Padding;

export interface ButtonConfig {
    label: string;
    onClick: () => void;
    /** Fixed size. Omit a dimension to size it from the label + padding instead, like a CSS box with `width`/`height: auto`. */
    width?: number;
    height?: number;
    /**
     * Space around the label — a single number for all sides, `{ x, y }`
     * for horizontal/vertical, or individual sides (combinable, e.g.
     * `{ x: 24, top: 8 }`). Values are device pixels, same convention as
     * `width`/`height` above — pass `toDevicePixels(n)` if you're thinking
     * in CSS-equivalent units. Only affects sizing for a dimension left to
     * auto-size; on a fixed dimension, asymmetric padding still shifts the
     * label off-center within the box, as it would in CSS.
     */
    padding?: ButtonPadding;
    selected?: boolean;
}

/**
 * Slice metrics for the 'banner_rect' atlas frame (465x172 source pixels):
 * fixed-width wood end-caps/corners on all four sides around a stretchable
 * green middle. These are texture-space pixel offsets, independent of
 * device pixel ratio — re-measure if the atlas is regenerated with a
 * differently-proportioned crop (see art-source/ui/README.md).
 *
 * Kept well under the source frame's true border thickness (~44/37/28/46):
 * NineSlice borders are absolute output pixels, not scaled to the target
 * size, and our buttons render far shorter (~44-64px) than the frame's
 * native 172px height — the true border alone would exceed that and
 * collapse the stretchable middle entirely.
 */
const SLICE = { left: 24, right: 20, top: 10, bottom: 14 };

const SELECTED_TINT = 0xffe27a;

/** CSS-equivalent label font size, exported so callers (e.g. TabBar) can measure label width before choosing a button's own width. */
export const BUTTON_LABEL_FONT_SIZE = 18;

/** CSS-equivalent default padding, used for any side not covered by an explicit `width`/`height` or `padding` value. */
const DEFAULT_PADDING_CSS: PaddingBox = { top: 12, right: 24, bottom: 12, left: 24 };

/**
 * A reusable clickable button skinned with the wood/green UI kit. Does not
 * add itself to the scene or a parent container — call
 * `scene.add.existing(button)` for a standalone button, or
 * `container.add(button)` to nest it (e.g. inside a TabBar).
 */
export class Button extends GameObjects.Container {
    private readonly background: GameObjects.NineSlice;
    private readonly label: GameObjects.Text;
    private selected: boolean;

    constructor(scene: Scene, x: number, y: number, config: ButtonConfig) {
        super(scene, x, y);

        this.selected = config.selected ?? false;

        const fallbackPadding: PaddingBox = {
            top: toDevicePixels(DEFAULT_PADDING_CSS.top),
            right: toDevicePixels(DEFAULT_PADDING_CSS.right),
            bottom: toDevicePixels(DEFAULT_PADDING_CSS.bottom),
            left: toDevicePixels(DEFAULT_PADDING_CSS.left),
        };

        this.label = scene.add
            .text(0, 0, config.label, {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(BUTTON_LABEL_FONT_SIZE),
                color: '#ffffff',
                stroke: '#3b2410',
                strokeThickness: toDevicePixels(3),
            })
            .setOrigin(0.5);

        const layout = computeBoxLayout(
            this.label.width,
            this.label.height,
            config.width,
            config.height,
            config.padding,
            fallbackPadding,
        );

        this.label.setPosition(layout.contentOffsetX, layout.contentOffsetY);

        this.background = scene.add.nineslice(
            0,
            0,
            UI_ATLAS_KEY,
            UI_FRAMES.bannerRect,
            layout.width,
            layout.height,
            SLICE.left,
            SLICE.right,
            SLICE.top,
            SLICE.bottom,
        );

        this.add([this.background, this.label]);
        this.setSize(layout.width, layout.height);

        this.background.setInteractive({ useHandCursor: true });
        this.background.on('pointerdown', config.onClick);

        this.applySelected();
    }

    setSelected(selected: boolean): void {
        if (this.selected === selected) {
            return;
        }

        this.selected = selected;
        this.applySelected();
    }

    private applySelected(): void {
        if (this.selected) {
            this.background.setTint(SELECTED_TINT);
        } else {
            this.background.clearTint();
        }
    }
}
