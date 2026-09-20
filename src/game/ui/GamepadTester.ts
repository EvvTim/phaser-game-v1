import { GameObjects, Scene, Scenes } from 'phaser';
import type { Input } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { t } from '../i18n/i18n';
import {
    detectGamepadMapping,
    getControllerDisplayName,
    type ControllerFamily,
    type GamepadMapping,
} from '../input/gamepadMapping';
import {
    layoutChipGrid,
    STANDARD_BUTTON_SPOTS,
    STANDARD_CHIP_SPOTS,
    STANDARD_DPAD_SPOT,
    STANDARD_STICK_SPOTS,
} from './gamepadLayout';
import {
    GAMEPAD_ATLAS_KEY,
    getPressedFrame,
    getPromptFrame,
    type GamepadFrame,
    type PromptRole,
} from './gamepadPrompts';
import { SETTINGS_COLORS } from './settingsTheme';
import { gameTextStyle } from './textStyle';

type Gamepad = Input.Gamepad.Gamepad;

/** Re-applied to a control's state every frame; returns nothing, only touches its own game objects. */
type Updater = (pad: Gamepad) => void;

const PRESSED_TINT = 0xffe27a;
const PRESSED_FILL = 0xffe27a;
const IDLE_FILL = 0x000000;
const IDLE_FILL_ALPHA = 0.55;

const RAW_CHIPS_PER_ROW = 8;
const RAW_CHIP_WIDTH_CSS = 74;
const RAW_CHIP_HEIGHT_CSS = 30;
const CHIP_GAP_CSS = 6;

const HEADING_Y_CSS = 0;
const DIAGRAM_TOP_CSS = 48;
const MAX_NAME_LENGTH = 44;

/**
 * A live gamepad test panel (the DEV-only `GamepadTest` scene): shows the first
 * connected controller and lights up every button as it's pressed, so a
 * player (or you, debugging a new device) can verify all of them work.
 *
 * - A pad the browser reports as `mapping: 'standard'` gets a controller-shaped
 *   diagram of prompt icons for its brand (see gamepadPrompts.ts): pressed
 *   buttons swap to a yellow, inverted icon, the D-pad shows its direction,
 *   sticks show their deflection and click.
 * - Anything else (a brand-new device, or one with a hardcoded custom
 *   mapping) gets a raw grid — one chip per button index plus the live axis
 *   values — which is exactly what's needed to work out an unknown layout.
 *
 * Polls in the scene's UPDATE and rebuilds itself when the pad changes.
 * Browsers only expose a pad after its first button press, hence the prompt
 * when none is connected. Does not add itself to the scene — call
 * `container.add(tester)`; destroying it (or its scene shutting down) stops
 * the polling.
 */
