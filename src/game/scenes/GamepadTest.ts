import { Scene } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import { toDevicePixels } from '../config/pixelRatio';
import { EVENTS } from '../events/GameEvents';
import { EventBus } from '../events/EventBus';
import { getLanguage, t } from '../i18n/i18n';
import { GamepadNavigator } from '../input/GamepadNavigator';
import { GamepadHint } from '../ui/GamepadHint';
import { getPromptFrame } from '../ui/gamepadPrompts';
import { GamepadTester } from '../ui/GamepadTester';
import { fadeCameraIn, fadeCameraOutThen, motionMs, prefersReducedMotion, tweenIn, tweenOut } from '../ui/motion';
import { restartSceneOnResize } from '../ui/restartSceneOnResize';
import { playDecorOut, type SettingsDecor } from '../ui/settingsDecor';
import { createSettingsFrame } from '../ui/settingsFrame';
import { computeSettingsLayout, type SettingsEntry } from '../ui/settingsLayout';
import { SETTINGS_COLORS } from '../ui/settingsTheme';
import { TextButton } from '../ui/TextButton';

/** The settings block this screen borrows its frame from — seven rows of room for the tester between title and action. */
const FRAME: readonly SettingsEntry[] = Array.from({ length: 7 }, () => 'row');

interface GamepadTestSceneData {
    /** Play the entrance animation (default); a rebuild after a resize passes `false`. */
    animate?: boolean;
    fade?: boolean;
}

/**
 * DEV-only screen (opened from a DEV-only row of Settings; the scene is only
 * registered under `IS_DEV`, see game/main.ts): the live gamepad tester, which
 * lights up every button of a connected controller as it is pressed. Uses the
 * settings screens' backdrop, frame and motion.
 */
export class GamepadTest extends Scene {
    private animate = true;
    private fade = false;
    private leaving = false;
    private decor!: SettingsDecor;
    private tester!: GamepadTester;
    private backButton!: TextButton;

    constructor() {
        super('GamepadTest');
    }

    init(data: GamepadTestSceneData): void {
        this.animate = (data.animate ?? true) && !prefersReducedMotion();
        this.fade = data.fade ?? false;
        this.leaving = false;
    }

    create(): void {
        const { width, height } = this.scale;

        EventBus.emit(EVENTS.MUSIC_MENU_START);

        const layout = computeSettingsLayout(width, height, FRAME);
        const { metrics } = layout;

        if (this.fade) {
            fadeCameraIn(this);
        }

        const frame = createSettingsFrame(this, layout, t('settings.controls.tester').toLocaleUpperCase(getLanguage()), this.animate);
        this.decor = frame.decor;

        this.tester = new GamepadTester(this, layout.centerX, layout.titleRules.below.y + 24 * layout.unit);
        this.add.existing(this.tester);

        const confirmHint = new GamepadHint(this, layout.hints.confirm.x, layout.hints.confirm.y);
        this.add.existing(confirmHint);
        const backHint = new GamepadHint(this, layout.hints.back.x, layout.hints.back.y);
        this.add.existing(backHint);

        const goBack = (): void => {
            emitUiSound('back');
            this.leaveToSettings();
        };

        const navigator = new GamepadNavigator(this, {
            onBack: goBack,
            onGamepadStatusChange: (mapping) => {
                if (mapping) {
                    confirmHint.show(getPromptFrame(mapping.family, 'confirm'), t('hints.confirm'));
                    backHint.show(getPromptFrame(mapping.family, 'back'), t('hints.back'));
                } else {
                    confirmHint.hide();
                    backHint.hide();
                }
            },
        });

        this.backButton = new TextButton(this, layout.action.x, layout.action.y, {
            label: t('common.back').toLocaleUpperCase(getLanguage()),
            fontSize: metrics.actionFontSize,
            color: SETTINGS_COLORS.creamCss,
            frameStroke: metrics.frameStroke,
            framePadding: metrics.framePadding,
            sound: 'back',
            onClick: goBack,
            onHover: (item) => navigator.focusItem(item),
        });
        this.add.existing(this.backButton);
        navigator.setItems([this.backButton]);

        if (this.animate) {
            tweenIn(this, [this.tester], { dy: toDevicePixels(20), delay: motionMs(430) });
            tweenIn(this, [this.backButton], { dy: toDevicePixels(14), delay: motionMs(640) });
            tweenIn(this, [confirmHint, backHint], { delay: motionMs(760), stagger: 0 });
        }

        restartSceneOnResize(this, () => ({ animate: false }));
    }

    private leaveToSettings(): void {
        if (this.leaving) {
            return;
        }
        this.leaving = true;
        this.input.enabled = false;

        tweenOut(this, [this.tester, this.backButton], { dy: -toDevicePixels(14), stagger: motionMs(40) });
        playDecorOut(this, this.decor);
        fadeCameraOutThen(this, () => this.scene.start('Settings', { fade: true }));
    }
}
