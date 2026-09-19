export interface PaddingBox {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/**
 * CSS-style padding: a single number for all sides, `{ x, y }` for
 * horizontal/vertical, or individual sides — any of these may be combined
 * (e.g. `{ x: 24, top: 8 }`).
 */
export type Padding = number | ({ x?: number; y?: number } & Partial<PaddingBox>);

export function resolvePadding(padding: Padding | undefined, fallback: PaddingBox): PaddingBox {
    if (padding === undefined) {
        return fallback;
    }
    if (typeof padding === 'number') {
        return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return {
        top: padding.top ?? padding.y ?? fallback.top,
        right: padding.right ?? padding.x ?? fallback.right,
        bottom: padding.bottom ?? padding.y ?? fallback.bottom,
        left: padding.left ?? padding.x ?? fallback.left,
    };
}
