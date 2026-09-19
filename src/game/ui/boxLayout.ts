import { resolvePadding, type Padding, type PaddingBox } from './padding';

export interface BoxLayout {
    width: number;
    height: number;
    /** Offset to apply to the (origin-centered) content so it sits correctly within the box. */
    contentOffsetX: number;
    contentOffsetY: number;
}

/**
 * CSS box-model sizing, shared by any UI element that's a textured
 * background behind a centered label (Button, Title, ...): an explicit
 * width/height is used as-is; an omitted dimension is sized from the
 * content + padding instead, like a CSS box with `width`/`height: auto`.
 * Asymmetric padding always shifts the content off the box's geometric
 * center, same as it would in CSS.
 */
export function computeBoxLayout(
    contentWidth: number,
    contentHeight: number,
    explicitWidth: number | undefined,
    explicitHeight: number | undefined,
    padding: Padding | undefined,
    fallbackPadding: PaddingBox,
): BoxLayout {
    const p = resolvePadding(padding, fallbackPadding);
    const width = explicitWidth ?? contentWidth + p.left + p.right;
    const height = explicitHeight ?? contentHeight + p.top + p.bottom;

    return {
        width,
        height,
        contentOffsetX: (p.left - p.right) / 2,
        contentOffsetY: (p.top - p.bottom) / 2,
    };
}
