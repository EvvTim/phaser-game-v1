import { GameObjects, Scene } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import type { UiSoundKind } from '../audio/uiSounds';
import type { NavigableItem } from '../input/NavigableItem';
import { FocusFrame } from './FocusFrame';
import { SETTINGS_COLORS } from './settingsTheme';
import { gameTextStyle } from './textStyle';

export interface TextButtonOptions {
    /** Shown as-is — callers translate (and upper-case, if wanted) it. */
    label: string;
    fontSize: number;
    frameStroke: number;
    framePadding: number;
    onClick: () => void;
    /** Text colour while not hovered (CSS). Default: the dim idle colour; pass cream for a main action. */
    color?: string;
    /** UI sound played when activated; `null` for none. Default `'select'`. */
    sound?: UiSoundKind | null;
    onHover?: (item: NavigableItem) => void;
}

/**
 * A plain text action (`BACK`, `OPEN`): cream text that brightens under the
 * pointer, with the gamepad-focus frame. The container's position is the
 * text's centre. Does not add itself to the scene — call
 * `scene.add.existing(button)`.
 */
export class TextButton extends GameObjects.Container implements NavigableItem {
    private readonly text: GameObjects.Text;
    private readonly frame: FocusFrame;
    private readonly onClick: () => void;
    private readonly sound: UiSoundKind | null;
    private readonly idleColor: string;

    constructor(scene: Scene, x: number, y: number, options: TextButtonOptions) {
        super(scene, x, y);

        this.onClick = options.onClick;
        this.sound = options.sound === undefined ? 'select' : options.sound;
        this.idleColor = options.color ?? SETTINGS_COLORS.idleCss;

        this.text = scene.add
            .text(0, 0, options.label, gameTextStyle({ fontSize: options.fontSize, color: this.idleColor }))
            .setOrigin(0.5);

        const width = this.text.width + options.framePadding * 4;
        const height = this.text.height + options.framePadding;
        this.setSize(width, height);
        this.frame = new FocusFrame(scene, 0, 0, width, height, options.frameStroke);

        const hitArea = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.activate());
        hitArea.on('pointerover', () => {
            this.text.setColor(SETTINGS_COLORS.hoverCss);
            options.onHover?.(this);
        });
        hitArea.on('pointerout', () => this.text.setColor(this.idleColor));

        this.add([this.frame.shape, this.text, hitArea]);
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

}
