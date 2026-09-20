import { GameObjects, Scene } from 'phaser';
import type { Input } from 'phaser';
import { z } from 'zod';
import { percentFromRatio, stepPercent, VOLUME_BUTTON_STEP, volumePercentSchema } from '../audio/volume';
import type { Direction } from '../input/gamepadMapping';
import type { NavigableItem } from '../input/NavigableItem';
import { FocusFrame } from './FocusFrame';
import { SETTINGS_COLORS } from './settingsTheme';
import { gameTextStyle } from './textStyle';

export const lineSliderConfigSchema = z.object({
    /** Current value, whole percent 0-100. */
    value: volumePercentSchema,
});

export interface LineSliderOptions extends z.input<typeof lineSliderConfigSchema> {
    /** Device-pixel sizes. */
    lineWidth: number;
    lineThickness: number;
    handleSize: number;
    fontSize: number;
    frameStroke: number;
    framePadding: number;
    /** Distance from the container's centre to where the percent text ends (right-aligned). */
    valueRightX: number;
    /** Called on every change while dragging or stepping (the value is already applied to the slider). */
    onChange: (value: number) => void;
    /** Called once a drag ends or a D-pad step is made — a good moment for a preview sound. */
    onCommit?: () => void;
    onHover?: (item: NavigableItem) => void;
}

/**
 * A thin cream line with a square handle and the percent beside it. Click or
 * drag the line to set the value (snapped to 5%; the drag keeps working when
 * the pointer leaves the line); with the gamepad, the D-pad left/right steps
 * it by 10% while it is focused (it claims those two directions via
 * `handleDirection`; up/down still move focus). The container's position is
 * the centre of the line. Does not add itself to the scene — call
 * `scene.add.existing(slider)`; destroying it removes its scene-level drag
 * listeners.
 */
export class LineSlider extends GameObjects.Container implements NavigableItem {
    private value: number;
    private readonly handle: GameObjects.Rectangle;
    private readonly valueText: GameObjects.Text;
    private readonly frame: FocusFrame;
    private readonly options: LineSliderOptions;
    private dragging = false;

    private readonly onPointerMove = (pointer: Input.Pointer): void => {
        if (this.dragging) {
            this.setFromPointer(pointer);
        }
    };

    private readonly onPointerUp = (): void => {
        if (this.dragging) {
            this.dragging = false;
            this.options.onCommit?.();
        }
    };

    constructor(scene: Scene, x: number, y: number, options: LineSliderOptions) {
        super(scene, x, y);

        this.options = options;
        this.value = lineSliderConfigSchema.parse({ value: options.value }).value;

        const line = scene.add.rectangle(0, 0, options.lineWidth, options.lineThickness, SETTINGS_COLORS.cream);
        this.handle = scene.add.rectangle(0, 0, options.handleSize, options.handleSize, SETTINGS_COLORS.cream);
        this.valueText = scene.add
            .text(options.valueRightX, 0, '', gameTextStyle({ fontSize: options.fontSize, color: SETTINGS_COLORS.creamCss }))
            .setOrigin(1, 0.5);

        const height = options.handleSize + options.framePadding * 2;
        this.setSize(options.lineWidth, height);
        this.frame = new FocusFrame(
            scene,
            0,
            0,
            options.lineWidth + options.handleSize + options.framePadding * 2,
            height,
            options.frameStroke,
        );

        const hitArea = scene.add
            .zone(0, 0, options.lineWidth + options.handleSize, height)
            .setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', (pointer: Input.Pointer) => {
            this.dragging = true;
            this.setFromPointer(pointer);
        });
        hitArea.on('pointerover', () => options.onHover?.(this));

        this.add([this.frame.shape, line, this.handle, this.valueText, hitArea]);
        this.refresh();

        // Dragging continues when the pointer leaves the line, so it's tracked on the scene.
        scene.input.on('pointermove', this.onPointerMove);
        scene.input.on('pointerup', this.onPointerUp);
        scene.input.on('pointerupoutside', this.onPointerUp);
    }

    setFocused(focused: boolean): void {
        this.frame.setFocused(focused);
    }

    /** A slider has no confirm action. */
    activate(): void {
        // Nothing to confirm: the value is changed with left/right or the pointer.
    }

    handleDirection(direction: Direction): boolean {
        if (direction === 'left' || direction === 'right') {
            this.setValue(stepPercent(this.value, direction === 'left' ? -VOLUME_BUTTON_STEP : VOLUME_BUTTON_STEP));
            this.options.onCommit?.();
            return true;
        }
        return false;
    }

    override destroy(fromScene?: boolean): void {
        this.scene?.input?.off('pointermove', this.onPointerMove);
        this.scene?.input?.off('pointerup', this.onPointerUp);
        this.scene?.input?.off('pointerupoutside', this.onPointerUp);
        super.destroy(fromScene);
    }

    private setFromPointer(pointer: Input.Pointer): void {
        const lineLeft = this.getWorldTransformMatrix().tx - this.options.lineWidth / 2;
        this.setValue(percentFromRatio((pointer.worldX - lineLeft) / this.options.lineWidth));
    }

    private setValue(next: number): void {
        if (next === this.value) {
            return;
        }

        this.value = next;
        this.refresh();
        this.options.onChange(next);
    }

    private refresh(): void {
        this.handle.setX((this.value / 100 - 0.5) * this.options.lineWidth);
        this.valueText.setText(`${this.value}%`);
    }
}
