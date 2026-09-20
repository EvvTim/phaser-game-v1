import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { t } from '../i18n/i18n';
import { attachGamepadLogger } from '../input/gamepadLogger';
import { gameTextStyle } from '../ui/textStyle';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create(): void {
        const { width, height } = this.scale;

        attachGamepadLogger(this);

        this.add
            .text(
                width / 2,
                height / 2,
                t('gameOver.title'),
                gameTextStyle({ fontSize: toDevicePixels(64), color: '#ffffff' }),
            )
            .setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
