import { GameObjects, Scene, Scenes } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import { MUSIC_TRACK_IDS } from '../audio/musicTracks';
import { IS_DEV } from '../config/devMode';
import { GLOW_QUALITIES } from '../config/glowQuality';
import { RENDER_QUALITIES, toDevicePixels } from '../config/pixelRatio';
import { EVENTS } from '../events/GameEvents';
import { EventBus } from '../events/EventBus';
import { t } from '../i18n/i18n';
import { LANGUAGES, LANGUAGE_NATIVE_NAMES } from '../i18n/languages';
import { GamepadNavigator } from '../input/GamepadNavigator';
import { getSettingsChangeEffect } from '../settings/settingsChange';
import { SettingsStore } from '../settings/SettingsStore';
import type { Settings as GameSettings } from '../settings/settingsSchema';
import { getVisibleTabs, resolveActiveTab, type SettingsTabKey } from '../settings/settingsTabs';
import { Button } from '../ui/Button';
import { GamepadHint } from '../ui/GamepadHint';
import { GamepadTester } from '../ui/GamepadTester';
import { getPromptFrame } from '../ui/gamepadPrompts';
import { SectionHeading } from '../ui/SectionHeading';
import { TabBar } from '../ui/TabBar';
import { Title } from '../ui/Title';
import { UI_ATLAS_KEY, UI_FRAMES } from '../ui/uiAtlas';
import { VolumeSlider } from '../ui/VolumeSlider';
import { PANEL_SLICE } from '../ui/panelSlice';

/** The Controls tab (the gamepad tester) is DEV-only, so it's missing from production builds. */
const TABS = getVisibleTabs(IS_DEV);

type TabKey = SettingsTabKey;

/** Vertical distance (CSS px) between stacked option rows in a settings tab. */
const OPTION_ROW_SPACING = 100;

/** Panel height (CSS px) per tab: the Audio tab stacks a track row and three volume rows, so it's taller. */
const DEFAULT_PANEL_HEIGHT = 330;
const PANEL_HEIGHTS: Partial<Record<TabKey, number>> = { audio: 450 };

/** Vertical offsets (CSS px, in the content area) of the Audio tab's three volume rows. */
const VOLUME_ROWS_TOP = 140;
const VOLUME_ROW_SPACING = 60;

interface OptionRowItem<T extends string> {
    value: T;
    label: string;
}

interface SettingsSceneData {
    activeTab?: TabKey;
}

export class Settings extends Scene {
    private tabBar!: TabBar;
    private content!: GameObjects.Container;
    private backButton!: Button;
    private navigator!: GamepadNavigator;
    private panel!: GameObjects.NineSlice;
    private panelTop = 0;
    private activeTab: TabKey = 'display';

    constructor() {
        super('Settings');
    }

    init(data: SettingsSceneData): void {
        this.activeTab = resolveActiveTab(data.activeTab, TABS);
    }

