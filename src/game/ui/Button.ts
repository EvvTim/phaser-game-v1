import { GameObjects, Scene } from 'phaser';
import type { Filters } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import type { UiSoundKind } from '../audio/uiSounds';
import { getGlowParams } from '../config/glowQuality';
import { toDevicePixels } from '../config/pixelRatio';
import { UI_ATLAS_KEY, UI_FRAMES } from './uiAtlas';
import type { Padding, PaddingBox } from './padding';
import { computeBoxLayout } from './boxLayout';

export type ButtonPadding = Padding;

export interface ButtonConfig {
    label: string;
    onClick: () => void;
    /** Fixed size. Omit a dimension to size it from the label + padding instead, like a CSS box with `width`/`height: auto`. */
    width?: number;
    height?: number;
    /**
     * Space around the label — a single number for all sides, `{ x, y }`
     * for horizontal/vertical, or individual sides (combinable, e.g.
     * `{ x: 24, top: 8 }`). Values are device pixels, same convention as
     * `width`/`height` above — pass `toDevicePixels(n)` if you're thinking
     * in CSS-equivalent units. Only affects sizing for a dimension left to
     * auto-size; on a fixed dimension, asymmetric padding still shifts the
     * label off-center within the box, as it would in CSS.
     */
    padding?: ButtonPadding;
    selected?: boolean;
    /**
     * Also show a yellow glow while `selected` (on top of the selected tint) —
     * used by tabs so the active one stands out, independent of the cyan
     * gamepad-focus glow.
     */
    selectedGlow?: boolean;
    /** UI sound played when the button is activated (click or gamepad confirm); `null` for none. Default `'select'`. */
    sound?: UiSoundKind | null;
}

/**
 * Slice metrics for the 'banner_rect' atlas frame (465x172 source pixels):
 * fixed-width wood end-caps/corners on all four sides around a stretchable
 * green middle. These are texture-space pixel offsets, independent of
 * device pixel ratio — re-measure if the atlas is regenerated with a
 * differently-proportioned crop (see art-source/ui/README.md).
 *
 * Kept well under the source frame's true border thickness (~44/37/28/46):
 * NineSlice borders are absolute output pixels, not scaled to the target
 * size, and our buttons render far shorter (~44-64px) than the frame's
 * native 172px height — the true border alone would exceed that and
 * collapse the stretchable middle entirely.
 */
const SLICE = { left: 24, right: 20, top: 10, bottom: 14 };

const SELECTED_TINT = 0xffe27a;

/**
 * Gamepad-cursor highlight, via Phaser's Glow filter
 * (https://docs.phaser.io/api-documentation/class/filters-glow) — a soft
 * halo around the button. Deliberately a different visual cue than the
 * selected-tint above, so a button can show both at once (e.g. the
 * currently active quality option also has gamepad focus).
 *
 * Created lazily on focus and explicitly removed on blur/destroy, rather
 * than left permanently enabled at zero strength: a Glow filter renders an
 * extra pass per active instance, and with a whole tab bar + button row
 * each holding one (as an "always on, toggle the strength" design first
 * did), that's several such passes every frame for buttons that are never
 * focused — a real, measured performance hit. At most one button is ever
 * focused at a time, so at most one filter should exist at a time.
 */
const FOCUS_GLOW_COLOR = 0x66ccff;
const FOCUS_GLOW_STRENGTH = 6;

/** Yellow halo for a selected button that opted into `selectedGlow` (e.g. the active tab). Same lazy create/remove rule as the focus glow. */
const SELECTED_GLOW_COLOR = 0xffd84a;
const SELECTED_GLOW_STRENGTH = 6;

/** CSS-equivalent label font size, exported so callers (e.g. TabBar) can measure label width before choosing a button's own width. */
export const BUTTON_LABEL_FONT_SIZE = 18;

/** CSS-equivalent default padding, used for any side not covered by an explicit `width`/`height` or `padding` value. */
const DEFAULT_PADDING_CSS: PaddingBox = { top: 12, right: 24, bottom: 12, left: 24 };

/**
 * A reusable clickable button skinned with the wood/green UI kit. Does not
 * add itself to the scene or a parent container — call
 * `scene.add.existing(button)` for a standalone button, or
 * `container.add(button)` to nest it (e.g. inside a TabBar).
 */
