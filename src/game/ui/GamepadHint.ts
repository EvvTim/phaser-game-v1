import { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { GAMEPAD_ATLAS_KEY, type GamepadFrame } from './gamepadPrompts';
import { gameTextStyle } from './textStyle';

const ICON_HEIGHT_CSS = 30;
const CAPTION_GAP_CSS = 8;

/**
 * A small on-screen prompt: a controller-button icon (from the gamepad
 * prompt atlas — see gamepadPrompts.ts) with an optional caption to its
 * right, e.g. `[A] Select`. The pair is centered on the container's
 * position. Hidden until `show()` is called; does not add itself to the
 * scene — call `scene.add.existing(hint)`.
 */
export class GamepadHint extends GameObjects.Container {
    private readonly icon: GameObjects.Image;
    private readonly caption: GameObjects.Text;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);

        this.icon = scene.add.image(0, 0, GAMEPAD_ATLAS_KEY).setOrigin(0, 0.5);
        this.caption = scene.add
            .text(
                0,
                0,
                '',
                gameTextStyle({
                    fontSize: toDevicePixels(18),
                    color: '#ffffff',
                    stroke: '#1a1210',
                    strokeThickness: toDevicePixels(3),
                }),
            )
            .setOrigin(0, 0.5);

        this.add([this.icon, this.caption]);
        this.setVisible(false);
    }

    show(frame: GamepadFrame, caption = ''): void {
        this.icon.setFrame(frame);
        const iconHeight = toDevicePixels(ICON_HEIGHT_CSS);
        this.icon.setDisplaySize((this.icon.width / this.icon.height) * iconHeight, iconHeight);

        this.caption.setText(caption);
        this.caption.setVisible(caption !== '');

        const gap = caption === '' ? 0 : toDevicePixels(CAPTION_GAP_CSS);
        const totalWidth = this.icon.displayWidth + gap + (caption === '' ? 0 : this.caption.width);
        this.icon.setX(-totalWidth / 2);
        this.caption.setX(-totalWidth / 2 + this.icon.displayWidth + gap);

        this.setVisible(true);
    }

    hide(): void {
        this.setVisible(false);
    }
}
