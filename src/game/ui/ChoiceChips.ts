import { GameObjects, Scene } from 'phaser';
import { z } from 'zod';
import { emitUiSound } from '../audio/emitUiSound';
import type { UiSoundKind } from '../audio/uiSounds';
import type { NavigableItem } from '../input/NavigableItem';
import { FocusFrame } from './FocusFrame';
import { SETTINGS_COLORS } from './settingsTheme';
import { gameTextStyle } from './textStyle';

export const choiceOptionsSchema = z
    .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
    .min(1);

export interface ChoiceOption<T extends string> {
    value: T;
    label: string;
}

/** Sizes in device pixels. */
export interface ChipMetrics {
    fontSize: number;
    paddingX: number;
    paddingY: number;
    frameStroke: number;
    framePadding: number;
    /** Extra space between the label's letters (used by the section tabs). */
    letterSpacing?: number;
}

/**
 * One option of a `ChoiceChips` row: plain text, or — while it is the
 * selected value — dark text on a cream plate. Pointer over an unselected
 * chip brightens it. A gamepad-focus frame is shown while focused.
 */
export class ChoiceChip extends GameObjects.Container implements NavigableItem {
    private readonly plate: GameObjects.Rectangle;
    private readonly label: GameObjects.Text;
    private readonly frame: FocusFrame;
    private readonly onClick: () => void;
    private readonly sound: UiSoundKind | null;
    private selected = false;
    private hovered = false;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        text: string,
        metrics: ChipMetrics,
        onClick: () => void,
        onHover?: () => void,
        sound: UiSoundKind | null = 'select',
    ) {
        super(scene, x, y);
        this.onClick = onClick;
        this.sound = sound;

        this.label = scene.add
            .text(
                0,
                0,
                text,
                gameTextStyle({
                    fontSize: metrics.fontSize,
                    color: SETTINGS_COLORS.idleCss,
                    letterSpacing: metrics.letterSpacing ?? 0,
                }),
            )
            .setOrigin(0.5);

        const width = this.label.width + metrics.paddingX * 2;
        const height = this.label.height + metrics.paddingY * 2;
        this.setSize(width, height);

        this.plate = scene.add.rectangle(0, 0, width, height, SETTINGS_COLORS.cream).setVisible(false);
        this.frame = new FocusFrame(scene, 0, 0, width + metrics.framePadding, height + metrics.framePadding, metrics.frameStroke);

        const hitArea = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.activate());
        hitArea.on('pointerover', () => {
            this.hovered = true;
            this.refresh();
            onHover?.();
        });
        hitArea.on('pointerout', () => {
            this.hovered = false;
            this.refresh();
        });

        this.add([this.plate, this.frame.shape, this.label, hitArea]);
    }

    setSelected(selected: boolean): void {
        this.selected = selected;
        this.refresh();
    }

    setFocused(focused: boolean): void {
        this.frame.setFocused(focused);
    }

    activate(): void {
        if (this.sound) {
            emitUiSound(this.sound);
        }
        this.onClick();
    }


    private refresh(): void {
        this.plate.setVisible(this.selected);
        this.label.setColor(
            this.selected ? SETTINGS_COLORS.darkCss : this.hovered ? SETTINGS_COLORS.hoverCss : SETTINGS_COLORS.idleCss,
        );
    }
}

export interface ChoiceChipsOptions<T extends string> {
    options: readonly ChoiceOption<T>[];
    value: T;
    metrics: ChipMetrics;
    /** Space between two chips. */
    gap: number;
    onSelect: (value: T) => void;
    /** UI sound played when a chip is chosen; `null` for none. Default `'select'`. */
    sound?: UiSoundKind | null;
    /** The pointer moved onto a chip — the scene moves the gamepad focus there too. */
    onHover?: (item: NavigableItem) => void;
}

/**
 * A row of mutually exclusive options as text chips (`Small  Medium  Large`),
 * the selected one on a cream plate. The container's position is the row's
 * left edge, vertically centred; each chip is its own `NavigableItem`
 * (`items`), so the D-pad steps between them. Does not add itself to the
 * scene — call `scene.add.existing(row)`.
 */
export class ChoiceChips<T extends string> extends GameObjects.Container {
    readonly items: readonly ChoiceChip[];
    /** Width of the whole row (first chip's left edge to last chip's right edge). */
    readonly totalWidth: number;
    private readonly values: readonly T[];

    constructor(scene: Scene, x: number, y: number, options: ChoiceChipsOptions<T>) {
        super(scene, x, y);

        choiceOptionsSchema.parse(options.options);
        this.values = options.options.map((option) => option.value);

        let cursor = 0;
        const chips: ChoiceChip[] = [];
        options.options.forEach((option) => {
            const chip: ChoiceChip = new ChoiceChip(
                scene,
                0,
                0,
                option.label,
                options.metrics,
                () => {
                    this.setValue(option.value);
                    options.onSelect(option.value);
                },
                () => options.onHover?.(chip),
                options.sound,
            );
            chip.setX(cursor + chip.width / 2);
            cursor += chip.width + options.gap;
            chips.push(chip);
            this.add(chip);
        });

        this.items = chips;
        this.totalWidth = Math.max(0, cursor - options.gap);
        this.setValue(options.value);
    }

    /** Shows `value` as selected (does not call `onSelect`). */
    setValue(value: T): void {
        this.items.forEach((chip, index) => chip.setSelected(this.values[index] === value));
    }
}
