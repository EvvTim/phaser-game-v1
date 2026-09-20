import { GameObjects, Scene, Scenes } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import { MUSIC_TRACK_IDS } from '../audio/musicTracks';
import { IS_DEV } from '../config/devMode';
import { RENDER_QUALITIES } from '../config/pixelRatio';
import { EVENTS } from '../events/GameEvents';
import { EventBus } from '../events/EventBus';
import { getLanguage, t } from '../i18n/i18n';
import { LANGUAGES, LANGUAGE_NATIVE_NAMES } from '../i18n/languages';
import { GamepadNavigator } from '../input/GamepadNavigator';
import type { NavigableItem } from '../input/NavigableItem';
import { getSettingsChangeEffect } from '../settings/settingsChange';
import { SettingsStore } from '../settings/SettingsStore';
import type { Settings as GameSettings } from '../settings/settingsSchema';
import {
    getVisibleSections,
    resolveSection,
    stepSection,
    type SettingsSectionKey,
} from '../settings/settingsSections';
import { ArrowSelector } from '../ui/ArrowSelector';
import { ChoiceChips } from '../ui/ChoiceChips';
import { GamepadHint } from '../ui/GamepadHint';
import { getPromptFrame } from '../ui/gamepadPrompts';
import { LineSlider } from '../ui/LineSlider';
import { restartSceneOnResize } from '../ui/restartSceneOnResize';
import {
    disableInputDeep,
    fadeCameraIn,
    fadeCameraOutThen,
    MOTION,
    motionMs,
    prefersReducedMotion,
    tweenIn,
    tweenOut,
    type Tweenable,
} from '../ui/motion';
import { createSettingsFrame } from '../ui/settingsFrame';
import { drawHeadingRules, playDecorOut, settingsSlideDistance, type SettingsDecor } from '../ui/settingsDecor';
import { computeSettingsLayout, type SettingsEntry, type SettingsLayout } from '../ui/settingsLayout';
import { SETTINGS_COLORS } from '../ui/settingsTheme';
import { TextButton } from '../ui/TextButton';
import { toDevicePixels } from '../config/pixelRatio';
import { gameTextStyle } from '../ui/textStyle';

/** Controls is DEV-only (it just opens the gamepad tester), so it is missing from production builds. */
const SECTIONS = getVisibleSections(IS_DEV);

/**
 * Every section is a heading plus this many rows at most — Audio, the
 * longest, has a music track and three volumes (Display and Language have one row each). The page frame is sized for
 * it, so the title, tabs and Back action don't jump when switching tabs.
 */
const MAX_SECTION_ROWS = 4;
const FRAME: readonly SettingsEntry[] = ['heading', ...Array.from({ length: MAX_SECTION_ROWS }, () => 'row' as const)];

interface SettingsSceneData {
    section?: SettingsSectionKey;
    /** Play the entrance animation (default). A rebuild of the same screen — a language change, a resize — passes `false`. */
    animate?: boolean;
    /** Arrive from a faded-out scene: fade the camera in. */
    fade?: boolean;
}

/**
 * The settings screen, in the chalkboard style of examples/settings-menu-example.png:
 * the title, a row of section tabs (Display, Language, Audio, and in DEV
 * Controls), then the active section — its heading and `label  control` rows.
 * Tabs are clicked, or switched with the gamepad's L / R shoulders; they are
 * deliberately not D-pad targets, so the D-pad only walks the section's
 * controls. Every setting applies at once and is saved by SettingsStore, so
 * there is nothing to confirm — the action at the bottom just goes back.
 *
 * Controls (`ChoiceChips`, `ArrowSelector`, `LineSlider`, `TextButton`) are
 * gamepad-navigable and update themselves in place; the scene only restarts
 * for changes that alter how the UI is built (see getSettingsChangeEffect).
 */
export class Settings extends Scene {
    private activeSection: SettingsSectionKey = 'display';
    private layout!: SettingsLayout;
    private content!: GameObjects.Container;
    private tabs!: ChoiceChips<SettingsSectionKey>;
    private navigator!: GamepadNavigator;
    private backButton!: TextButton;
    private decor!: SettingsDecor;
    private animate = true;
    private fade = false;
    private leaving = false;

    constructor() {
        super('Settings');
    }

    init(data: SettingsSceneData): void {
        this.activeSection = resolveSection(data.section, SECTIONS);
        this.animate = (data.animate ?? true) && !prefersReducedMotion();
        this.fade = data.fade ?? false;
        this.leaving = false;
    }

