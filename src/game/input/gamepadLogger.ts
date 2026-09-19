import type { Scene } from 'phaser';
import type { Input } from 'phaser';

type Gamepad = Input.Gamepad.Gamepad;

/**
 * Temporary diagnostic: logs gamepad connect/disconnect info to the console
 * so we can confirm gamepad detection works before building real input
 * handling on top of it.
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

    // The browser won't fire 'connected' for a pad it already trusts, so log
    // anything already known as soon as this scene starts polling.
    for (const pad of gamepadPlugin.gamepads) {
        if (pad) {
            logPad('already connected', pad);
        }
    }

    gamepadPlugin.on('connected', (pad: Gamepad) => logPad('connected', pad));
    gamepadPlugin.on('disconnected', (pad: Gamepad) => logPad('disconnected', pad));
}
