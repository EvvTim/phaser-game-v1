import { Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { attachGamepadLogger } from '../input/gamepadLogger';
import { GamepadNavigator } from '../input/GamepadNavigator';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';
import { UI_ATLAS_KEY, UI_FRAMES } from '../ui/uiAtlas';
import { PANEL_SLICE } from '../ui/panelSlice';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width } = this.scale;

        attachGamepadLogger(this);

        const titleY = toDevicePixels(60);
        const title = new Title(this, width / 2, titleY, { label: 'Main Menu' });
        this.add.existing(title);

        // Derived from the title's actual (auto-computed) height + a gap,
        // rather than a second independent magic number — otherwise the
        // two drift out of sync and the panel overlaps the title.
        const gapBelowTitle = toDevicePixels(20);
        const panelWidth = toDevicePixels(380);
        const panelHeight = toDevicePixels(230);
        const panelY = titleY + title.height / 2 + gapBelowTitle + panelHeight / 2;
        this.add.nineslice(
            width / 2,
            panelY,
            UI_ATLAS_KEY,
            UI_FRAMES.panelWood,
            panelWidth,
            panelHeight,
            PANEL_SLICE.left,
            PANEL_SLICE.right,
            PANEL_SLICE.top,
            PANEL_SLICE.bottom,
        );

        const buttonWidth = toDevicePixels(220);
        const buttonHeight = toDevicePixels(52);

        const playButton = new Button(this, width / 2, panelY - toDevicePixels(35), {
            label: 'Играть',
            width: buttonWidth,
            height: buttonHeight,
            onClick: () => this.scene.start('Game'),
        });
        this.add.existing(playButton);

        const settingsButton = new Button(this, width / 2, panelY + toDevicePixels(35), {
            label: 'Настройки',
            width: buttonWidth,
            height: buttonHeight,
            onClick: () => this.scene.start('Settings'),
        });
        this.add.existing(settingsButton);

        new GamepadNavigator(this).setItems([playButton, settingsButton]);
    }
}
