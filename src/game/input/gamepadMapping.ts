export type Direction = 'up' | 'down' | 'left' | 'right';

export type DpadSource =
    | { type: 'buttons'; up: number; down: number; left: number; right: number }
    | {
          /**
           * A single-axis 4-way hat switch (seen on controllers the browser
           * hasn't assigned `mapping: 'standard'` yet — no discrete D-pad
           * buttons, just one axis whose value encodes the direction).
           */
          type: 'hatAxis';
          axisIndex: number;
          values: Record<Direction, number>;
          tolerance: number;
      };

export interface GamepadMapping {
    /** Button index that activates the focused UI element. */
    confirmButton: number;
    /** Button index that navigates back/cancels. */
    backButton: number;
    /** Left/right shoulder buttons — conventionally used to jump directly between tabs. */
    shoulderLeftButton: number;
    shoulderRightButton: number;
    /** Printed on-controller names for the shoulder buttons, for on-screen hints (e.g. "press L / R to switch tabs"). */
    shoulderLeftLabel: string;
    shoulderRightLabel: string;
    dpad: DpadSource;
}

/** The W3C "standard" gamepad layout — used whenever the browser reports `mapping: 'standard'`. */
export const STANDARD_MAPPING: GamepadMapping = {
    confirmButton: 0,
    backButton: 1,
    shoulderLeftButton: 4,
    shoulderRightButton: 5,
    shoulderLeftLabel: 'L',
    shoulderRightLabel: 'R',
    dpad: { type: 'buttons', up: 12, down: 13, left: 14, right: 15 },
};

/**
 * Nintendo Switch 2 Pro Controller, empirically mapped (2026-09) because
 * Chrome doesn't have this new hardware in its gamepad database yet, so it
 * reports `mapping: ''` instead of `'standard'` — see art-source notes /
 * PR discussion for how these indices were found (console-logged button
 * presses and axis values from the actual device).
 *
 * Buttons: B=0 A=1 Y=2 X=3 minus=4 home=5 plus=6 L=9 R=10 capture=15 GR=16
 * GL=17 chat=18. ZL/ZR are axes (3/4), not buttons: -1 released, 1 pressed.
 * (L/R were first logged the other way around — 9=R, 10=L — but that was a
 * mix-up while testing physical buttons blind; corrected after L/R-driven
 * tab switching came out backwards in practice.)
 *
 * Confirm/back follow Nintendo's own UI convention (right face button "A"
 * confirms, bottom face button "B" cancels) rather than the Xbox/PlayStation
 * one (bottom button confirms) — the physical labels are swapped between
 * the two conventions, and this is a Nintendo controller.
 */
const SWITCH_2_PRO_CONTROLLER_MAPPING: GamepadMapping = {
    confirmButton: 1, // A
    backButton: 0, // B
    shoulderLeftButton: 9, // L
    shoulderRightButton: 10, // R
    shoulderLeftLabel: 'L',
    shoulderRightLabel: 'R',
    dpad: {
        type: 'hatAxis',
        axisIndex: 9,
        values: { up: -1, right: -3 / 7, down: 1 / 7, left: 5 / 7 },
        tolerance: 0.12,
    },
};

/**
 * Picks a mapping for a connected pad: the standard one if the browser
 * recognizes the controller, otherwise a specific hardcoded mapping keyed
 * by USB vendor/product id parsed out of the Gamepad API's `id` string
 * (browsers format it as `"<name> (Vendor: XXXX Product: YYYY)"`).
 *
 * Falls back to the standard mapping for anything else non-standard and
 * unrecognized — its indices will likely be wrong for that controller, but
 * that's a more useful default than no input handling at all, and it's
 * easy to add another entry here once a device's real mapping is known.
 */
export function detectGamepadMapping(padId: string, browserMapping: string): GamepadMapping {
    if (browserMapping === 'standard') {
        return STANDARD_MAPPING;
    }

    const vendorProduct = /Vendor:\s*([0-9a-f]+)\s*Product:\s*([0-9a-f]+)/i.exec(padId);
    const vendor = vendorProduct?.[1]?.toLowerCase();
    const product = vendorProduct?.[2]?.toLowerCase();

    if (vendor === '057e' && product === '2069') {
        return SWITCH_2_PRO_CONTROLLER_MAPPING;
    }

    return STANDARD_MAPPING;
}

/** Which (if any) direction a hat-axis value currently represents, within tolerance. */
export function readHatDirection(value: number, source: Extract<DpadSource, { type: 'hatAxis' }>): Direction | null {
    for (const direction of ['up', 'down', 'left', 'right'] as const) {
        if (Math.abs(value - source.values[direction]) <= source.tolerance) {
            return direction;
        }
    }
    return null;
}
