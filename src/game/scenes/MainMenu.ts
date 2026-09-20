import { Scene } from 'phaser';
import { version } from '../../../package.json';
import type { UiSoundKind } from '../audio/uiSounds';
import { toDevicePixels } from '../config/pixelRatio';
import { EventBus } from '../events/EventBus';
import { EVENTS } from '../events/GameEvents';
import { getLanguage, t } from '../i18n/i18n';
import { attachGamepadLogger } from '../input/gamepadLogger';
import { GamepadNavigator } from '../input/GamepadNavigator';
import { getPromptFrame } from '../ui/gamepadPrompts';
import { GamepadHint } from '../ui/GamepadHint';
import {
    computeMainMenuLayout,
    computeSideShade,
    type DisplayedBackground,
} from '../ui/mainMenuLayout';
import { addMainMenuBackground } from '../ui/mainMenuBackground';
import { addMainMenuEffects } from '../ui/mainMenuEffects';
import { MenuItem } from '../ui/MenuItem';
import { restartSceneOnResize } from '../ui/restartSceneOnResize';
import { gameTextStyle } from '../ui/textStyle';

interface MainMenuEntry {
    label: string;
    scene: string;
    sound: UiSoundKind;
}

/** The menu's options, top to bottom. Only Play and Settings for now. */
function getEntries(): MainMenuEntry[] {
    return [
        { label: t('mainMenu.play'), scene: 'Game', sound: 'confirm' },
        { label: t('mainMenu.settings'), scene: 'Settings', sound: 'select' },
    ];
}

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width, height } = this.scale;

        attachGamepadLogger(this);
        EventBus.emit(EVENTS.MUSIC_MENU_START);

        const background = addMainMenuBackground(this);
        this.addSideShade(width, height, background);
        addMainMenuEffects(this, background);

        const entries = getEntries();
        const layout = computeMainMenuLayout(width, height, entries.length);
        const confirmHint = new GamepadHint(this, layout.hint.x, layout.hint.y);
        this.add.existing(confirmHint);

        const navigator = new GamepadNavigator(this, {
            onGamepadStatusChange: (mapping) => {
                if (mapping) {
                    confirmHint.show(getPromptFrame(mapping.family, 'confirm'), t('hints.confirm').toLocaleUpperCase(getLanguage()));
                } else {
                    confirmHint.hide();
                }
            },
        });

        const items = entries.map((entry, index) => {
            const slot = layout.items[index];
            const item: MenuItem = new MenuItem(this, slot.x, slot.y, {
                label: entry.label.toLocaleUpperCase(getLanguage()),
                idle: slot.idle,
                active: slot.active,
                sound: entry.sound,
                onClick: () => this.scene.start(entry.scene),
                onHover: () => navigator.focusItem(item),
            });
            this.add.existing(item);
            return item;
        });

        this.add
            .text(
                layout.version.x,
                layout.version.y,
                version,
                gameTextStyle({ fontSize: toDevicePixels(14), color: '#c9cbe0' }),
            )
            .setOrigin(0, 1)
            .setAlpha(0.7);

        navigator.setItems(items);

        // The background and the item textures are sized once — rebuild on a real resize.
        restartSceneOnResize(this);
    }

    /**
     * Darkens everything but the characters — the whole left side up to them, plus a
     * light shade on the far right edge — with two horizontal alpha gradients
     * (Graphics' native gradient fill, so no filter render pass). Sits above the
     * background and below the menu, so the items themselves stay bright.
     */
    private addSideShade(width: number, height: number, background: DisplayedBackground): void {
        const { left, right } = computeSideShade(width, background);
        const shade = this.add.graphics();

        shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, left.alpha, 0, left.alpha, 0);
        shade.fillRect(0, 0, left.width, height);

        shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, right.alpha, 0, right.alpha);
        shade.fillRect(width - right.width, 0, right.width, height);
    }
}
