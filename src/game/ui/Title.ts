import { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { UI_ATLAS_KEY, UI_FRAMES } from './uiAtlas';
import type { PaddingBox } from './padding';
import { computeBoxLayout } from './boxLayout';
import type { ButtonPadding } from './Button';

export interface TitleConfig {
    label: string;
    width?: number;
    height?: number;
    /** Same CSS-style padding as Button — see its ButtonConfig.padding doc. */
    padding?: ButtonPadding;
}

/**
 * Slice metrics for the 'banner_hex' atlas frame (527x172 source pixels):
 * the pointed end-caps need a wider fixed region than banner_rect's flat
 * ends, so the diagonal taper doesn't get stretched into a straight edge.
 * Re-measure if the atlas is regenerated (see art-source/ui/README.md).
 */
const SLICE = { left: 90, right: 85, top: 10, bottom: 14 };

const LABEL_FONT_SIZE = 28;

const DEFAULT_PADDING_CSS: PaddingBox = { top: 14, right: 50, bottom: 14, left: 50 };

/**
 * A screen title banner skinned with the wood/green UI kit — decorative
 * only, no interactivity. Meant to sit above a screen's content panel with
 * its own background rather than being drawn over the panel. Does not add
 * itself to the scene — call `scene.add.existing(title)`.
 */
export class Title extends GameObjects.Container {
    constructor(scene: Scene, x: number, y: number, config: TitleConfig) {
        super(scene, x, y);

        const fallbackPadding: PaddingBox = {
            top: toDevicePixels(DEFAULT_PADDING_CSS.top),
            right: toDevicePixels(DEFAULT_PADDING_CSS.right),
            bottom: toDevicePixels(DEFAULT_PADDING_CSS.bottom),
            left: toDevicePixels(DEFAULT_PADDING_CSS.left),
        };

        const label = scene.add
            .text(0, 0, config.label, {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(LABEL_FONT_SIZE),
                color: '#ffffff',
                stroke: '#3b2410',
                strokeThickness: toDevicePixels(4),
            })
            .setOrigin(0.5);

        const layout = computeBoxLayout(
            label.width,
            label.height,
            config.width,
            config.height,
            config.padding,
            fallbackPadding,
        );

        label.setPosition(layout.contentOffsetX, layout.contentOffsetY);

        const background = scene.add.nineslice(
            0,
            0,
            UI_ATLAS_KEY,
            UI_FRAMES.bannerHex,
            layout.width,
            layout.height,
            SLICE.left,
            SLICE.right,
            SLICE.top,
            SLICE.bottom,
        );

        this.add([background, label]);
        this.setSize(layout.width, layout.height);
    }
}
