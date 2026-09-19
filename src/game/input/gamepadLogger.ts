import type { Scene } from 'phaser';
import { Scenes } from 'phaser';
import type { Input } from 'phaser';
import { detectGamepadMapping, getButtonLabel } from './gamepadMapping';

type Gamepad = Input.Gamepad.Gamepad;

/**
 * Temporary diagnostic: logs gamepad connect/disconnect/button/axis info to
 * the console so we can confirm gamepad detection works, and — critically —
 * figure out a specific controller's real button/axis indices before
 * building navigation on top of them (see GamepadNavigator.ts /
 * gamepadMapping.ts for the result of that, for now just the Switch 2 Pro
 * Controller). Keep this around for discovering the next unknown one.
 *
 * This matters because the Gamepad API's `mapping` is often `''` (not
 * `'standard'`) for controllers the browser doesn't have in its mapping
 * database yet (e.g. very new hardware), which means the usual assumed
 * indices (0 = bottom face button, 12-15 = D-pad, ...) do not apply and
 * have to be found empirically per device instead.
 *
 * Requires `input.gamepad: true` in the game config (see game/main.ts) —
 * Phaser only creates `scene.input.gamepad` when that's enabled.
 */
export function attachGamepadLogger(scene: Scene): void {
    const gamepadPlugin = scene.input.gamepad;

    if (!gamepadPlugin) {
        return;
    }

    const logPad = (event: string, pad: Gamepad): void => {
        console.log(`[gamepad] ${event}`, {
            index: pad.index,
            id: pad.id,
            mapping: pad.pad.mapping,
            buttons: pad.buttons.length,
            axes: pad.axes.length,
        });
    };

    // Gamepad wrapper instances (and their 'down' listeners) outlive any one
    // scene — they're tied to the physical device — so every listener
    // attached here must be removed on shutdown, or each scene restart
    // leaks another one, duplicating every subsequent log line.
    const downHandlersByPad = new Map<Gamepad, (index: number, value: number) => void>();

    const attachButtonLogging = (pad: Gamepad): void => {
        if (downHandlersByPad.has(pad)) {
            return;
        }

        const handler = (index: number, value: number): void => {
            const mapping = detectGamepadMapping(pad.id, pad.pad.mapping);
            const label = getButtonLabel(mapping, index);
            const name = label ? ` (${label})` : '';
            console.log(`[gamepad] button down: index=${index}${name} value=${value.toFixed(2)}`);
        };

        pad.on('down', handler);
        downHandlersByPad.set(pad, handler);
    };

    // The browser won't fire 'connected' for a pad it already trusts, so log
    // (and wire up) anything already known as soon as this scene starts polling.
    for (const pad of gamepadPlugin.gamepads) {
        if (pad) {
            logPad('already connected', pad);
            attachButtonLogging(pad);
        }
    }

    const onConnected = (pad: Gamepad): void => {
        logPad('connected', pad);
        attachButtonLogging(pad);
    };
    const onDisconnected = (pad: Gamepad): void => logPad('disconnected', pad);

    gamepadPlugin.on('connected', onConnected);
    gamepadPlugin.on('disconnected', onDisconnected);

    // Axes have no 'change' event, so poll every frame. Log the RAW value
    // (not getValue(), which zeroes anything under its threshold and would
    // hide exactly the small/negative values we need to see) on every
    // actual change, not every frame it's held.
    const lastAxisValues = new Map<string, number>();

    const onUpdate = (): void => {
        for (const pad of gamepadPlugin.gamepads) {
            if (!pad) {
                continue;
            }

            pad.axes.forEach((axis, index) => {
                const key = `${pad.index}:${index}`;
                const value = axis.value;
                const last = lastAxisValues.get(key);

                if (last === undefined || Math.abs(value - last) > 0.02) {
                    lastAxisValues.set(key, value);
                    console.log(`[gamepad] axis change: index=${index} value=${value.toFixed(3)}`);
                }
            });
        }
    };

    scene.events.on(Scenes.Events.UPDATE, onUpdate);

    scene.events.once(Scenes.Events.SHUTDOWN, () => {
        scene.events.off(Scenes.Events.UPDATE, onUpdate);
        gamepadPlugin.off('connected', onConnected);
        gamepadPlugin.off('disconnected', onDisconnected);
        downHandlersByPad.forEach((handler, pad) => pad.off('down', handler));
    });
}
