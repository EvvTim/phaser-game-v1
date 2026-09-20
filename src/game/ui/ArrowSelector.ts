import { GameObjects, Scene } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import type { Direction } from '../input/gamepadMapping';
import type { NavigableItem } from '../input/NavigableItem';
import { choiceOptionsSchema, type ChoiceOption } from './ChoiceChips';
import { FocusFrame } from './FocusFrame';
import { MOTION, prefersReducedMotion } from './motion';
import { SETTINGS_COLORS } from './settingsTheme';
import { gameTextStyle } from './textStyle';

export interface ArrowSelectorOptions<T extends string> {
    options: readonly ChoiceOption<T>[];
    value: T;
    /** Width of the text field between the arrows, and the arrows' size, in device pixels. */
    fieldWidth: number;
    arrowSize: number;
    fontSize: number;
    frameStroke: number;
    framePadding: number;
    onSelect: (value: T) => void;
    onHover?: (item: NavigableItem) => void;
}

/**
 * `◀  value  ▶`: cycles through a short list of options (wrapping around).
 * Click an arrow, or use the D-pad left/right while it is focused (it claims
 * those two directions via `handleDirection`; up/down still move focus) —
 * the confirm button steps forward. The container's position is the centre of
 * the whole control. Does not add itself to the scene — call
 * `scene.add.existing(selector)`.
 */
export class ArrowSelector<T extends string> extends GameObjects.Container implements NavigableItem {
    private readonly options: readonly ChoiceOption<T>[];
    private readonly value: GameObjects.Text;
    private readonly frame: FocusFrame;
    private readonly onSelect: (value: T) => void;
    private readonly slide: number;
    private index: number;

    constructor(scene: Scene, x: number, y: number, config: ArrowSelectorOptions<T>) {
        super(scene, x, y);

        choiceOptionsSchema.parse(config.options);
        this.options = config.options;
        this.onSelect = config.onSelect;
        this.slide = config.arrowSize * 0.9;
        this.index = Math.max(0, config.options.findIndex((option) => option.value === config.value));

        const half = config.fieldWidth / 2 + config.arrowSize;
        const hitSize = config.arrowSize * 2.4;

        this.value = scene.add
            .text(0, 0, '', gameTextStyle({ fontSize: config.fontSize, color: SETTINGS_COLORS.creamCss }))
            .setOrigin(0.5);

        const arrows = scene.add.graphics();
        arrows.fillStyle(SETTINGS_COLORS.cream, 1);
        const a = config.arrowSize;
        arrows.fillTriangle(-half - a / 2, 0, -half + a / 2, -a / 2, -half + a / 2, a / 2);
        arrows.fillTriangle(half + a / 2, 0, half - a / 2, -a / 2, half - a / 2, a / 2);

        const height = config.arrowSize * 2;
        this.setSize(half * 2 + a, height);
        this.frame = new FocusFrame(
            scene,
            0,
            0,
            half * 2 + a + config.framePadding * 2,
            height + config.framePadding,
            config.frameStroke,
        );

        const left = scene.add.zone(-half, 0, hitSize, hitSize).setInteractive({ useHandCursor: true });
        const right = scene.add.zone(half, 0, hitSize, hitSize).setInteractive({ useHandCursor: true });
        left.on('pointerdown', () => this.step(-1));
        right.on('pointerdown', () => this.step(1));
        for (const zone of [left, right]) {
            zone.on('pointerover', () => config.onHover?.(this));
        }

        this.add([this.frame.shape, arrows, this.value, left, right]);
        this.refresh();
    }

    setValue(value: T): void {
        const index = this.options.findIndex((option) => option.value === value);
        if (index !== -1) {
            this.index = index;
            this.refresh();
        }
    }

    setFocused(focused: boolean): void {
        this.frame.setFocused(focused);
    }

    /** Confirm steps to the next option. */
    activate(): void {
        this.step(1);
    }

    handleDirection(direction: Direction): boolean {
        if (direction === 'left') {
            this.step(-1);
            return true;
        }
        if (direction === 'right') {
            this.step(1);
            return true;
        }
        return false;
    }


    private step(delta: number): void {
        const count = this.options.length;
        this.index = (this.index + delta + count) % count;
        this.refresh();
        this.slideValueIn(delta);
        emitUiSound('select');
        this.onSelect(this.options[this.index].value);
    }

    private refresh(): void {
        this.value.setText(this.options[this.index].label);
    }

    /** The new value drifts in from the side the player stepped toward, so the change reads as a slide. */
    private slideValueIn(delta: number): void {
        if (prefersReducedMotion()) {
            return;
        }

        this.scene.tweens.killTweensOf(this.value);
        this.value.setPosition(Math.sign(delta) * this.slide, 0).setAlpha(0.2);
        this.scene.tweens.add({ targets: this.value, x: 0, alpha: 1, duration: MOTION.microMs, ease: MOTION.easeIn });
    }
}
