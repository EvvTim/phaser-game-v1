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

/**
 * A horizontal row of selectable tab buttons. Does not add itself to the
 * scene — call `scene.add.existing(tabBar)`.
 */
export class TabBar extends GameObjects.Container {
    private readonly buttons = new Map<string, Button>();

    constructor(scene: Scene, x: number, y: number, options: TabBarOptions) {
        super(scene, x, y);

        const { tabs, activeKey } = tabBarConfigSchema.parse({
            tabs: options.tabs,
            activeKey: options.activeKey,
        });

        const buttonWidth = toDevicePixels(150);
        const buttonHeight = toDevicePixels(44);
        const gap = toDevicePixels(10);
        const totalWidth = tabs.length * buttonWidth + (tabs.length - 1) * gap;

        let cursorX = -totalWidth / 2 + buttonWidth / 2;

        for (const tab of tabs) {
            const button = new Button(scene, cursorX, 0, {
                label: tab.label,
                width: buttonWidth,
                height: buttonHeight,
                selected: tab.key === activeKey,
                onClick: () => options.onSelect(tab.key),
            });

            this.add(button);
            this.buttons.set(tab.key, button);
            cursorX += buttonWidth + gap;
        }
    }

    setActiveTab(key: string): void {
        this.buttons.forEach((button, buttonKey) => button.setSelected(buttonKey === key));
    }
}