export class Button extends GameObjects.Container {
    private readonly background: GameObjects.NineSlice;
    private readonly label: GameObjects.Text;
    private readonly onClick: () => void;
    private readonly sound: UiSoundKind | null;
    private focusGlow: Filters.Glow | null = null;
    private selectedGlowFilter: Filters.Glow | null = null;
    private readonly hasSelectedGlow: boolean;
    private selected: boolean;

    constructor(scene: Scene, x: number, y: number, config: ButtonConfig) {
        super(scene, x, y);

        this.selected = config.selected ?? false;
        this.hasSelectedGlow = config.selectedGlow ?? false;
        this.onClick = config.onClick;
        this.sound = config.sound === undefined ? 'select' : config.sound;

        const fallbackPadding: PaddingBox = {
            top: toDevicePixels(DEFAULT_PADDING_CSS.top),
            right: toDevicePixels(DEFAULT_PADDING_CSS.right),
            bottom: toDevicePixels(DEFAULT_PADDING_CSS.bottom),
            left: toDevicePixels(DEFAULT_PADDING_CSS.left),
        };

        this.label = scene.add
            .text(0, 0, config.label, {
                fontFamily: 'Arial',
                fontSize: toDevicePixels(BUTTON_LABEL_FONT_SIZE),
                color: '#ffffff',
                stroke: '#3b2410',
                strokeThickness: toDevicePixels(3),
            })
            .setOrigin(0.5);

        const layout = computeBoxLayout(
            this.label.width,
            this.label.height,
            config.width,
            config.height,
            config.padding,
            fallbackPadding,
        );

        this.label.setPosition(layout.contentOffsetX, layout.contentOffsetY);

        this.background = scene.add.nineslice(
            0,
            0,
            UI_ATLAS_KEY,
            UI_FRAMES.bannerRect,
            layout.width,
            layout.height,
            SLICE.left,
            SLICE.right,
            SLICE.top,
            SLICE.bottom,
        );

        this.add([this.background, this.label]);
        this.setSize(layout.width, layout.height);

        this.background.setInteractive({ useHandCursor: true });
        this.background.on('pointerdown', () => this.activate());

        this.applySelected();
    }

    setSelected(selected: boolean): void {
        if (this.selected === selected) {
            return;
        }

        this.selected = selected;
        this.applySelected();
    }

    /** Gamepad-cursor highlight — distinct from `selected` (see FOCUS_GLOW_COLOR). */
    setFocused(focused: boolean): void {
        if (focused) {
            this.focusGlow ??= this.addGlow(FOCUS_GLOW_COLOR, FOCUS_GLOW_STRENGTH);
        } else {
            this.focusGlow = this.removeGlow(this.focusGlow);
        }
    }

    /** Triggers this button's action programmatically (e.g. a gamepad confirm press). */
    activate(): void {
        if (this.sound) {
            emitUiSound(this.sound);
        }
        this.onClick();
    }

    override destroy(fromScene?: boolean): void {
        // Belt-and-braces: explicitly drop the filter before Phaser's own
        // destroy cascade runs, rather than relying on it to clean up an
        // enabled Filters/Glow on a child GameObject.
        this.focusGlow = this.removeGlow(this.focusGlow);
        this.selectedGlowFilter = this.removeGlow(this.selectedGlowFilter);
        super.destroy(fromScene);
    }

    private addGlow(color: number, strength: number): Filters.Glow | null {
        // enableFilters() is WebGL-only and no-ops (leaving `filters`
        // null) without it — the button just won't glow there, no error.
        // Safe to call repeatedly: it's a no-op once already enabled.
        this.background.enableFilters();
        // quality/distance are baked into the shader at creation, so a glow
        // quality change only shows on buttons created afterwards — fine, the
        // Settings scene restarts (recreating its buttons) on every change.
        const { quality, distance, scale } = getGlowParams();
        return this.background.filters?.external.addGlow(color, strength, 0, scale, false, quality, distance) ?? null;
    }

    private removeGlow(glow: Filters.Glow | null): null {
        if (glow) {
            this.background.filters?.external.remove(glow);
        }
        return null;
    }

    private applySelected(): void {
        if (this.selected) {
            this.background.setTint(SELECTED_TINT);
            if (this.hasSelectedGlow) {
                this.selectedGlowFilter ??= this.addGlow(SELECTED_GLOW_COLOR, SELECTED_GLOW_STRENGTH);
            }
        } else {
            this.background.clearTint();
            this.selectedGlowFilter = this.removeGlow(this.selectedGlowFilter);
        }
    }
}
