import { GameObjects, Scene, Scenes } from 'phaser';
import { GLOW_QUALITIES } from '../config/glowQuality';
import { RENDER_QUALITIES, toDevicePixels } from '../config/pixelRatio';
import { EVENTS } from '../events/GameEvents';
import { EventBus } from '../events/EventBus';
import { t } from '../i18n/i18n';
import { LANGUAGES, LANGUAGE_NATIVE_NAMES } from '../i18n/languages';
import { GamepadNavigator } from '../input/GamepadNavigator';
import { SettingsStore } from '../settings/SettingsStore';
import { Button } from '../ui/Button';
import { GamepadHint } from '../ui/GamepadHint';
import { TabBar } from '../ui/TabBar';
import { Title } from '../ui/Title';
import { UI_ATLAS_KEY, UI_FRAMES } from '../ui/uiAtlas';
import { PANEL_SLICE } from '../ui/panelSlice';

const TABS = ['display', 'controls', 'language', 'audio'] as const;

type TabKey = (typeof TABS)[number];

/** Vertical distance (CSS px) between stacked option rows in a settings tab. */
const OPTION_ROW_SPACING = 100;

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
    private activeTab: TabKey = 'display';

    constructor() {
        super('Settings');
    }

    init(data: SettingsSceneData): void {
        this.activeTab = data.activeTab ?? 'display';
    }

    create(): void {
        const { width, height } = this.scale;

        const titleY = toDevicePixels(55);
        const title = new Title(this, width / 2, titleY, { label: t('settings.title') });
        this.add.existing(title);

        // Derived from the title's actual (auto-computed) height + a gap,
        // rather than a second independent magic number — otherwise the
        // two drift out of sync and the panel overlaps the title, exactly
        // like it did when both were hand-picked separately.
        const gapBelowTitle = toDevicePixels(20);
        const panelHeight = toDevicePixels(330);
        const panelY = titleY + title.height / 2 + gapBelowTitle + panelHeight / 2;
        const panelTop = panelY - panelHeight / 2;

        this.add.nineslice(
            width / 2,
            panelY,
            UI_ATLAS_KEY,
            UI_FRAMES.panelWood,
            toDevicePixels(700),
            panelHeight,
            PANEL_SLICE.left,
            PANEL_SLICE.right,
            PANEL_SLICE.top,
            PANEL_SLICE.bottom,
        );

        const tabBarY = panelTop + toDevicePixels(55);
        this.tabBar = new TabBar(this, width / 2, tabBarY, {
            tabs: TABS.map((key) => ({ key, label: t(`settings.tabs.${key}`) })),
            activeKey: this.activeTab,
            onSelect: (key) => this.selectTab(key as TabKey),
        });
        this.add.existing(this.tabBar);

        // Only shown while a gamepad is connected (see onGamepadStatusChange
        // below) — text-only for now, swap for button-icon assets later
        // without touching this positioning.
        const panelHalfWidth = toDevicePixels(350);
        const hintGap = toDevicePixels(25);
        const leftTabHint = new GamepadHint(this, width / 2 - panelHalfWidth - hintGap, tabBarY);
        this.add.existing(leftTabHint);
        const rightTabHint = new GamepadHint(this, width / 2 + panelHalfWidth + hintGap, tabBarY);
        this.add.existing(rightTabHint);

        this.content = this.add.container(width / 2, panelTop + toDevicePixels(110));

        this.backButton = new Button(this, toDevicePixels(100), height - toDevicePixels(60), {
            label: t('common.back'),
            width: toDevicePixels(150),
            height: toDevicePixels(44),
            onClick: () => this.scene.start('MainMenu'),
        });
        this.add.existing(this.backButton);

        this.navigator = new GamepadNavigator(this, {
            onBack: () => this.scene.start('MainMenu'),
            onShoulderLeft: () => this.cycleTab(-1),
            onShoulderRight: () => this.cycleTab(1),
            onGamepadStatusChange: (mapping) => {
                if (mapping) {
                    leftTabHint.show(mapping.shoulderLeftLabel);
                    rightTabHint.show(mapping.shoulderRightLabel);
                } else {
                    leftTabHint.hide();
                    rightTabHint.hide();
                }
            },
        });
        this.renderActiveTab();

        // A render-quality or language change re-renders this scene from
        // scratch so its own text/UI is redrawn at the new pixel ratio /
        // in the new language (main.ts applies the change first — its
        // SETTINGS_CHANGED listener is registered before any scene's).
        const onSettingsChanged = (): void => {
            this.scene.restart({ activeTab: this.activeTab });
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
    }

    /** L/R shoulder buttons jump directly between tabs (wrapping), independent of D-pad focus. */
    private cycleTab(delta: number): void {
        const currentIndex = TABS.indexOf(this.activeTab);
        const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
        this.selectTab(TABS[nextIndex]);
    }

    private renderActiveTab(): void {
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
            default:
                return this.renderStubTab();
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
        const heading = this.add
            .text(0, toDevicePixels(top), headingText, {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(20),
                color: '#ffffff',
            })
            .setOrigin(0.5);
        this.content.add(heading);

        const buttonWidth = toDevicePixels(130);
        const buttonHeight = toDevicePixels(44);
        const gap = toDevicePixels(12);
        const totalWidth = options.length * buttonWidth + (options.length - 1) * gap;
        const y = toDevicePixels(top + 45);

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

    private renderStubTab(): Button[] {
        const text = this.add
            .text(0, toDevicePixels(65), t('settings.comingSoon'), {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(20),
                color: '#8899aa',
            })
            .setOrigin(0.5);
        this.content.add(text);

        return [];
    }
}
