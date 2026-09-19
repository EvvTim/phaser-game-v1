import { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';

export interface ButtonConfig {
    label: string;
    width: number;
    height: number;
    onClick: () => void;
    selected?: boolean;
}

const COLORS = {
    idleFill: 0x16213a,
    idleText: '#c9d6e3',
    // White-on-dark-blue text needs a fill that contrasts with the scene
    // background, not just the idle button color — a same-hue "selected"
    // fill (e.g. matching the default #028af8 background) would nearly
    // disappear against it.
    selectedFill: 0xffffff,
    selectedText: '#028af8',
    stroke: 0xffffff,
};

/**
 * A reusable clickable text button. Does not add itself to the scene or a
 * parent container — call `scene.add.existing(button)` for a standalone
 * button, or `container.add(button)` to nest it (e.g. inside a TabBar).
 */
export class Button extends GameObjects.Container {
    private readonly background: GameObjects.Rectangle;
    private readonly label: GameObjects.Text;
    private selected: boolean;

    constructor(scene: Scene, x: number, y: number, config: ButtonConfig) {
        super(scene, x, y);

        this.selected = config.selected ?? false;

        this.background = scene.add
            .rectangle(0, 0, config.width, config.height, this.currentFill())
            .setStrokeStyle(toDevicePixels(1), COLORS.stroke, 0.4);

        this.label = scene.add
            .text(0, 0, config.label, {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(18),
                color: this.currentTextColor(),
            })
            .setOrigin(0.5);

        this.add([this.background, this.label]);

        this.background.setInteractive({ useHandCursor: true });
        this.background.on('pointerdown', config.onClick);
    }

    setSelected(selected: boolean): void {
        if (this.selected === selected) {
            return;
        }

        this.selected = selected;
        this.background.setFillStyle(this.currentFill());
        this.label.setColor(this.currentTextColor());
    }

    private currentFill(): number {
        return this.selected ? COLORS.selectedFill : COLORS.idleFill;
    }

    private currentTextColor(): string {
        return this.selected ? COLORS.selectedText : COLORS.idleText;
    }
}
