import { GameObjects, Scene } from 'phaser';
import type { NavigableItem } from '../input/NavigableItem';
import type { MenuItemState } from './mainMenuLayout';
import { MENU_FONT_STACK } from './menuFont';
import { ensureMenuItemTexture, type MenuItemSkin } from './menuItemTextures';

export interface MenuItemConfig {
    /** Shown as-is — callers translate (and upper-case, if wanted) it. */
    label: string;
    /** How the item looks idle and while highlighted (see mainMenuLayout.ts). */
    idle: MenuItemState;
    active: MenuItemState;
    onClick: () => void;
    /** Mouse moved onto the item — the scene moves the highlight here (see GamepadNavigator#focusItem). */
    onHover?: () => void;
}

/** Glyphs are drawn a little narrower than Play Bold's natural width, as in the mock-up. */
const LABEL_SCALE_X = 0.9;

const LABEL_STYLE = {
    idle: { color: '#f6eef8', glow: '#ff9ad2' },
    active: { color: '#ffffff', glow: '#7aa2ff' },
} as const;

/** Text glow radius, as a share of the font size. */
const GLOW_BLUR_SHARE = 0.22;

/**
 * One entry of the main menu: a translucent plate with a left-aligned label.
 * While highlighted (gamepad focus or mouse hover — the scene keeps that to
 * a single item) the plate grows wider and lights up blue-white, and the
 * label grows and steps right. The artwork shows through the plates. Does
 * not add itself to the scene — call
 * `scene.add.existing(item)`. Its position is the plates' left edge.
 */
export class MenuItem extends GameObjects.Container implements NavigableItem {
    private readonly plate: GameObjects.Image;
    private readonly label: GameObjects.Text;
    private readonly onClick: () => void;
    private readonly states: Record<MenuItemSkin, MenuItemState>;

    constructor(scene: Scene, x: number, y: number, config: MenuItemConfig) {
        super(scene, x, y);

        this.onClick = config.onClick;
        this.states = { idle: config.idle, active: config.active };

        this.plate = scene.add.image(0, 0, '__DEFAULT');

        this.label = scene.add
            .text(0, 0, config.label, {
                fontFamily: MENU_FONT_STACK,
                fontStyle: 'bold',
            })
            .setOrigin(0, 0.5)
            .setScale(LABEL_SCALE_X, 1);

        this.add([this.plate, this.label]);

        // The click/hover area is the widest (highlighted) plate, so the item
        // doesn't lose the pointer when it grows under it.
        const { width, height } = config.active;
        this.setSize(width, height);
        const hitArea = scene.add.zone(width / 2, 0, width, height).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', this.onClick);
        if (config.onHover) {
            hitArea.on('pointerover', config.onHover);
        }
        this.add(hitArea);

        this.apply('idle');
    }

    /** Highlights this item (gamepad focus or mouse hover). */
    setFocused(focused: boolean): void {
        this.apply(focused ? 'active' : 'idle');
    }

    /** Triggers this item's action programmatically (e.g. a gamepad confirm press). */
    activate(): void {
        this.onClick();
    }

    private apply(skin: MenuItemSkin): void {
        const state = this.states[skin];
        const texture = ensureMenuItemTexture(this.scene, skin, state.width, state.height);
        this.plate.setTexture(texture.key).setOrigin(texture.originX, 0.5);

        const style = LABEL_STYLE[skin];
        this.label
            .setFontSize(state.fontSize)
            .setLetterSpacing(state.letterSpacing)
            .setColor(style.color)
            .setShadow(0, 0, style.glow, state.fontSize * GLOW_BLUR_SHARE, true, true)
            .setX(state.labelInset);
    }
}
