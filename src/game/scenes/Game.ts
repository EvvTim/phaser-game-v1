import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { t } from '../i18n/i18n';
import { attachGamepadLogger } from '../input/gamepadLogger';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create(): void {
        const { width, height } = this.scale;

        attachGamepadLogger(this);

        // TODO: replace with real gameplay setup.
        this.add
            .text(width / 2, height / 2, t('game.placeholder'), {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(38),
                color: '#ffffff',
            })
            .setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameOver');
        });
    }
}
