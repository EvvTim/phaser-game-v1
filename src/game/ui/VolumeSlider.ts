import { GameObjects, Scene, type Input } from 'phaser';
import { z } from 'zod';
import { percentFromRatio, stepPercent, VOLUME_BUTTON_STEP, volumePercentSchema } from '../audio/volume';
import { toDevicePixels } from '../config/pixelRatio';
import { Button } from './Button';
import { UI_ATLAS_KEY, UI_FRAMES } from './uiAtlas';

export const volumeSliderConfigSchema = z.object({
    label: z.string().min(1),
    /** Current volume, whole percent 0-100. */
    value: volumePercentSchema,
});

export interface VolumeSliderOptions extends z.input<typeof volumeSliderConfigSchema> {
    /** Called on every change while dragging or stepping (the value is already applied to the slider). */
    onChange: (value: number) => void;
    /** Called once a drag ends or a -/+ button is pressed — a good moment to play a preview sound. */
    onCommit?: () => void;
}

/**
 * Layout of one row, in CSS pixels, relative to the row's centre. The row is
 * 580 wide (+-290) so it sits inside the settings panel's green inner frame.
 */
const LAYOUT = {
    labelX: -290,
    labelMaxWidth: 175,
    minusX: -75,
    barX: 55,
    barWidth: 220,
    plusX: 200,
    valueX: 262,
    buttonSize: 44,
    labelFontSize: 18,
} as const;

/** How much taller than the bar its clickable area is, so it's easy to hit. */
const HIT_HEIGHT_SHARE = 1.8;

/**
 * A labelled volume control: `label  [-] [wood bar] [+]  70%`. The bar is the
 * UI kit's segmented wood bar (an empty frame with a full one cropped over it,
 * so it fills smoothly); click or drag it to set the value (snapped to 5%),
 * or use the -/+ buttons (10% steps), which are plain `Button`s so the D-pad
 * can focus them — pass `buttons` to the GamepadNavigator.
 *
 * Does not add itself to the scene — call `container.add(slider)`. Remove its
 * scene-level drag listeners by destroying it (the Settings scene does when a
 * tab is rebuilt).
 */
export class VolumeSlider extends GameObjects.Container {
    /** The -/+ buttons, for GamepadNavigator#setItems. */
    readonly buttons: readonly Button[];

    private value: number;
    private readonly fill: GameObjects.Image;
    private readonly valueText: GameObjects.Text;
    private readonly barWidth: number;
    private readonly barCenterX: number;
    private readonly fillFrameSize: { width: number; height: number };
    private readonly onChange: (value: number) => void;
    private readonly onCommit: (() => void) | undefined;
    private dragging = false;

    private readonly onPointerMove = (pointer: Input.Pointer): void => {
        if (this.dragging) {
            this.setFromPointer(pointer);
        }
    };

    private readonly onPointerUp = (): void => {
        if (this.dragging) {
            this.dragging = false;
            this.onCommit?.();
        }
    };

    constructor(scene: Scene, x: number, y: number, options: VolumeSliderOptions) {
        super(scene, x, y);

        const { label, value } = volumeSliderConfigSchema.parse(options);
        this.value = value;
        this.onChange = options.onChange;
        this.onCommit = options.onCommit;

        const labelText = scene.add
            .text(toDevicePixels(LAYOUT.labelX), 0, label, {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(LAYOUT.labelFontSize),
                color: '#ffffff',
                stroke: '#3b2410',
                strokeThickness: toDevicePixels(3),
            })
            .setOrigin(0, 0.5);
        // Longer translations shrink to fit their column instead of running into the bar.
        const maxLabelWidth = toDevicePixels(LAYOUT.labelMaxWidth);
        if (labelText.width > maxLabelWidth) {
            labelText.setScale(maxLabelWidth / labelText.width);
        }

        const frame = scene.textures.getFrame(UI_ATLAS_KEY, UI_FRAMES.barEmpty);
        this.barWidth = toDevicePixels(LAYOUT.barWidth);
        this.barCenterX = toDevicePixels(LAYOUT.barX);
        const barHeight = (this.barWidth * frame.height) / frame.width;

        const track = scene.add.image(this.barCenterX, 0, UI_ATLAS_KEY, UI_FRAMES.barEmpty);
        track.setDisplaySize(this.barWidth, barHeight);

        const fullFrame = scene.textures.getFrame(UI_ATLAS_KEY, UI_FRAMES.barFull);
        this.fillFrameSize = { width: fullFrame.width, height: fullFrame.height };
        this.fill = scene.add.image(this.barCenterX, 0, UI_ATLAS_KEY, UI_FRAMES.barFull);
        this.fill.setDisplaySize(this.barWidth, (this.barWidth * fullFrame.height) / fullFrame.width);

        this.valueText = scene.add
            .text(toDevicePixels(LAYOUT.valueX), 0, '', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(LAYOUT.labelFontSize),
                color: '#ffffff',
                stroke: '#3b2410',
                strokeThickness: toDevicePixels(3),
            })
            .setOrigin(0.5);

        const size = toDevicePixels(LAYOUT.buttonSize);
        const minus = new Button(scene, toDevicePixels(LAYOUT.minusX), 0, {
            label: '-',
            width: size,
            height: size,
            sound: null,
            onClick: () => {
                this.setValue(stepPercent(this.value, -VOLUME_BUTTON_STEP));
                this.onCommit?.();
            },
        });
        const plus = new Button(scene, toDevicePixels(LAYOUT.plusX), 0, {
            label: '+',
            width: size,
            height: size,
            sound: null,
            onClick: () => {
                this.setValue(stepPercent(this.value, VOLUME_BUTTON_STEP));
                this.onCommit?.();
            },
        });
        this.buttons = [minus, plus];

        const hitArea = scene.add
            .zone(this.barCenterX, 0, this.barWidth, barHeight * HIT_HEIGHT_SHARE)
            .setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', (pointer: Input.Pointer) => {
            this.dragging = true;
            this.setFromPointer(pointer);
        });

        this.add([labelText, track, this.fill, this.valueText, minus, plus, hitArea]);
        this.refresh();

        // Dragging continues even when the pointer leaves the bar, so it's tracked on the scene.
        scene.input.on('pointermove', this.onPointerMove);
        scene.input.on('pointerup', this.onPointerUp);
        scene.input.on('pointerupoutside', this.onPointerUp);
    }

    override destroy(fromScene?: boolean): void {
        this.scene?.input?.off('pointermove', this.onPointerMove);
        this.scene?.input?.off('pointerup', this.onPointerUp);
        this.scene?.input?.off('pointerupoutside', this.onPointerUp);
        super.destroy(fromScene);
    }

    private setFromPointer(pointer: Input.Pointer): void {
        const barLeft = this.getWorldTransformMatrix().tx + this.barCenterX - this.barWidth / 2;
        this.setValue(percentFromRatio((pointer.worldX - barLeft) / this.barWidth));
    }

    private setValue(next: number): void {
        if (next === this.value) {
            return;
        }

        this.value = next;
        this.refresh();
        this.onChange(next);
    }

    private refresh(): void {
        const ratio = this.value / 100;

        // Crop is in texture pixels, so this reveals the left `ratio` of the full bar.
        this.fill.setVisible(ratio > 0);
        this.fill.setCrop(0, 0, this.fillFrameSize.width * ratio, this.fillFrameSize.height);
        this.valueText.setText(`${this.value}%`);
    }
}