    create(): void {
        const { width, height } = this.scale;

        // Keeps the menu music going if this scene is entered directly, and
        // lets the Audio scene follow the settings changed here.
        EventBus.emit(EVENTS.MUSIC_MENU_START);

        const layout = computeSettingsLayout(width, height, FRAME, { tabs: true });
        this.layout = layout;
        const { metrics } = layout;

        if (this.fade) {
            fadeCameraIn(this);
        }

        const frame = createSettingsFrame(this, layout, t('settings.title').toLocaleUpperCase(getLanguage()), this.animate);
        this.decor = frame.decor;

        // The controls of the active section live here, so a tab switch can rebuild them.
        this.content = this.add.container(0, 0);

        this.addTabs(layout);

        const goBack = (): void => {
            emitUiSound('back');
            this.leaveTo('MainMenu');
        };

        // Only shown while a gamepad is connected; the icons match the controller's brand.
        const tabsY = layout.tabsY ?? 0;
        const tabHintOffset = this.tabs.totalWidth / 2 + 70 * layout.unit;
        const leftTabHint = this.addHint(layout.centerX - tabHintOffset, tabsY);
        const rightTabHint = this.addHint(layout.centerX + tabHintOffset, tabsY);
        const confirmHint = this.addHint(layout.hints.confirm.x, layout.hints.confirm.y);
        const backHint = this.addHint(layout.hints.back.x, layout.hints.back.y);

        this.navigator = new GamepadNavigator(this, {
            onBack: goBack,
            onShoulderLeft: () => this.cycleSection(-1),
            onShoulderRight: () => this.cycleSection(1),
            onGamepadStatusChange: (mapping) => {
                if (mapping) {
                    leftTabHint.show(getPromptFrame(mapping.family, 'shoulderLeft'));
                    rightTabHint.show(getPromptFrame(mapping.family, 'shoulderRight'));
                    confirmHint.show(getPromptFrame(mapping.family, 'confirm'), t('hints.confirm'));
                    backHint.show(getPromptFrame(mapping.family, 'back'), t('hints.back'));
                } else {
                    for (const hint of [leftTabHint, rightTabHint, confirmHint, backHint]) {
                        hint.hide();
                    }
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
            onHover: (item) => this.navigator.focusItem(item),
        });
        this.add.existing(this.backButton);

        this.renderSection(this.animate ? { dy: toDevicePixels(20), delay: motionMs(430) } : null);

        if (this.animate) {
            tweenIn(this, this.tabs.items, { dy: -toDevicePixels(14), delay: motionMs(300), stagger: motionMs(60) });
            tweenIn(this, [this.backButton], { dy: toDevicePixels(14), delay: motionMs(640) });
            tweenIn(this, [leftTabHint, rightTabHint, confirmHint, backHint], { delay: motionMs(760), stagger: 0 });
        }

        // A render-quality or language change rebuilds this scene so its UI is redrawn at the new
        // pixel ratio / language (main.ts applies the change first — its SETTINGS_CHANGED listener
        // is registered before any scene's). Anything else is already shown by the control that
        // made it (see getSettingsChangeEffect).
        let previousSettings = SettingsStore.get();
        const onSettingsChanged = (settings: GameSettings): void => {
            const effect = getSettingsChangeEffect(previousSettings, settings);
            previousSettings = settings;

            if (effect === 'restart') {
                this.scene.restart({ section: this.activeSection, animate: false });
            }
        };
        EventBus.on(EVENTS.SETTINGS_CHANGED, onSettingsChanged);
        this.events.once(Scenes.Events.SHUTDOWN, () => {
            EventBus.off(EVENTS.SETTINGS_CHANGED, onSettingsChanged);
        });
        restartSceneOnResize(this, () => ({ section: this.activeSection, animate: false }));
    }

    private addHint(x: number, y: number): GamepadHint {
        const hint = new GamepadHint(this, x, y);
        this.add.existing(hint);
        return hint;
    }

    /** The tab row under the title, centred; tabs are never registered with the gamepad navigator. */
    private addTabs(layout: SettingsLayout): void {
        const { metrics } = layout;

        this.tabs = new ChoiceChips<SettingsSectionKey>(this, 0, layout.tabsY ?? 0, {
            options: SECTIONS.map((key) => ({
                value: key,
                label: t(`settings.sections.${key}`).toLocaleUpperCase(getLanguage()),
            })),
            value: this.activeSection,
            metrics: {
                fontSize: metrics.tabFontSize,
                paddingX: metrics.tabPaddingX,
                paddingY: metrics.chipPaddingY,
                frameStroke: metrics.frameStroke,
                framePadding: metrics.framePadding,
                letterSpacing: metrics.tabLetterSpacing,
            },
            gap: metrics.tabGap,
            // Switching tabs sounds like moving focus; L / R switches play the same sound.
            sound: 'navigate',
            onSelect: (key) => this.selectSection(key),
        });
        this.tabs.setX(layout.centerX - this.tabs.totalWidth / 2);
        this.add.existing(this.tabs);
    }

    /**
     * Switches to another section. The old page and the new one exist side by
     * side for a moment — the old drifts away and fades, the new arrives from
     * the opposite side (which way depends on the tabs' order) — so switching
     * quickly can't leave anything half-built.
     */
    private selectSection(key: SettingsSectionKey): void {
        if (key === this.activeSection || this.leaving) {
            return;
        }

        const direction = SECTIONS.indexOf(key) > SECTIONS.indexOf(this.activeSection) ? 1 : -1;
        const slide = settingsSlideDistance();

        this.activeSection = key;
        this.tabs.setValue(key, true);

        const outgoing = this.content;
        this.content = this.add.container(0, 0);
        this.renderSection({ dx: direction * slide, delay: motionMs(70), duration: MOTION.sectionInMs, stagger: motionMs(45) });

        disableInputDeep(outgoing);
        tweenOut(this, [outgoing], { dx: -direction * slide, duration: MOTION.sectionOutMs }, () => outgoing.destroy());
    }

    /** L / R shoulder buttons step between sections (wrapping), independent of D-pad focus. */
    private cycleSection(delta: number): void {
        const next = stepSection(this.activeSection, SECTIONS, delta);
        if (next !== this.activeSection) {
            emitUiSound('navigate');
            this.selectSection(next);
        }
    }

    /**
     * Fills the content container with the active section and points the
     * navigator at it. `entrance` staggers the elements in from an offset;
     * `null` shows them at once.
     */
    private renderSection(entrance: { dx?: number; dy?: number; delay?: number; duration?: number; stagger?: number } | null): void {
        const items = this.buildSection(this.activeSection);

        if (entrance) {
            tweenIn(this, this.content.list as unknown as Tweenable[], entrance);
        }

        // Focus starts on the section's first control (or Back, if it has none).
        this.navigator.setItems([...items, this.backButton]);
    }

    /** Leaves for another scene: this screen's elements drift away, the ornaments shrink and the camera fades. */
    private leaveTo(sceneKey: string): void {
        if (this.leaving) {
            return;
        }
        this.leaving = true;
        this.input.enabled = false;

        const rise = -toDevicePixels(14);
        tweenOut(this, [this.content, this.tabs, this.backButton], { dy: rise, stagger: motionMs(40) });
        playDecorOut(this, this.decor);
        fadeCameraOutThen(this, () => this.scene.start(sceneKey, { fade: true }));
    }

    /** The section's heading and rows; returns their navigable controls, top to bottom. */
    private buildSection(section: SettingsSectionKey): NavigableItem[] {
        const layout = this.layout;
        const { metrics } = layout;
        const { display, language, audio } = SettingsStore.get();
        const focusOnHover = (item: NavigableItem): void => this.navigator.focusItem(item);
        const items: NavigableItem[] = [];
        let row = 0;

        /** Adds a game object to the section's container, so a tab switch removes it. */
        const put = <T extends GameObjects.GameObject>(object: T): T => {
            this.content.add(object);
            return object;
        };

        /** The section title, centred between two thin rules, quieter than the row labels. */
        const addHeading = (label: string): void => {
            const y = layout.headingYs[0];
            const heading = put(
                this.add
                    .text(
                        layout.centerX,
                        y,
                        label.toLocaleUpperCase(getLanguage()),
                        gameTextStyle({
                            fontSize: metrics.headingFontSize,
                            color: SETTINGS_COLORS.idleCss,
                            letterSpacing: metrics.headingLetterSpacing,
                        }),
                    )
                    .setOrigin(0.5),
            );
            put(drawHeadingRules(this, layout, y, heading.width));
        };

        /** A row's right-aligned label; returns the row's vertical centre. */
        const addRowLabel = (label: string): number => {
            const y = layout.rowYs[row];
            row += 1;
            put(
                this.add
                    .text(
                        layout.labelRightX,
                        y,
                        label,
                        gameTextStyle({ fontSize: metrics.labelFontSize, color: SETTINGS_COLORS.creamCss }),
                    )
                    .setOrigin(1, 0.5),
            );
            return y;
        };

        const chipMetrics = {
            fontSize: metrics.controlFontSize,
            paddingX: metrics.chipPaddingX,
            paddingY: metrics.chipPaddingY,
            frameStroke: metrics.frameStroke,
            framePadding: metrics.framePadding,
        };
        const addChips = <T extends string>(
            label: string,
            values: readonly T[],
            labelOf: (value: T) => string,
            current: T,
            onSelect: (value: T) => void,
        ): void => {
            const chips = put(
                new ChoiceChips<T>(this, layout.controlLeftX, addRowLabel(label), {
                    options: values.map((value) => ({ value, label: labelOf(value) })),
                    value: current,
                    metrics: chipMetrics,
                    gap: metrics.chipGap,
                    onSelect,
                    onHover: focusOnHover,
                }),
            );
            items.push(...chips.items);
        };

        const selectorWidth = metrics.selectorFieldWidth + metrics.arrowSize * 3;
        const addSelector = <T extends string>(
            label: string,
            values: readonly T[],
            labelOf: (value: T) => string,
            current: T,
            onSelect: (value: T) => void,
        ): void => {
            const selector = put(
                new ArrowSelector<T>(this, layout.controlLeftX + selectorWidth / 2, addRowLabel(label), {
                    options: values.map((value) => ({ value, label: labelOf(value) })),
                    value: current,
                    fieldWidth: metrics.selectorFieldWidth,
                    arrowSize: metrics.arrowSize,
                    fontSize: metrics.controlFontSize,
                    frameStroke: metrics.frameStroke,
                    framePadding: metrics.framePadding,
                    onSelect,
                    onHover: focusOnHover,
                }),
            );
            items.push(selector);
        };

        const sliderCenterX = layout.controlLeftX + metrics.sliderLineWidth / 2 + metrics.sliderHandleSize / 2;
        const previewSound = (): void => emitUiSound('select');
        const addSlider = (label: string, value: number, onChange: (value: number) => void, preview: boolean): void => {
            const slider = put(
                new LineSlider(this, sliderCenterX, addRowLabel(label), {
                    value,
                    lineWidth: metrics.sliderLineWidth,
                    lineThickness: metrics.sliderLineThickness,
                    handleSize: metrics.sliderHandleSize,
                    fontSize: metrics.controlFontSize,
                    frameStroke: metrics.frameStroke,
                    framePadding: metrics.framePadding,
                    valueRightX: layout.controlLeftX + layout.controlWidth - sliderCenterX,
                    onChange,
                    onCommit: preview ? previewSound : undefined,
                    onHover: focusOnHover,
                }),
            );
            items.push(slider);
        };

        addHeading(t(`settings.sections.${section}`));

        switch (section) {
            case 'display':
                addChips(
                    t('settings.display.renderQuality'),
                    RENDER_QUALITIES,
                    (value) => t(`settings.display.quality.${value}`),
                    display.renderQuality,
                    (renderQuality) => SettingsStore.setDisplay({ renderQuality }),
                );
                break;

            case 'language':
                addSelector(
                    t('settings.language.heading'),
                    LANGUAGES,
                    (locale) => LANGUAGE_NATIVE_NAMES[locale],
                    language.locale,
                    (locale) => SettingsStore.setLanguage({ locale }),
                );
                break;

            case 'audio':
                addSelector(
                    t('settings.audio.musicTrack'),
                    MUSIC_TRACK_IDS,
                    (id) => t('settings.audio.track', { number: MUSIC_TRACK_IDS.indexOf(id) + 1 }),
                    audio.musicTrack,
                    (musicTrack) => SettingsStore.setAudio({ musicTrack }),
                );
                // Master and effects play a `select` preview on release so the new level can be heard.
                addSlider(
                    t('settings.audio.masterVolume'),
                    audio.masterVolume,
                    (masterVolume) => SettingsStore.setAudio({ masterVolume }),
                    true,
                );
                addSlider(
                    t('settings.audio.musicVolume'),
                    audio.musicVolume,
                    (musicVolume) => SettingsStore.setAudio({ musicVolume }),
                    false,
                );
                addSlider(
                    t('settings.audio.sfxVolume'),
                    audio.sfxVolume,
                    (sfxVolume) => SettingsStore.setAudio({ sfxVolume }),
                    true,
                );
                break;

            case 'controls': {
                const y = addRowLabel(t('settings.controls.tester'));
                const open = put(
                    new TextButton(this, 0, y, {
                        label: t('common.open').toLocaleUpperCase(getLanguage()),
                        fontSize: metrics.controlFontSize,
                        frameStroke: metrics.frameStroke,
                        framePadding: metrics.framePadding,
                        onClick: () => this.leaveTo('GamepadTest'),
                        onHover: focusOnHover,
                    }),
                );
                open.setX(layout.controlLeftX + open.width / 2);
                items.push(open);
                break;
            }
        }

        return items;
    }
}
