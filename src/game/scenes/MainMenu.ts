import { Geom, Scale, Scene, Scenes } from 'phaser';
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
    MAIN_MENU_BG_KEY,
    type DisplayedBackground,
} from '../ui/mainMenuLayout';
import { MenuItem } from '../ui/MenuItem';

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

        const background = this.addBackground(width, height);
        this.addSideShade(width, height, background);

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
            .text(layout.version.x, layout.version.y, version, {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(14),
                color: '#c9cbe0',
            })
            .setOrigin(0, 1)
            .setAlpha(0.7);

        navigator.setItems(items);

        // The canvas is resized with the window (see game/main.ts), but the
        // background and the item textures are sized once — rebuild the scene.
        const onResize = (): void => {
            this.scene.restart();
        };
        this.scale.on(Scale.Events.RESIZE, onResize);
        this.events.once(Scenes.Events.SHUTDOWN, () => {
            this.scale.off(Scale.Events.RESIZE, onResize);
        });
    }

    /**
     * Full-screen "cover" background: fills the window and crops the overflow.
     * Centred horizontally but pinned to the top, so on a wide window the crop
     * comes off the bottom (rocks) and never cuts the robot's head.
     * Mirrored so the characters stand on the right, clear of the menu list on the left.
     */
    private addBackground(width: number, height: number): DisplayedBackground {
        const image = this.add.image(width / 2, 0, MAIN_MENU_BG_KEY).setOrigin(0.5, 0).setFlipX(true);

        const view = new Geom.Rectangle(0, 0, width, height);
        const fitted = Geom.Rectangle.FitOutside(new Geom.Rectangle(0, 0, image.width, image.height), view);
        image.setDisplaySize(fitted.width, fitted.height);

        return { x: image.x - image.displayWidth / 2, width: image.displayWidth };
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