export class GamepadTester extends GameObjects.Container {
    private updaters: Updater[] = [];
    private builtFor: string | null = null;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);
        scene.events.on(Scenes.Events.UPDATE, this.poll, this);
    }

    override destroy(fromScene?: boolean): void {
        this.scene?.events.off(Scenes.Events.UPDATE, this.poll, this);
        super.destroy(fromScene);
    }

    private poll(): void {
        const pad = this.scene.input.gamepad?.gamepads.find((candidate): candidate is Gamepad => candidate != null);
        const key = pad ? `${pad.id}|${pad.pad.mapping}` : null;

        if (key !== this.builtFor || (this.builtFor === null && this.list.length === 0)) {
            this.builtFor = key;
            this.rebuild(pad ?? null);
        }

        if (pad) {
            for (const update of this.updaters) {
                update(pad);
            }
        }
    }

    private rebuild(pad: Gamepad | null): void {
        this.removeAll(true);
        this.updaters = [];

        if (!pad) {
            this.add(this.createText(0, toDevicePixels(DIAGRAM_TOP_CSS + 30), t('settings.controls.noGamepad'), 20, '#ffffff'));
            return;
        }

        const mapping = detectGamepadMapping(pad.id, pad.pad.mapping);
        const name = getControllerDisplayName(pad.id).slice(0, MAX_NAME_LENGTH);
        this.add(this.createText(0, toDevicePixels(HEADING_Y_CSS), name, 18, SETTINGS_COLORS.creamCss));

        if (pad.pad.mapping === 'standard') {
            this.buildStandardDiagram(mapping.family, mapping);
        } else {
            this.buildRawGrid(pad, mapping);
        }
    }

    private buildStandardDiagram(family: ControllerFamily, mapping: GamepadMapping): void {
        const top = DIAGRAM_TOP_CSS;

        for (const spot of STANDARD_BUTTON_SPOTS) {
            this.addIconButton(getPromptFrame(family, spot.role), spot.index, spot.x, top + spot.y, spot.height);
        }

        this.addDpad(family);

        for (const stick of STANDARD_STICK_SPOTS) {
            this.addStick(stick.axisX, stick.axisY, stick.clickButton, stick.x, top + stick.y, stick.radius);
        }

        // Buttons with no artwork in the pack (e.g. the platform Guide button — excluded by its license).
        for (const spot of STANDARD_CHIP_SPOTS) {
            this.addChip(mapping.buttonLabels[spot.index] ?? `#${spot.index}`, spot.index, spot.x, top + spot.y);
        }
    }

    private buildRawGrid(pad: Gamepad, mapping: GamepadMapping): void {
        const count = pad.buttons.length;
        const cells = layoutChipGrid(count, RAW_CHIPS_PER_ROW, RAW_CHIP_WIDTH_CSS, RAW_CHIP_HEIGHT_CSS);

        // Only trust names for a mapping measured on real hardware; for an
        // unrecognized pad, plain indices are the honest label.
        cells.forEach((cell, index) => {
            const label = (mapping.measured && mapping.buttonLabels[index]) || `#${index}`;
            this.addChip(label, index, cell.x, DIAGRAM_TOP_CSS + cell.y);
        });

        const rows = Math.ceil(count / RAW_CHIPS_PER_ROW);
        const axesY = DIAGRAM_TOP_CSS + rows * RAW_CHIP_HEIGHT_CSS + 14;
        const axesText = this.createText(0, toDevicePixels(axesY), '', 14, '#ffffff');
        this.add(axesText);

        let lastAxes = '';
        this.updaters.push((current) => {
            const text = current.axes.map((axis, i) => `${i}: ${axis.value.toFixed(2)}`).join('   ');
            if (text !== lastAxes) {
                lastAxes = text;
                axesText.setText(text);
            }
        });

        this.add(this.createText(
                0,
                toDevicePixels(axesY + 22),
                t(mapping.measured ? 'settings.controls.rawButtons' : 'settings.controls.rawLayout'),
                13,
                '#c9d6e2',
            ));
    }

    private addIconButton(frame: GamepadFrame, buttonIndex: number, x: number, y: number, heightCss: number): void {
        const image = this.scene.add.image(toDevicePixels(x), toDevicePixels(y), GAMEPAD_ATLAS_KEY, frame);
        image.setScale(toDevicePixels(heightCss) / image.height);
        this.add(image);

        let pressed = false;
        this.updaters.push((pad) => {
            const now = pad.buttons[buttonIndex]?.pressed ?? false;
            if (now === pressed) {
                return;
            }
            pressed = now;
            image.setFrame(now ? getPressedFrame(frame) : frame);
            image.setTint(now ? PRESSED_TINT : 0xffffff);
        });
    }

    private addDpad(family: ControllerFamily): void {
        const spot = STANDARD_DPAD_SPOT;
        const idleFrame = getPromptFrame(family, 'dpad');
        const image = this.scene.add.image(
            toDevicePixels(spot.x),
            toDevicePixels(DIAGRAM_TOP_CSS + spot.y),
            GAMEPAD_ATLAS_KEY,
            idleFrame,
        );
        image.setScale(toDevicePixels(spot.height) / image.height);
        this.add(image);

        const directions: ReadonlyArray<readonly [number, PromptRole]> = [
            [spot.up, 'dpadUp'],
            [spot.down, 'dpadDown'],
            [spot.left, 'dpadLeft'],
            [spot.right, 'dpadRight'],
        ];

        let shown = '';
        this.updaters.push((pad) => {
            const pressed = directions.find(([index]) => pad.buttons[index]?.pressed);
            const frame = pressed ? getPressedFrame(getPromptFrame(family, pressed[1])) : idleFrame;

            if (frame !== shown) {
                shown = frame;
                image.setFrame(frame);
                image.setTint(pressed ? PRESSED_TINT : 0xffffff);
            }
        });
    }

    private addStick(
        axisX: number,
        axisY: number,
        clickButton: number,
        x: number,
        y: number,
        radiusCss: number,
    ): void {
        const radius = toDevicePixels(radiusCss);
        const dotRadius = toDevicePixels(6);
        const cx = toDevicePixels(x);
        const cy = toDevicePixels(y);

        const base = this.scene.add
            .circle(cx, cy, radius, IDLE_FILL, IDLE_FILL_ALPHA)
            .setStrokeStyle(toDevicePixels(2), 0xffffff);
        const dot = this.scene.add.circle(cx, cy, dotRadius, 0xffffff);
        this.add([base, dot]);

        let clicked = false;
        this.updaters.push((pad) => {
            const reach = radius - dotRadius;
            dot.setPosition(cx + (pad.axes[axisX]?.value ?? 0) * reach, cy + (pad.axes[axisY]?.value ?? 0) * reach);

            const now = pad.buttons[clickButton]?.pressed ?? false;
            if (now !== clicked) {
                clicked = now;
                base.setFillStyle(now ? PRESSED_FILL : IDLE_FILL, now ? 0.85 : IDLE_FILL_ALPHA);
            }
        });
    }

    private addChip(label: string, buttonIndex: number, x: number, y: number): void {
        const text = this.createText(toDevicePixels(x), toDevicePixels(y), label, 14, '#ffffff');
        const width = toDevicePixels(RAW_CHIP_WIDTH_CSS - CHIP_GAP_CSS);
        const height = toDevicePixels(RAW_CHIP_HEIGHT_CSS - CHIP_GAP_CSS);

        // Fixed-size chips keep the grid tidy; squeeze a long name to fit instead of growing the chip.
        const maxTextWidth = width - toDevicePixels(10);
        if (text.width > maxTextWidth) {
            text.setScale(maxTextWidth / text.width);
        }

        const box = this.scene.add
            .rectangle(toDevicePixels(x), toDevicePixels(y), width, height, IDLE_FILL, IDLE_FILL_ALPHA)
            .setStrokeStyle(toDevicePixels(2), 0xffffff);
        this.add([box, text]);

        let pressed = false;
        this.updaters.push((pad) => {
            const now = pad.buttons[buttonIndex]?.pressed ?? false;
            if (now === pressed) {
                return;
            }
            pressed = now;
            box.setFillStyle(now ? PRESSED_FILL : IDLE_FILL, now ? 0.9 : IDLE_FILL_ALPHA);
            text.setColor(now ? SETTINGS_COLORS.darkCss : '#ffffff');
        });
    }

    private createText(x: number, y: number, content: string, sizeCss: number, color: string): GameObjects.Text {
        return this.scene.add
            .text(x, y, content, gameTextStyle({ fontSize: toDevicePixels(sizeCss), color }))
            .setOrigin(0.5);
    }
}
