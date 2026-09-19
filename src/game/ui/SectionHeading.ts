import { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import type { PaddingBox } from './padding';
import { computeBoxLayout } from './boxLayout';
import type { ButtonPadding } from './Button';

export interface SectionHeadingConfig {
    label: string;
    /** Same CSS-style padding as Button — see its ButtonConfig.padding doc. */
    padding?: ButtonPadding;
}

const LABEL_FONT_SIZE = 18;

const BACKGROUND_COLOR = 0x000000;
const BACKGROUND_ALPHA = 0.4;
const CORNER_RADIUS_CSS = 8;

const DEFAULT_PADDING_CSS: PaddingBox = { top: 5, right: 20, bottom: 5, left: 20 };

/**
 * A section title on a plain semi-transparent dark rounded background (e.g.
 * "Render quality" over a row of options) — decorative only, auto-sized to
 * its label. Deliberately not a textured banner, so it reads as a label
 * rather than a control. Does not add itself to the scene — call
 * `container.add(heading)` or `scene.add.existing(heading)`.
 */
export class SectionHeading extends GameObjects.Container {
    constructor(scene: Scene, x: number, y: number, config: SectionHeadingConfig) {
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
            })
            .setOrigin(0.5);

        const layout = computeBoxLayout(
            label.width,
            label.height,
            undefined,
            undefined,
            config.padding,
            fallbackPadding,
        );

        label.setPosition(layout.contentOffsetX, layout.contentOffsetY);

        const background = scene.add.graphics();
        background.fillStyle(BACKGROUND_COLOR, BACKGROUND_ALPHA);
        background.fillRoundedRect(
            -layout.width / 2,
            -layout.height / 2,
            layout.width,
            layout.height,
            toDevicePixels(CORNER_RADIUS_CSS),
        );

        this.add([background, label]);
        this.setSize(layout.width, layout.height);
    }
}
