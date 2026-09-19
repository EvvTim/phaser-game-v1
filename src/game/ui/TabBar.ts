import { GameObjects, Scene } from 'phaser';
import { z } from 'zod';
import { toDevicePixels } from '../config/pixelRatio';
import { Button } from './Button';

export const tabBarConfigSchema = z.object({
    tabs: z
        .array(
            z.object({
                key: z.string().min(1),
                label: z.string().min(1),
            }),
        )
        .min(1),
    activeKey: z.string().min(1),
});
export type TabBarConfig = z.infer<typeof tabBarConfigSchema>;

export interface TabBarOptions extends TabBarConfig {
    onSelect: (key: string) => void;
}

const TAB_PADDING_X = 20; // CSS-equivalent, each side

/**
 * A horizontal row of selectable tab buttons, each auto-sized (via Button's
 * padding-based sizing) to fit its own label — labels vary a lot ("Язык"
 * vs "Управление"), so a single fixed width either overflows or wastes
 * space. Does not add itself to the scene — call `scene.add.existing(tabBar)`.
 */
export class TabBar extends GameObjects.Container {
    private readonly buttons = new Map<string, Button>();

    constructor(scene: Scene, x: number, y: number, options: TabBarOptions) {
        super(scene, x, y);

        const { tabs, activeKey } = tabBarConfigSchema.parse({
            tabs: options.tabs,
            activeKey: options.activeKey,
        });

        const buttonHeight = toDevicePixels(44);
        const gap = toDevicePixels(10);
        const padding = { x: toDevicePixels(TAB_PADDING_X) };

        const created = tabs.map(
            (tab) =>
                new Button(scene, 0, 0, {
                    label: tab.label,
                    height: buttonHeight,
                    padding,
                    selected: tab.key === activeKey,
                    onClick: () => options.onSelect(tab.key),
                }),
        );

        const totalWidth = created.reduce((sum, button) => sum + button.width, 0) + (tabs.length - 1) * gap;
        let cursorX = -totalWidth / 2;

        tabs.forEach((tab, i) => {
            const button = created[i];
            cursorX += button.width / 2;
            button.setPosition(cursorX, 0);

            this.add(button);
            this.buttons.set(tab.key, button);
            cursorX += button.width / 2 + gap;
        });
    }

    setActiveTab(key: string): void {
        this.buttons.forEach((button, buttonKey) => button.setSelected(buttonKey === key));
    }

    getButton(key: string): Button | undefined {
        return this.buttons.get(key);
    }

    /** The tab buttons, in display order — e.g. for registering with a GamepadNavigator. */
    getButtons(): Button[] {
        return [...this.buttons.values()];
    }
}
