import type { Direction } from './gamepadMapping';

export interface Point {
    x: number;
    y: number;
}

/** Ignore items that are level with the current one along the movement axis (e.g. same row when pressing down). */
const MIN_PRIMARY_DISTANCE = 1;

/** Off-axis distance counts double: prefer the item straight ahead over a nearer one off to the side. */
const SECONDARY_WEIGHT = 2;

/** Added to the score of an item outside the 45° cone so any in-cone item always wins over it. */
const OUT_OF_CONE_PENALTY = 1e6;

/**
 * Picks the item to move focus to from `points[fromIndex]` in `direction`,
 * or `null` if nothing lies that way (focus then stays put — no wrap).
 * Screen coordinates: y grows downward.
 *
 * Items must lie within a 45° cone of the direction, so sideways moves stay
 * in their own row instead of leaping to a far-off item. Vertical moves
 * additionally fall back to the nearest item above/below outside the cone —
 * otherwise a wide row could leave a lone button (e.g. Back, in a corner)
 * unreachable by D-pad.
 */
export function findNextInDirection(points: readonly Point[], fromIndex: number, direction: Direction): number | null {
    const from = points[fromIndex];
    if (!from) {
        return null;
    }

    let bestIndex: number | null = null;
    let bestScore = Infinity;

    points.forEach((point, index) => {
        if (index === fromIndex) {
            return;
        }

        const dx = point.x - from.x;
        const dy = point.y - from.y;

        const primary = direction === 'right' ? dx : direction === 'left' ? -dx : direction === 'down' ? dy : -dy;
        const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);

        if (primary < MIN_PRIMARY_DISTANCE) {
            return;
        }

        const inCone = secondary <= primary;
        if (!inCone && (direction === 'left' || direction === 'right')) {
            return;
        }

        const score = primary + secondary * SECONDARY_WEIGHT + (inCone ? 0 : OUT_OF_CONE_PENALTY);
        if (score < bestScore) {
            bestScore = score;
            bestIndex = index;
        }
    });

    return bestIndex;
}
