import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { EventBus } from '../events/EventBus';
import { EVENTS } from '../events/GameEvents';
import { t } from '../i18n/i18n';
import { attachGamepadLogger } from '../input/gamepadLogger';
import { gameTextStyle } from '../ui/textStyle';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create(): void {
        const { width, height } = this.scale;

        attachGamepadLogger(this);

        // No gameplay music yet — the menu track fades out.
        EventBus.emit(EVENTS.MUSIC_STOP);

        // TODO: replace with real gameplay setup.
        this.add
            .text(
                width / 2,
                height / 2,
                t('game.placeholder'),
                gameTextStyle({ fontSize: toDevicePixels(38), color: '#ffffff' }),
            )
            .setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameOver');
        });
    }
}
