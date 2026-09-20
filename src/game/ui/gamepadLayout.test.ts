import { describe, expect, it } from 'vitest';
import {
    getStandardLayoutButtonIndices,
    layoutChipGrid,
    STANDARD_BUTTON_SPOTS,
    STANDARD_STICK_SPOTS,
} from './gamepadLayout';

describe('standard controller diagram', () => {
    it('covers every button of the W3C standard layout (0-16) exactly once', () => {
        const indices = getStandardLayoutButtonIndices();
        expect(indices).toEqual(Array.from({ length: 17 }, (_, i) => i));
    });

    it('keeps everything inside the Settings panel (about 600 CSS px wide)', () => {
        const xs = [
            ...STANDARD_BUTTON_SPOTS.map((spot) => Math.abs(spot.x)),
            ...STANDARD_STICK_SPOTS.map((spot) => Math.abs(spot.x) + spot.radius),
        ];
        expect(Math.max(...xs)).toBeLessThanOrEqual(300);
    });

    it('does not overlap the face buttons with each other', () => {
        const face = STANDARD_BUTTON_SPOTS.filter((spot) => spot.role.startsWith('face'));
        for (const a of face) {
            for (const b of face) {
                if (a !== b) {
                    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.height);
                }
            }
        }
    });
});

describe('layoutChipGrid', () => {
    it('lays out a single row centered on x = 0', () => {
        expect(layoutChipGrid(3, 9, 60, 30)).toEqual([
            { x: -60, y: 0 },
            { x: 0, y: 0 },
            { x: 60, y: 0 },
        ]);
    });

    it('wraps into rows and centers a short last row', () => {
        const cells = layoutChipGrid(5, 4, 50, 20);
        expect(cells.slice(0, 4).map((c) => c.y)).toEqual([0, 0, 0, 0]);
        expect(cells[4]).toEqual({ x: 0, y: 20 });
    });

    it('returns nothing for zero buttons', () => {
        expect(layoutChipGrid(0, 9, 60, 30)).toEqual([]);
    });
});
