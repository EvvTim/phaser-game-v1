import { GameObjects, Scene, Scenes } from 'phaser';
import { RENDER_QUALITIES, toDevicePixels, type RenderQuality } from '../config/pixelRatio';
import { EVENTS } from '../events/GameEvents';
import { EventBus } from '../events/EventBus';
import { GamepadNavigator } from '../input/GamepadNavigator';
import { SettingsStore } from '../settings/SettingsStore';
import { Button } from '../ui/Button';
import { GamepadHint } from '../ui/GamepadHint';
import { TabBar } from '../ui/TabBar';
import { Title } from '../ui/Title';
import { UI_ATLAS_KEY, UI_FRAMES } from '../ui/uiAtlas';
import { PANEL_SLICE } from '../ui/panelSlice';

const TABS = [
    { key: 'display', label: 'Экран' },
    { key: 'controls', label: 'Управление' },
    { key: 'language', label: 'Язык' },
    { key: 'audio', label: 'Аудио' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const RENDER_QUALITY_LABELS: Record<RenderQuality, string> = {
    auto: 'Авто',
    high: 'Высокое',
    medium: 'Среднее',
    low: 'Низкое',
};

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
        const title = new Title(this, width / 2, titleY, { label: 'Настройки' });
        this.add.existing(title);

        // Derived from the title's actual (auto-computed) height + a gap,
        // rather than a second independent magic number — otherwise the
        // two drift out of sync and the panel overlaps the title, exactly
        // like it did when both were hand-picked separately.
        const gapBelowTitle = toDevicePixels(20);
        const panelHeight = toDevicePixels(270);
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
            tabs: TABS.map(({ key, label }) => ({ key, label })),
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

        this.content = this.add.container(width / 2, panelTop + toDevicePixels(135));

        this.backButton = new Button(this, toDevicePixels(100), height - toDevicePixels(60), {
            label: '< Назад',
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

        // A render-quality change re-renders this scene from scratch (see
        // renderDisplayTab) so its own text/UI is redrawn at the new pixel
        // ratio; other settings sections won't need this until they too
        // affect layout at the device-pixel level.
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
        const currentIndex = TABS.findIndex((tab) => tab.key === this.activeTab);
        const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
        this.selectTab(TABS[nextIndex].key);
    }

    private renderActiveTab(): void {
        this.content.removeAll(true);

        const contentButtons = this.activeTab === 'display' ? this.renderDisplayTab() : this.renderStubTab();

        // Keep gamepad focus on the active tab: this runs on every tab
        // switch (L/R or click), and defaulting to the first item would
        // leave the glow stuck on the first tab.
        this.navigator.setItems(
            [...this.tabBar.getButtons(), ...contentButtons, this.backButton],
            this.tabBar.getButton(this.activeTab),
        );
    }

    private renderDisplayTab(): Button[] {
        const heading = this.add
            .text(0, 0, 'Качество рендера', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(20),
                color: '#ffffff',
            })
            .setOrigin(0.5);
        this.content.add(heading);

        const buttonWidth = toDevicePixels(130);
        const buttonHeight = toDevicePixels(44);
        const gap = toDevicePixels(12);
        const totalWidth = RENDER_QUALITIES.length * buttonWidth + (RENDER_QUALITIES.length - 1) * gap;
        const y = toDevicePixels(60);

        let cursorX = -totalWidth / 2 + buttonWidth / 2;
        const current = SettingsStore.get().display.renderQuality;
        const buttons: Button[] = [];

        for (const quality of RENDER_QUALITIES) {
            const button = new Button(this, cursorX, y, {
                label: RENDER_QUALITY_LABELS[quality],
                width: buttonWidth,
                height: buttonHeight,
                selected: quality === current,
                onClick: () => SettingsStore.setDisplay({ renderQuality: quality }),
            });
            this.content.add(button);
            buttons.push(button);
            cursorX += buttonWidth + gap;
        }

        return buttons;
    }

    private renderStubTab(): Button[] {
        const text = this.add
            .text(0, toDevicePixels(40), 'Скоро...', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(20),
                color: '#8899aa',
            })
            .setOrigin(0.5);
        this.content.add(text);

        return [];
    }
}
