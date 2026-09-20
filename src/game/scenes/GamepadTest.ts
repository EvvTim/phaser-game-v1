import { Scene } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import { EVENTS } from '../events/GameEvents';
import { EventBus } from '../events/EventBus';
import { getLanguage, t } from '../i18n/i18n';
import { GamepadNavigator } from '../input/GamepadNavigator';
import { GamepadHint } from '../ui/GamepadHint';
import { getPromptFrame } from '../ui/gamepadPrompts';
import { GamepadTester } from '../ui/GamepadTester';
import { addSettingsBackdrop } from '../ui/settingsBackdrop';
import { drawSettingsDecor } from '../ui/settingsDecor';
import { computeSettingsLayout, type SettingsEntry } from '../ui/settingsLayout';
import { SETTINGS_COLORS } from '../ui/settingsTheme';
import { restartSceneOnResize } from '../ui/restartSceneOnResize';
import { TextButton } from '../ui/TextButton';
import { gameTextStyle } from '../ui/textStyle';

/** The settings block this screen borrows its frame from — seven rows of room for the tester between title and action. */
const FRAME: readonly SettingsEntry[] = Array.from({ length: 7 }, () => 'row');

/**
 * DEV-only screen (opened from a DEV-only row of Settings; the scene is only
 * registered under `IS_DEV`, see game/main.ts): the live gamepad tester, which
 * lights up every button of a connected controller as it is pressed. Uses the
 * settings screens' backdrop and frame.
 */
export class GamepadTest extends Scene {
    constructor() {
        super('GamepadTest');
    }

    create(): void {
        const { width, height } = this.scale;

        EventBus.emit(EVENTS.MUSIC_MENU_START);

        const layout = computeSettingsLayout(width, height, FRAME);
        const { metrics } = layout;

        addSettingsBackdrop(this);
        drawSettingsDecor(this, layout);

        this.add
            .text(
                layout.title.x,
                layout.title.y,
                t('settings.controls.tester').toLocaleUpperCase(getLanguage()),
                gameTextStyle({
                    fontSize: metrics.titleFontSize,
                    color: SETTINGS_COLORS.creamCss,
                    letterSpacing: 4 * layout.unit,
                }),
            )
            .setOrigin(0.5);

        this.add.existing(new GamepadTester(this, layout.centerX, layout.titleRules.below.y + 24 * layout.unit));

        const confirmHint = new GamepadHint(this, layout.hints.confirm.x, layout.hints.confirm.y);
        this.add.existing(confirmHint);
        const backHint = new GamepadHint(this, layout.hints.back.x, layout.hints.back.y);
        this.add.existing(backHint);

        const goBack = (): void => {
            emitUiSound('back');
            this.scene.start('Settings');
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

        const backButton = new TextButton(this, layout.action.x, layout.action.y, {
            label: t('common.back').toLocaleUpperCase(getLanguage()),
            fontSize: metrics.actionFontSize,
            color: SETTINGS_COLORS.creamCss,
            frameStroke: metrics.frameStroke,
            framePadding: metrics.framePadding,
            sound: 'back',
            onClick: goBack,
            onHover: (item) => navigator.focusItem(item),
        });
        this.add.existing(backButton);
        navigator.setItems([backButton]);

        restartSceneOnResize(this);
    }
}
