import type { Scene } from 'phaser';
import { Scenes } from 'phaser';
import type { Input } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import type { NavigableItem } from './NavigableItem';
import { findNextInDirection } from './spatialNavigation';
import { detectGamepadMapping, readHatDirection, type Direction, type GamepadMapping } from './gamepadMapping';

type Gamepad = Input.Gamepad.Gamepad;

export interface GamepadNavigatorOptions {
    onBack?: () => void;
    /** Left/right shoulder buttons — e.g. for jumping directly between tabs, independent of D-pad focus movement. */
    onShoulderLeft?: () => void;
    onShoulderRight?: () => void;
    /**
     * Called immediately with the current status, and again on every
     * connect/disconnect: the first connected pad's mapping (for on-screen
     * button hints, e.g. "press L / R to switch tabs"), or `null` if none
     * is connected.
     */
    onGamepadStatusChange?: (mapping: GamepadMapping | null) => void;
}

/**
 * Drives gamepad-only UI navigation: the D-pad (button- or hat-axis-based,
 * see gamepadMapping.ts) moves focus to the nearest registered item (Button, MenuItem, ...) in
 * that direction on screen (see spatialNavigation.ts), the mapped confirm
 * button activates the focused one (an item can also claim a direction for
 * itself through `handleDirection`), the mapped back button (if a callback
 * is set) fires it, and the shoulder buttons (if callbacks are set) fire
 * independently of focus — e.g. L/R jumping between tabs directly.
 *
 * One instance per scene — construct it in `create()` and call `setItems()`
 * whenever the scene's navigable buttons change (e.g. Settings rebuilding
 * its tab content); the first item gets initial focus. Cleans up its own
 * listeners on scene shutdown.
 */
export class GamepadNavigator {
    private items: NavigableItem[] = [];
    private focusIndex = -1;
    private readonly onBack: (() => void) | undefined;
    private readonly onShoulderLeft: (() => void) | undefined;
    private readonly onShoulderRight: (() => void) | undefined;
    private readonly mappingByPadIndex = new Map<number, GamepadMapping>();
    private readonly lastDirectionByPadIndex = new Map<number, Direction | null>();

    constructor(
        private readonly scene: Scene,
        options: GamepadNavigatorOptions = {},
    ) {
        this.onBack = options.onBack;
        this.onShoulderLeft = options.onShoulderLeft;
        this.onShoulderRight = options.onShoulderRight;

        const gamepadPlugin = scene.input.gamepad;
        if (!gamepadPlugin) {
            return;
        }

        // Gamepad wrapper instances (and their 'down' listeners) outlive any
        // one scene — they're tied to the physical device, not this scene —
        // so every listener attached here MUST be removed on shutdown, or
        // each scene restart leaks another one and old, dangling navigators
        // keep firing (with stale state) alongside the current one.
        const downHandlersByPad = new Map<Gamepad, (index: number) => void>();

        const attachPad = (pad: Gamepad): void => {
            if (downHandlersByPad.has(pad)) {
                return;
            }

            const handler = (index: number): void => {
                const mapping = this.getMapping(pad);

                if (index === mapping.confirmButton) {
                    this.items[this.focusIndex]?.activate();
                } else if (index === mapping.backButton) {
                    this.onBack?.();
                } else if (index === mapping.shoulderLeftButton) {
                    this.onShoulderLeft?.();
                } else if (index === mapping.shoulderRightButton) {
                    this.onShoulderRight?.();
                }
            };

            pad.on('down', handler);
            downHandlersByPad.set(pad, handler);
        };

        const notifyStatus = (): void => {
            const firstPad = gamepadPlugin.gamepads.find((pad): pad is Gamepad => pad != null);
            options.onGamepadStatusChange?.(firstPad ? this.getMapping(firstPad) : null);
        };

        for (const pad of gamepadPlugin.gamepads) {
            if (pad) {
                attachPad(pad);
            }
        }
        notifyStatus();

        const onConnected = (pad: Gamepad): void => {
            attachPad(pad);
            notifyStatus();
        };
        gamepadPlugin.on('connected', onConnected);
        gamepadPlugin.on('disconnected', notifyStatus);

        const onUpdate = (): void => this.pollDirections();
        scene.events.on(Scenes.Events.UPDATE, onUpdate);

        scene.events.once(Scenes.Events.SHUTDOWN, () => {
            scene.events.off(Scenes.Events.UPDATE, onUpdate);
            gamepadPlugin.off('connected', onConnected);
            gamepadPlugin.off('disconnected', notifyStatus);
            downHandlersByPad.forEach((handler, pad) => pad.off('down', handler));
        });
    }

    /** Replaces the navigable items, in navigation order, and focuses the first one. */
    setItems(items: NavigableItem[]): void {
        this.items = items;
        this.focusIndex = items.length > 0 ? 0 : -1;
        this.applyFocusVisuals();
    }

    /** Moves focus to a registered item directly (e.g. the mouse hovering it), so pointer and D-pad share one highlight. */
    focusItem(item: NavigableItem): void {
        const index = this.items.indexOf(item);
        if (index === -1 || index === this.focusIndex) {
            return;
        }

        this.focusIndex = index;
        this.applyFocusVisuals();
        emitUiSound('navigate');
    }

    private getMapping(pad: Gamepad): GamepadMapping {
        let mapping = this.mappingByPadIndex.get(pad.index);

        if (!mapping) {
            mapping = detectGamepadMapping(pad.id, pad.pad.mapping);
            this.mappingByPadIndex.set(pad.index, mapping);
        }

        return mapping;
    }

    private pollDirections(): void {
        const gamepadPlugin = this.scene.input.gamepad;
        if (!gamepadPlugin) {
            return;
        }

        for (const pad of gamepadPlugin.gamepads) {
            if (!pad) {
                continue;
            }

            const direction = this.readDirection(pad, this.getMapping(pad));
            const previousDirection = this.lastDirectionByPadIndex.get(pad.index) ?? null;

            // Edge-triggered: one focus move per press, not one per frame held.
            if (direction && direction !== previousDirection) {
                this.moveFocus(direction);
            }
            this.lastDirectionByPadIndex.set(pad.index, direction);
        }
    }

    private readDirection(pad: Gamepad, mapping: GamepadMapping): Direction | null {
        const { dpad } = mapping;

        if (dpad.type === 'hatAxis') {
            const axis = pad.axes[dpad.axisIndex];
            return axis ? readHatDirection(axis.value, dpad) : null;
        }

        if (pad.buttons[dpad.up]?.pressed) return 'up';
        if (pad.buttons[dpad.down]?.pressed) return 'down';
        if (pad.buttons[dpad.left]?.pressed) return 'left';
        if (pad.buttons[dpad.right]?.pressed) return 'right';
        return null;
    }

    private moveFocus(direction: Direction): void {
        if (this.items.length === 0) {
            return;
        }

        // The focused item may use the direction itself (e.g. a slider's left/right).
        if (this.items[this.focusIndex]?.handleDirection?.(direction)) {
            return;
        }

        const positions = this.items.map((item) => {
            const { tx, ty } = item.getWorldTransformMatrix();
            return { x: tx, y: ty };
        });

        const next = findNextInDirection(positions, this.focusIndex, direction);
        if (next === null) {
            return;
        }

        this.focusIndex = next;
        this.applyFocusVisuals();
        emitUiSound('navigate');
    }

    private applyFocusVisuals(): void {
        this.items.forEach((item, index) => item.setFocused(index === this.focusIndex));
    }
}
