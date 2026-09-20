export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Which brand's conventions a controller follows — decides the on-screen
 * button prompts (see ui/gamepadPrompts.ts) and which face button confirms.
 * `generic` covers any third-party pad we can't place; it uses Xbox-style
 * behaviour, since that's the layout almost all of them copy.
 */
export const CONTROLLER_FAMILIES = ['xbox', 'playstation', 'nintendo', 'steam', 'generic'] as const;
export type ControllerFamily = (typeof CONTROLLER_FAMILIES)[number];

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
    family: ControllerFamily;
    /** Button index that activates the focused UI element. */
    confirmButton: number;
    /** Button index that navigates back/cancels. */
    backButton: number;
    /** Left/right shoulder buttons — conventionally used to jump directly between tabs. */
    shoulderLeftButton: number;
    shoulderRightButton: number;
    /** Printed name for every known button index, for diagnostics (see gamepadLogger.ts) — not every index need be present. */
    buttonLabels: Partial<Record<number, string>>;
    dpad: DpadSource;
    /**
     * True only for entries whose indices were measured on real hardware
     * (see SWITCH_2_PRO_CONTROLLER_MAPPING). A non-standard pad we've never
     * seen falls back to a standard-layout guess, which is not measured —
     * its button names would be misleading, so UIs showing raw buttons
     * should only trust `buttonLabels` when this is set.
     */
    measured?: true;
}

/**
 * The W3C "standard" gamepad layout, as reported (`mapping: 'standard'`) by
 * browsers for the controllers they recognize — Xbox, DualShock/DualSense,
 * Switch Pro, Steam Deck and most third-party pads. The *indices* are the
 * same for all of them and positional (0 = bottom face button, 1 = right,
 * 2 = left, 3 = top); only the printed names and the confirm/back
 * convention differ per brand, which is what the per-family entries below
 * capture.
 */
const STANDARD_INDICES = {
    shoulderLeftButton: 4,
    shoulderRightButton: 5,
    dpad: { type: 'buttons', up: 12, down: 13, left: 14, right: 15 },
} as const satisfies Pick<GamepadMapping, 'shoulderLeftButton' | 'shoulderRightButton' | 'dpad'>;

/** Bottom face button confirms, right face button cancels — the Xbox/PlayStation/Steam convention. */
const BOTTOM_CONFIRMS = { confirmButton: 0, backButton: 1 } as const;

/** Right face button confirms, bottom face button cancels — Nintendo's own convention (physical A/B are swapped vs Xbox). */
const RIGHT_CONFIRMS = { confirmButton: 1, backButton: 0 } as const;

export const STANDARD_MAPPINGS: Readonly<Record<ControllerFamily, GamepadMapping>> = {
    xbox: {
        family: 'xbox',
        ...STANDARD_INDICES,
        ...BOTTOM_CONFIRMS,
        buttonLabels: {
            0: 'A',
            1: 'B',
            2: 'X',
            3: 'Y',
            4: 'LB',
            5: 'RB',
            6: 'LT',
            7: 'RT',
            8: 'View',
            9: 'Menu',
            10: 'LS',
            11: 'RS',
            12: 'D-pad Up',
            13: 'D-pad Down',
            14: 'D-pad Left',
            15: 'D-pad Right',
            16: 'Xbox',
        },
    },
    playstation: {
        family: 'playstation',
        ...STANDARD_INDICES,
        ...BOTTOM_CONFIRMS,
        buttonLabels: {
            0: 'Cross',
            1: 'Circle',
            2: 'Square',
            3: 'Triangle',
            4: 'L1',
            5: 'R1',
            6: 'L2',
            7: 'R2',
            8: 'Create/Share',
            9: 'Options',
            10: 'L3',
            11: 'R3',
            12: 'D-pad Up',
            13: 'D-pad Down',
            14: 'D-pad Left',
            15: 'D-pad Right',
            16: 'PS',
            17: 'Touchpad',
        },
    },
    nintendo: {
        family: 'nintendo',
        ...STANDARD_INDICES,
        ...RIGHT_CONFIRMS,
        buttonLabels: {
            0: 'B',
            1: 'A',
            2: 'Y',
            3: 'X',
            4: 'L',
            5: 'R',
            6: 'ZL',
            7: 'ZR',
            8: '-',
            9: '+',
            10: 'L Stick',
            11: 'R Stick',
            12: 'D-pad Up',
            13: 'D-pad Down',
            14: 'D-pad Left',
            15: 'D-pad Right',
            16: 'Home',
            17: 'Capture',
        },
    },
    steam: {
        family: 'steam',
        ...STANDARD_INDICES,
        ...BOTTOM_CONFIRMS,
        buttonLabels: {
            0: 'A',
            1: 'B',
            2: 'X',
            3: 'Y',
            4: 'L1',
            5: 'R1',
            6: 'L2',
            7: 'R2',
            8: 'View',
            9: 'Menu',
            10: 'L3',
            11: 'R3',
            12: 'D-pad Up',
            13: 'D-pad Down',
            14: 'D-pad Left',
            15: 'D-pad Right',
            16: 'Steam',
        },
    },
    generic: {
        family: 'generic',
        ...STANDARD_INDICES,
        ...BOTTOM_CONFIRMS,
        buttonLabels: {
            0: 'A',
            1: 'B',
            2: 'X',
            3: 'Y',
            4: 'L1',
            5: 'R1',
            6: 'L2',
            7: 'R2',
            8: 'Select',
            9: 'Start',
            10: 'L3',
            11: 'R3',
            12: 'D-pad Up',
            13: 'D-pad Down',
            14: 'D-pad Left',
            15: 'D-pad Right',
            16: 'Home',
        },
    },
};

