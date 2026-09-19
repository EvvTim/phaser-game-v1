import { describe, expect, it } from 'vitest';
import { findNextInDirection, type Point } from './spatialNavigation';

// Two rows of three buttons, plus a Back button below-left — like the Settings display tab.
const points: Point[] = [
    { x: 100, y: 0 }, // 0
    { x: 250, y: 0 }, // 1
    { x: 400, y: 0 }, // 2
    { x: 100, y: 100 }, // 3
    { x: 250, y: 100 }, // 4
    { x: 400, y: 100 }, // 5
    { x: 0, y: 300 }, // 6 (Back)
];

describe('findNextInDirection', () => {
    it('moves along a row', () => {
        expect(findNextInDirection(points, 0, 'right')).toBe(1);
        expect(findNextInDirection(points, 1, 'left')).toBe(0);
    });

    it('moves straight down and up between rows', () => {
        expect(findNextInDirection(points, 1, 'down')).toBe(4);
        expect(findNextInDirection(points, 5, 'up')).toBe(2);
    });

    it('does not jump to another row when moving sideways', () => {
        expect(findNextInDirection(points, 2, 'right')).toBeNull();
    });

    it('reaches an item below and off to the side', () => {
        expect(findNextInDirection(points, 3, 'down')).toBe(6);
        expect(findNextInDirection(points, 6, 'up')).toBe(3);
    });

    it('falls back to the nearest item below when none is in the cone', () => {
        expect(findNextInDirection(points, 5, 'down')).toBe(6);
    });

    it('prefers an in-cone item over a nearer out-of-cone one', () => {
        const pts: Point[] = [
            { x: 0, y: 0 },
            { x: 90, y: 20 }, // nearer, but far off to the side
            { x: 0, y: 100 }, // straight below
        ];
        expect(findNextInDirection(pts, 0, 'down')).toBe(2);
    });

    it('returns null at an edge instead of wrapping', () => {
        expect(findNextInDirection(points, 0, 'left')).toBeNull();
        expect(findNextInDirection(points, 0, 'up')).toBeNull();
        expect(findNextInDirection(points, 6, 'down')).toBeNull();
    });

    it('returns null for an invalid current index', () => {
        expect(findNextInDirection(points, -1, 'down')).toBeNull();
        expect(findNextInDirection([], 0, 'down')).toBeNull();
    });
});