    create(): void {
        const { width, height } = this.scale;

        // Keeps the menu music going if this scene is entered directly, and
        // lets the Audio scene follow the track picked in the Audio tab.
        EventBus.emit(EVENTS.MUSIC_MENU_START);

        const titleY = toDevicePixels(55);
        const title = new Title(this, width / 2, titleY, { label: t('settings.title') });
        this.add.existing(title);

        // Derived from the title's actual (auto-computed) height + a gap,
        // rather than a second independent magic number — otherwise the
        // two drift out of sync and the panel overlaps the title, exactly
        // like it did when both were hand-picked separately.
        const gapBelowTitle = toDevicePixels(20);
        const panelTop = titleY + title.height / 2 + gapBelowTitle;
        this.panelTop = panelTop;

        // Sized (and centred) for the active tab by applyPanelHeight().
        this.panel = this.add.nineslice(
            width / 2,
            panelTop,
            UI_ATLAS_KEY,
            UI_FRAMES.panelWood,
            toDevicePixels(700),
            toDevicePixels(DEFAULT_PANEL_HEIGHT),
            PANEL_SLICE.left,
            PANEL_SLICE.right,
            PANEL_SLICE.top,
            PANEL_SLICE.bottom,
        );
        this.applyPanelHeight();

        const tabBarY = panelTop + toDevicePixels(55);
        this.tabBar = new TabBar(this, width / 2, tabBarY, {
            tabs: TABS.map((key) => ({ key, label: t(`settings.tabs.${key}`) })),
            activeKey: this.activeTab,
            onSelect: (key) => this.selectTab(key as TabKey),
        });
        this.add.existing(this.tabBar);

        // Only shown while a gamepad is connected (see onGamepadStatusChange
        // below); the icons match the connected controller's brand.
        const panelHalfWidth = toDevicePixels(350);
        const hintGap = toDevicePixels(40);
        const leftTabHint = new GamepadHint(this, width / 2 - panelHalfWidth - hintGap, tabBarY);
        this.add.existing(leftTabHint);
        const rightTabHint = new GamepadHint(this, width / 2 + panelHalfWidth + hintGap, tabBarY);
        this.add.existing(rightTabHint);

        const hintsY = height - toDevicePixels(60);
        const confirmHint = new GamepadHint(this, width - toDevicePixels(250), hintsY);
        this.add.existing(confirmHint);
        const backHint = new GamepadHint(this, width - toDevicePixels(100), hintsY);
        this.add.existing(backHint);

        this.content = this.add.container(width / 2, panelTop + toDevicePixels(110));

        this.backButton = new Button(this, toDevicePixels(100), height - toDevicePixels(60), {
            label: t('common.back'),
            width: toDevicePixels(150),
            height: toDevicePixels(44),
            sound: 'back',
            onClick: () => this.scene.start('MainMenu'),
        });
        this.add.existing(this.backButton);

        this.navigator = new GamepadNavigator(this, {
            onBack: () => {
                emitUiSound('back');
                this.scene.start('MainMenu');
            },
            onShoulderLeft: () => this.cycleTab(-1),
            onShoulderRight: () => this.cycleTab(1),
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
        this.renderActiveTab();

        // A render-quality or language change re-renders this scene from
        // scratch so its own text/UI is redrawn at the new pixel ratio /
        // in the new language (main.ts applies the change first — its
        // SETTINGS_CHANGED listener is registered before any scene's).
        // Volume changes must NOT rebuild anything (a slider may be mid-drag);
        // see getSettingsChangeEffect.
        let previousSettings = SettingsStore.get();
        const onSettingsChanged = (settings: GameSettings): void => {
            const effect = getSettingsChangeEffect(previousSettings, settings);
            previousSettings = settings;

            if (effect === 'restart') {
                this.scene.restart({ activeTab: this.activeTab });
            } else if (effect === 'rerender') {
                this.renderActiveTab();
            }
        };
        EventBus.on(EVENTS.SETTINGS_CHANGED, onSettingsChanged);
        this.events.once(Scenes.Events.SHUTDOWN, () => {
            EventBus.off(EVENTS.SETTINGS_CHANGED, onSettingsChanged);
        });
    }

    private selectTab(key: TabKey): void {
        if (key === this.activeTab) {
            return;
        }

        this.activeTab = key;
        this.tabBar.setActiveTab(key);
        this.renderActiveTab();
        emitUiSound('navigate');
    }

    /** L/R shoulder buttons jump directly between tabs (wrapping), independent of D-pad focus. */
    private cycleTab(delta: number): void {
        const currentIndex = TABS.indexOf(this.activeTab);
        const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
        this.selectTab(TABS[nextIndex]);
    }

    /** Sizes the wood panel for the active tab and keeps its top edge fixed. */
    private applyPanelHeight(): void {
        const height = toDevicePixels(PANEL_HEIGHTS[this.activeTab] ?? DEFAULT_PANEL_HEIGHT);
        this.panel.setSize(this.panel.width, height);
        this.panel.setY(this.panelTop + height / 2);
    }

    private renderActiveTab(): void {
        this.applyPanelHeight();
        this.content.removeAll(true);

        const contentButtons = this.renderTabContent();

        // The tab buttons are deliberately not registered: tabs change only
        // via L/R (or a click), never by D-pad focus movement. Focus starts
        // on the section's first interactive element (or Back, if it has none).
        this.navigator.setItems([...contentButtons, this.backButton]);
    }

    private renderTabContent(): Button[] {
        switch (this.activeTab) {
            case 'display':
                return this.renderDisplayTab();
            case 'language':
                return this.renderLanguageTab();
            case 'controls':
                return this.renderControlsTab();
            case 'audio':
                return this.renderAudioTab();
        }
    }

    private renderDisplayTab(): Button[] {
        const { renderQuality, glowQuality } = SettingsStore.get().display;

        return [
            ...this.renderOptionRow(
                0,
                t('settings.display.renderQuality'),
                RENDER_QUALITIES.map((value) => ({ value, label: t(`settings.display.quality.${value}`) })),
                renderQuality,
                (value) => SettingsStore.setDisplay({ renderQuality: value }),
            ),
            ...this.renderOptionRow(
                OPTION_ROW_SPACING,
                t('settings.display.glowQuality'),
                GLOW_QUALITIES.map((value) => ({ value, label: t(`settings.display.quality.${value}`) })),
                glowQuality,
                (value) => SettingsStore.setDisplay({ glowQuality: value }),
            ),
        ];
    }

    /** Live gamepad test; it has no buttons of its own, so D-pad focus stays on Back. */
    private renderControlsTab(): Button[] {
        // The tab itself is hidden outside DEV; this guard also lets the
        // bundler drop GamepadTester (and its layout data) from production.
        if (IS_DEV) {
            this.content.add(new GamepadTester(this, 0, 0));
        }
        return [];
    }

    /**
     * The music track row plus master / music / effects volume sliders. Picking a
     * track rebuilds this tab (see getSettingsChangeEffect) and the Audio scene
     * switches to it at once; volumes apply live and, for master and effects,
     * play a preview sound when released so the new level can be heard.
     */
    private renderAudioTab(): Button[] {
        const { audio } = SettingsStore.get();

        const trackButtons = this.renderOptionRow(
            0,
            t('settings.audio.musicTrack'),
            MUSIC_TRACK_IDS.map((id, index) => ({ value: id, label: t('settings.audio.track', { number: index + 1 }) })),
            audio.musicTrack,
            (musicTrack) => SettingsStore.setAudio({ musicTrack }),
        );

        const previewSound = (): void => emitUiSound('select');
        const rows = [
            {
                label: t('settings.audio.masterVolume'),
                value: audio.masterVolume,
                onChange: (masterVolume: number) => SettingsStore.setAudio({ masterVolume }),
                onCommit: previewSound,
            },
            {
                label: t('settings.audio.musicVolume'),
                value: audio.musicVolume,
                onChange: (musicVolume: number) => SettingsStore.setAudio({ musicVolume }),
            },
            {
                label: t('settings.audio.sfxVolume'),
                value: audio.sfxVolume,
                onChange: (sfxVolume: number) => SettingsStore.setAudio({ sfxVolume }),
                onCommit: previewSound,
            },
        ];

        const sliderButtons = rows.flatMap((row, index) => {
            const slider = new VolumeSlider(this, 0, toDevicePixels(VOLUME_ROWS_TOP + index * VOLUME_ROW_SPACING), row);
            this.content.add(slider);
            return [...slider.buttons];
        });

        return [...trackButtons, ...sliderButtons];
    }

    private renderLanguageTab(): Button[] {
        return this.renderOptionRow(
            0,
            t('settings.language.heading'),
            LANGUAGES.map((locale) => ({ value: locale, label: LANGUAGE_NATIVE_NAMES[locale] })),
            SettingsStore.get().language.locale,
            (locale) => SettingsStore.setLanguage({ locale }),
        );
    }

    /**
     * A heading over a centered row of buttons, one per option, with the
     * current value shown as selected. `top` is the row's vertical offset
     * (CSS px) within the content container, so several rows can stack.
     */
    private renderOptionRow<T extends string>(
        top: number,
        headingText: string,
        options: readonly OptionRowItem<T>[],
        current: T,
        onPick: (value: T) => void,
    ): Button[] {
        this.content.add(new SectionHeading(this, 0, toDevicePixels(top), { label: headingText }));

        const buttonWidth = toDevicePixels(130);
        const buttonHeight = toDevicePixels(64);
        const gap = toDevicePixels(12);
        const totalWidth = options.length * buttonWidth + (options.length - 1) * gap;
        const y = toDevicePixels(top + 50);

        let cursorX = -totalWidth / 2 + buttonWidth / 2;
        const buttons: Button[] = [];

        for (const option of options) {
            const button = new Button(this, cursorX, y, {
                label: option.label,
                width: buttonWidth,
                height: buttonHeight,
                selected: option.value === current,
                onClick: () => onPick(option.value),
            });
            this.content.add(button);
            buttons.push(button);
            cursorX += buttonWidth + gap;
        }

        return buttons;
    }
}