/** Fallback for a pad we know nothing about. */
export const STANDARD_MAPPING: GamepadMapping = STANDARD_MAPPINGS.generic;

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
    family: 'nintendo',
    measured: true,
    confirmButton: 1, // A
    backButton: 0, // B
    shoulderLeftButton: 9, // L
    shoulderRightButton: 10, // R
    buttonLabels: {
        0: 'B',
        1: 'A',
        2: 'Y',
        3: 'X',
        4: '-',
        5: 'Home',
        6: '+',
        9: 'L',
        10: 'R',
        15: 'Capture',
        16: 'GR',
        17: 'GL',
        18: 'Chat',
        // 7, 8, 11-14 unconfirmed (likely stick clicks) — see gamepadLogger.ts to fill in.
    },
    dpad: {
        type: 'hatAxis',
        axisIndex: 9,
        values: { up: -1, right: -3 / 7, down: 1 / 7, left: 5 / 7 },
        tolerance: 0.12,
    },
};

/** USB vendor ids of the platform holders whose controllers set the conventions above. */
const FAMILY_BY_VENDOR_ID: Readonly<Record<string, ControllerFamily>> = {
    '045e': 'xbox', // Microsoft
    '054c': 'playstation', // Sony
    '057e': 'nintendo',
    '28de': 'steam', // Valve
};

/**
 * Name fallbacks for when the browser's `id` carries no vendor id (e.g.
 * Safari's "DUALSHOCK 4 Wireless Controller Extended Gamepad", or Chrome on
 * Windows' "Xbox 360 Controller (XInput STANDARD GAMEPAD)"). Checked in
 * order; the first match wins.
 */
const FAMILY_NAME_PATTERNS: ReadonlyArray<readonly [ControllerFamily, RegExp]> = [
    ['playstation', /playstation|dualshock|dualsense|\bps[345]\b/i],
    ['nintendo', /nintendo|switch|joy-?con|pro controller/i],
    ['steam', /steam/i],
    ['xbox', /xbox|xinput/i],
];

/**
 * Pulls the USB vendor/product id out of a Gamepad API `id` string. Browsers
 * disagree on the format: Chrome uses `"<name> (... Vendor: XXXX Product:
 * YYYY)"`, Firefox `"XXXX-YYYY-<name>"`, and Safari omits them.
 */
export function parseVendorProduct(padId: string): { vendor: string; product: string } | null {
    const chrome = /Vendor:\s*([0-9a-f]+)\s*Product:\s*([0-9a-f]+)/i.exec(padId);
    if (chrome?.[1] && chrome[2]) {
        return { vendor: chrome[1].toLowerCase(), product: chrome[2].toLowerCase() };
    }

    const firefox = /^([0-9a-f]{4})-([0-9a-f]{4})-/i.exec(padId);
    if (firefox?.[1] && firefox[2]) {
        return { vendor: firefox[1].toLowerCase(), product: firefox[2].toLowerCase() };
    }

    return null;
}

/** Which brand a pad belongs to, from its vendor id or (failing that) its name; `generic` if neither says. */
export function detectControllerFamily(padId: string): ControllerFamily {
    const vendorProduct = parseVendorProduct(padId);
    const byVendor = vendorProduct ? FAMILY_BY_VENDOR_ID[vendorProduct.vendor] : undefined;
    if (byVendor) {
        return byVendor;
    }

    for (const [family, pattern] of FAMILY_NAME_PATTERNS) {
        if (pattern.test(padId)) {
            return family;
        }
    }

    return 'generic';
}

/**
 * Picks a mapping for a connected pad: a specific hardcoded mapping for
 * known non-standard hardware (keyed by vendor/product id), otherwise the
 * standard layout with the pad's brand conventions (see
 * {@link detectControllerFamily}).
 *
 * A non-standard, unrecognized pad also gets the standard layout — its
 * indices will likely be wrong for that controller, but that's a more
 * useful default than no input handling at all, and it's easy to add a
 * dedicated entry here once a device's real mapping is known (use
 * gamepadLogger.ts to find it).
 */
export function detectGamepadMapping(padId: string, browserMapping: string): GamepadMapping {
    if (browserMapping !== 'standard') {
        const vendorProduct = parseVendorProduct(padId);

        if (vendorProduct?.vendor === '057e' && vendorProduct.product === '2069') {
            return SWITCH_2_PRO_CONTROLLER_MAPPING;
        }
    }

    return STANDARD_MAPPINGS[detectControllerFamily(padId)];
}

/**
 * A short human-readable name for a pad, from the browser's `id` string —
 * drops the trailing "(STANDARD GAMEPAD Vendor: ...)" details (Chrome) and
 * the leading "054c-09cc-" ids (Firefox).
 */
export function getControllerDisplayName(padId: string): string {
    const name = padId
        .replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i, '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim();

    return name === '' ? padId.trim() : name;
}

/** The known name for a button index (e.g. "L", "A"), or `undefined` if this mapping doesn't have one for it. */
export function getButtonLabel(mapping: GamepadMapping, index: number): string | undefined {
    return mapping.buttonLabels[index];
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
