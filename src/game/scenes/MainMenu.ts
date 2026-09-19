import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { attachGamepadLogger } from '../input/gamepadLogger';
import { Button } from '../ui/Button';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width, height } = this.scale;

        attachGamepadLogger(this);

        this.add
            .text(width / 2, height / 2 - toDevicePixels(90), 'Main Menu', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(38),
                color: '#ffffff',
            })
            .setOrigin(0.5);

        const buttonWidth = toDevicePixels(220);
        const buttonHeight = toDevicePixels(52);

        const playButton = new Button(this, width / 2, height / 2, {
            label: 'Играть',
            width: buttonWidth,
            height: buttonHeight,
            onClick: () => this.scene.start('Game'),
        });
        this.add.existing(playButton);

        const settingsButton = new Button(this, width / 2, height / 2 + toDevicePixels(70), {
            label: 'Настройки',
            width: buttonWidth,
            height: buttonHeight,
            onClick: () => this.scene.start('Settings'),
        });
        this.add.existing(settingsButton);
    }
}
