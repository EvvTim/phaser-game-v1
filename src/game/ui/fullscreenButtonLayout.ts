/**
 * The fullscreen button is designed on the same 1920x1080 reference as the
 * menus and scaled uniformly with the window, but never below `minSize`, so it
 * stays easy to hit on a small (touch) screen.
 */
const REFERENCE_HEIGHT = 1080;
const REFERENCE_WIDTH = 1200;

const REF = { size: 46, margin: 22 } as const;

export interface FullscreenButtonLayout {
    /** Centre of the button, in device pixels. */
    x: number;
    y: number;
    /** Side of the square button. */
    size: number;
}

/**
 * Pure layout math: the button sits in the top-right corner, `margin` from
 * both edges. `minSize` (device px) is the smallest it may get.
 */
export function computeFullscreenButtonLayout(viewWidth: number, viewHeight: number, minSize: number): FullscreenButtonLayout {
    const unit = Math.min(viewHeight / REFERENCE_HEIGHT, viewWidth / REFERENCE_WIDTH);
    const size = Math.max(minSize, REF.size * unit);
    const margin = Math.max(minSize * 0.4, REF.margin * unit);

    return {
        x: viewWidth - margin - size / 2,
        y: margin + size / 2,
        size,
    };
}
