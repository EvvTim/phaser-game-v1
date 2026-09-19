import { GameObjects, Scene, Scenes } from 'phaser';
import { RENDER_QUALITIES, toDevicePixels, type RenderQuality } from '../config/pixelRatio';
import { EVENTS } from '../events/GameEvents';
import { EventBus } from '../events/EventBus';
import { SettingsStore } from '../settings/SettingsStore';
import { Button } from '../ui/Button';
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

        this.tabBar = new TabBar(this, width / 2, panelTop + toDevicePixels(45), {
            tabs: TABS.map(({ key, label }) => ({ key, label })),
            activeKey: this.activeTab,
            onSelect: (key) => this.selectTab(key as TabKey),
        });
        this.add.existing(this.tabBar);

        this.content = this.add.container(width / 2, panelTop + toDevicePixels(135));
        this.renderActiveTab();

        const backButton = new Button(this, toDevicePixels(100), height - toDevicePixels(60), {
            label: '< Назад',
            width: toDevicePixels(150),
            height: toDevicePixels(44),
            onClick: () => this.scene.start('MainMenu'),
        });
        this.add.existing(backButton);

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

    private renderActiveTab(): void {
        this.content.removeAll(true);

        if (this.activeTab === 'display') {
            this.renderDisplayTab();
        } else {
            this.renderStubTab();
        }
    }

    private renderDisplayTab(): void {
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

        for (const quality of RENDER_QUALITIES) {
            const button = new Button(this, cursorX, y, {
                label: RENDER_QUALITY_LABELS[quality],
                width: buttonWidth,
                height: buttonHeight,
                selected: quality === current,
                onClick: () => SettingsStore.setDisplay({ renderQuality: quality }),
            });
            this.content.add(button);
            cursorX += buttonWidth + gap;
        }
    }

    private renderStubTab(): void {
        const text = this.add
            .text(0, toDevicePixels(40), 'Скоро...', {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(20),
                color: '#8899aa',
            })
            .setOrigin(0.5);
        this.content.add(text);
    }
}
