import type { PromptRole } from './gamepadPrompts';

/** A button on the W3C "standard" layout, drawn as a prompt icon at a fixed spot in the controller diagram. */
export interface ButtonSpot {
    /** Standard-layout button index (0-16). */
    index: number;
    role: PromptRole;
    /** Center, in CSS pixels, relative to the diagram's origin. */
    x: number;
    y: number;
    /** Icon height in CSS pixels (width follows the frame's aspect ratio). */
    height: number;
}

export interface StickSpot {
    /** Axis indices for the stick's X and Y, and the button index of its click. */
    axisX: number;
    axisY: number;
    clickButton: number;
    x: number;
    y: number;
    radius: number;
}

/** Icon-less button (no artwork for it in the pack, e.g. the platform Guide button) shown as a text chip instead. */
export interface ChipSpot {
    index: number;
    x: number;
    y: number;
}

/**
 * A controller-shaped arrangement of the standard layout: triggers and
 * bumpers along the top, sticks on the outside, D-pad and face buttons
 * inside them, Select/Start between. Sized to fit the Settings panel
 * (about 600 x 130 CSS px). Sits in one neutral arrangement for every
 * brand — the icons, not the positions, carry the brand.
 */
export const STANDARD_BUTTON_SPOTS: readonly ButtonSpot[] = [
    { index: 6, role: 'triggerLeft', x: -250, y: 0, height: 28 },
    { index: 7, role: 'triggerRight', x: 250, y: 0, height: 28 },
    { index: 4, role: 'shoulderLeft', x: -250, y: 34, height: 26 },
    { index: 5, role: 'shoulderRight', x: 250, y: 34, height: 26 },
    { index: 8, role: 'select', x: -30, y: 62, height: 24 },
    { index: 9, role: 'start', x: 30, y: 62, height: 24 },
    { index: 3, role: 'faceNorth', x: 110, y: 46, height: 28 },
    { index: 0, role: 'faceSouth', x: 110, y: 106, height: 28 },
    { index: 2, role: 'faceWest', x: 80, y: 76, height: 28 },
    { index: 1, role: 'faceEast', x: 140, y: 76, height: 28 },
];

export const STANDARD_STICK_SPOTS: readonly StickSpot[] = [
    { axisX: 0, axisY: 1, clickButton: 10, x: -210, y: 82, radius: 24 },
    { axisX: 2, axisY: 3, clickButton: 11, x: 210, y: 82, radius: 24 },
];

/** The D-pad is one icon whose frame swaps to the pressed direction; its buttons are the standard 12-15. */
export const STANDARD_DPAD_SPOT = { x: -110, y: 76, height: 44, up: 12, down: 13, left: 14, right: 15 } as const;

export const STANDARD_CHIP_SPOTS: readonly ChipSpot[] = [{ index: 16, x: 0, y: 100 }];

/**
 * Centers `count` cells in rows of up to `columns`, top row at y = 0, each
 * row centered on x = 0 (so a short last row stays centered). Used for the
 * raw-buttons fallback when a pad's layout isn't the standard one.
 */
export function layoutChipGrid(
    count: number,
    columns: number,
    cellWidth: number,
    cellHeight: number,
): Array<{ x: number; y: number }> {
    const cells: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / columns);
        const column = i % columns;
        const inRow = Math.min(columns, count - row * columns);

        cells.push({
            x: (column - (inRow - 1) / 2) * cellWidth,
            y: row * cellHeight,
        });
    }

    return cells;
}

/** Every button index the diagram shows — useful to check the layout covers the whole standard set. */
export function getStandardLayoutButtonIndices(): number[] {
    return [
        ...STANDARD_BUTTON_SPOTS.map((spot) => spot.index),
        ...STANDARD_STICK_SPOTS.map((spot) => spot.clickButton),
        STANDARD_DPAD_SPOT.up,
        STANDARD_DPAD_SPOT.down,
        STANDARD_DPAD_SPOT.left,
        STANDARD_DPAD_SPOT.right,
        ...STANDARD_CHIP_SPOTS.map((spot) => spot.index),
    ].sort((a, b) => a - b);
}
