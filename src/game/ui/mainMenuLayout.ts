/** Key of the full-screen main-menu background image (loaded in Preloader). */
export const MAIN_MENU_BG_KEY = 'main-menu-bg';

/**
 * The layout is designed on a 1920x1080 reference (the mock-up in
 * examples/main-menu-example.png, measured from it) and scaled by viewport
 * height, so the menu keeps the same proportions on any window size.
 */
const REFERENCE_HEIGHT = 1080;

/**
 * The highlighted item is a wider, slightly taller plate with bigger, more
 * widely spaced text that sits a little further from the left edge.
 */
const REFERENCE = {
    marginLeft: 143,
    itemPitch: 90,
    /** Distance from the bottom edge to the centre of the last item. */
    bottomInset: 198,
    idle: { width: 400, height: 72, fontSize: 32, letterSpacing: 2, labelInset: 29 },
    active: { width: 484, height: 77, fontSize: 41, letterSpacing: 5, labelInset: 36 },
} as const;

/** Never let the menu take more than this share of a narrow (e.g. portrait) viewport's width. */
const MAX_WIDTH_SHARE = 0.9;

/**
 * The characters occupy the right part of the (mirrored) background: from
 * this share of the image's width to its right edge. Everything to the left
 * of them is darkened so they stand out.
 */
const CHARACTERS_LEFT_SHARE = 0.57;

/**
 * Dark gradient strips over the background and under the menu. The left one
 * runs from the screen edge (darkest) to where the characters begin, so the
 * whole scenery beside them is dimmed and the menu gets contrast; the right
 * one is a short, light shade on the far edge that keeps the characters
 * clear. `alpha` is the darkness at the screen edge, fading to 0.
 */
const SIDE_SHADE = {
    leftAlpha: 0.9,
    rightAlpha: 0.45,
    rightWidthShare: 0.1,
} as const;

export interface SideShadeStrip {
    /** Strip width in device pixels. */
    width: number;
    /** Darkness at the screen edge, 0-1. */
    alpha: number;
}

export interface SideShade {
    left: SideShadeStrip;
    right: SideShadeStrip;
}

/** The background image as displayed: its left edge and width, in device pixels. */
export interface DisplayedBackground {
    x: number;
    width: number;
}

export function computeSideShade(viewWidth: number, background: DisplayedBackground): SideShade {
    const charactersLeft = background.x + background.width * CHARACTERS_LEFT_SHARE;
    const leftWidth = Math.min(Math.max(charactersLeft, 0), viewWidth);
    const rightWidth = Math.min(viewWidth * SIDE_SHADE.rightWidthShare, viewWidth - leftWidth);

    return {
        left: { width: leftWidth, alpha: SIDE_SHADE.leftAlpha },
        right: { width: rightWidth, alpha: SIDE_SHADE.rightAlpha },
    };
}

/** How one item looks in one state (idle or highlighted), in device pixels. */
export interface MenuItemState {
    width: number;
    height: number;
    fontSize: number;
    letterSpacing: number;
    /** Distance from the plate's left edge to the label. */
    labelInset: number;
}

export interface MenuItemSlot {
    /** Left edge of the item's plates. */
    x: number;
    /** Vertical centre of the item. */
    y: number;
    idle: MenuItemState;
    active: MenuItemState;
}

export interface MainMenuLayout {
    items: MenuItemSlot[];
    /** Where the "confirm" gamepad hint sits (its centre), bottom-right. */
    hint: { x: number; y: number };
    /** Where the version label sits (its left-bottom corner), bottom-left. */
    version: { x: number; y: number };
}

function scaleState(state: (typeof REFERENCE)['idle' | 'active'], unit: number, fit: number): MenuItemState {
    return {
        width: state.width * unit * fit,
        height: state.height * unit,
        fontSize: state.fontSize * unit,
        letterSpacing: state.letterSpacing * unit,
        labelInset: state.labelInset * unit * fit,
    };
}

/**
 * Pure layout math for the main menu, in the same device-pixel space as
 * `scene.scale.width/height`. Items are stacked bottom-up from a fixed
 * anchor, so adding entries later grows the list upward like the mock-up.
 */
export function computeMainMenuLayout(viewWidth: number, viewHeight: number, itemCount: number): MainMenuLayout {
    const unit = viewHeight / REFERENCE_HEIGHT;

    const marginLeft = REFERENCE.marginLeft * unit;
    const fit = Math.min(1, (viewWidth * MAX_WIDTH_SHARE - marginLeft) / (REFERENCE.active.width * unit));
    const pitch = REFERENCE.itemPitch * unit;
    const lastY = viewHeight - REFERENCE.bottomInset * unit;

    const items: MenuItemSlot[] = [];
    for (let index = 0; index < itemCount; index += 1) {
        items.push({
            x: marginLeft,
            y: lastY - (itemCount - 1 - index) * pitch,
            idle: scaleState(REFERENCE.idle, unit, fit),
            active: scaleState(REFERENCE.active, unit, fit),
        });
    }

    return {
        items,
        hint: { x: viewWidth - 150 * unit, y: viewHeight - 60 * unit },
        version: { x: 50 * unit, y: viewHeight - 30 * unit },
    };
}
