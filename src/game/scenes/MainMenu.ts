import { type GameObjects, Scene } from 'phaser';
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
import { fadeCameraIn, fadeCameraOutThen, MOTION, motionMs, prefersReducedMotion, tweenIn, tweenOut } from '../ui/motion';
import { restartSceneOnResize } from '../ui/restartSceneOnResize';
import { gameTextStyle } from '../ui/textStyle';

interface MainMenuEntry {
    label: string;
    scene: string;
    sound: UiSoundKind;
    /** Leave by fading the whole screen out (into gameplay) rather than just sliding the menu away. */
    fadeOut: boolean;
}

interface MainMenuSceneData {
    /** Play the entrance animation (default). A rebuild of the same screen — a resize — passes `false`. */
    animate?: boolean;
    /** Arrive from a faded-out scene (the preloader, the settings): fade the camera in. */
    fade?: boolean;
}

/** How far (CSS px) the menu items slide in from the left, and out to it. */
const ITEM_SLIDE = 90;

/** The artwork settles from this much larger to its real size on entrance (it ends exactly where the settings screens draw it). */
const BACKGROUND_SETTLE = 1.05;

/** The menu's options, top to bottom. Only Play and Settings for now. */
function getEntries(): MainMenuEntry[] {
    return [
        { label: t('mainMenu.play'), scene: 'Game', sound: 'confirm', fadeOut: true },
        { label: t('mainMenu.settings'), scene: 'Settings', sound: 'select', fadeOut: false },
    ];
}

export class MainMenu extends Scene {
    private animate = true;
    private fade = false;
    private leaving = false;
    private items: MenuItem[] = [];
    private extras: (GameObjects.Text | GamepadHint)[] = [];

    constructor() {
        super('MainMenu');
    }

    init(data: MainMenuSceneData): void {
        this.animate = (data.animate ?? true) && !prefersReducedMotion();
        this.fade = data.fade ?? false;
        this.leaving = false;
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
                onClick: () => this.leaveTo(entry),
                onHover: () => navigator.focusItem(item),
            });
            this.add.existing(item);
            return item;
        });

        const versionLabel = this.add
            .text(
                layout.version.x,
                layout.version.y,
                version,
                gameTextStyle({ fontSize: toDevicePixels(14), color: '#c9cbe0' }),
            )
            .setOrigin(0, 1)
            .setAlpha(0.7);

        navigator.setItems(items);

        this.items = items;
        this.extras = [versionLabel, confirmHint];
        if (this.animate) {
            this.playEntrance(background.image);
        } else if (this.fade) {
            fadeCameraIn(this);
        }

        // The background and the item textures are sized once — rebuild on a real resize.
        restartSceneOnResize(this, () => ({ animate: false }));
    }

    /**
     * The menu arrives: the camera fades in when coming from a faded-out scene, the artwork
     * settles from slightly zoomed in to its real size, the items slide in from the left one
     * after another, and the version and the gamepad hint fade in last.
     */
    private playEntrance(artwork: GameObjects.Image): void {
        if (this.fade) {
            fadeCameraIn(this);
        }

        const { scaleX, scaleY } = artwork;
        artwork.setScale(scaleX * BACKGROUND_SETTLE, scaleY * BACKGROUND_SETTLE);
        this.tweens.add({ targets: artwork, scaleX, scaleY, duration: motionMs(1600), ease: 'Sine.easeOut' });

        tweenIn(this, this.items, { dx: -toDevicePixels(ITEM_SLIDE), delay: motionMs(220), stagger: motionMs(110), duration: motionMs(540) });
        tweenIn(this, this.extras, { delay: motionMs(760), duration: MOTION.enterMs, stagger: 0 });
    }

    /** Leaves for the chosen scene: the items slide away to the left (and, into gameplay, the whole screen fades to black). */
    private leaveTo(entry: MainMenuEntry): void {
        if (this.leaving) {
            return;
        }
        this.leaving = true;
        this.input.enabled = false;

        const go = (): void => {
            this.scene.start(entry.scene);
        };

        tweenOut(this, this.extras, { duration: MOTION.exitMs, stagger: 0 });
        if (entry.fadeOut) {
            tweenOut(this, this.items, { dx: -toDevicePixels(ITEM_SLIDE), stagger: motionMs(60) });
            fadeCameraOutThen(this, go);
        } else {
            tweenOut(this, this.items, { dx: -toDevicePixels(ITEM_SLIDE), stagger: motionMs(60) }, go);
        }
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
