/**
 * The settings screen is designed on a 1920x1080 reference (measured from
 * examples/settings-menu-example.png) and scaled uniformly, so it keeps its
 * proportions on any window. All outputs are device pixels, in the same
 * space as `scene.scale.width/height`.
 */
const REFERENCE_HEIGHT = 1080;
/**
 * The widest content (a row of four chips in the longest translation) reaches
 * about 580 px right of the centre; below this window width the page shrinks to fit.
 */
const REFERENCE_WIDTH = 1200;
/** Reference px kept free above and below the block when it is what limits the size. */
const MIN_VERTICAL_MARGIN = 120;

const REF = {
    rowPitch: 54,
    /** Vertical step from a section heading to its first row, and from the last row of a section to the next heading. */
    headingToRow: 50,
    rowToHeading: 72,
    /** Centre of the title, and of the first row, measured from the top rule. */
    titleOffset: 44,
    titleBottomRuleOffset: 88,
    firstRowOffset: 138,
    /** Centre of the tab row, measured from the top rule, and the extra room it adds above the first entry. */
    tabsOffset: 134,
    tabsBlock: 62,
    /** Distance from the last row to the rule above the action, to its text, to the rule below. */
    backRuleAboveGap: 56,
    backTextGap: 34,
    backRuleBelowGap: 68,
    labelGap: 20,
    controlGap: 60,
    controlWidth: 430,
    longRule: 436,
    shortRule: 200,
    dotSize: 5,
    dotPitch: 15,
    dotClearance: 12,
} as const;

/** Sizes shared by the settings controls, device pixels. */
export interface SettingsMetrics {
    titleFontSize: number;
    headingFontSize: number;
    headingLetterSpacing: number;
    /** Length of each thin rule flanking a section heading, and the gap between it and the text. */
    headingRuleLength: number;
    headingRuleGap: number;
    labelFontSize: number;
    controlFontSize: number;
    /** The section tabs: a little larger and wider-spaced than the option chips. */
    tabFontSize: number;
    tabLetterSpacing: number;
    tabPaddingX: number;
    tabGap: number;
    actionFontSize: number;
    chipPaddingX: number;
    chipPaddingY: number;
    chipGap: number;
    /** Width of the text field of an arrow selector, between its arrows. */
    selectorFieldWidth: number;
    arrowSize: number;
    sliderLineWidth: number;
    sliderLineThickness: number;
    sliderHandleSize: number;
    frameStroke: number;
    framePadding: number;
}

export interface HorizontalRule {
    x0: number;
    x1: number;
    y: number;
}

export interface DottedLine {
    x: number;
    y0: number;
    y1: number;
}

/** One line of the settings page: a section title or a `label  control` row. */
export type SettingsEntry = 'heading' | 'row';

export interface SettingsLayoutOptions {
    /** Reserve a row of section tabs between the title and the first entry. */
    tabs?: boolean;
}

export interface SettingsLayout {
    unit: number;
    centerX: number;
    /** Dotted lines running from the screen edges toward the content, top and bottom. */
    dottedTop: DottedLine;
    dottedBottom: DottedLine;
    dotSize: number;
    dotPitch: number;
    title: { x: number; y: number };
    /** Vertical centre of the tab row, when the layout was asked for one. */
    tabsY: number | null;
    titleRules: { above: HorizontalRule; below: HorizontalRule };
    /** Vertical centre of each settings row, top to bottom. */
    rowYs: number[];
    /** Vertical centre of each section heading, top to bottom. */
    headingYs: number[];
    /** Right edge of the (right-aligned) row labels, and where the controls start. */
    labelRightX: number;
    controlLeftX: number;
    controlWidth: number;
    action: { x: number; y: number; ruleAbove: HorizontalRule; ruleBelow: HorizontalRule };
    /** The gamepad "confirm / back" hints, bottom-right. */
    hints: { confirm: { x: number; y: number }; back: { x: number; y: number } };
    metrics: SettingsMetrics;
}

/**
 * Pure layout math for the settings screen. `entries` is the page top to
 * bottom (`'heading'` or `'row'`); a heading sits a little further from the
 * row above it than rows do from each other, so the sections read as groups.
 * The block (title, entries, action) is centred vertically; the dotted lines
 * fill the space above and below it. With `options.tabs` a row of section tabs
 * is reserved under the title. If the block wouldn't fit the window height the
 * whole page shrinks to fit.
 */
export function computeSettingsLayout(
    viewWidth: number,
    viewHeight: number,
    entries: readonly SettingsEntry[],
    options: SettingsLayoutOptions = {},
): SettingsLayout {
    const firstEntryOffset = REF.firstRowOffset + (options.tabs ? REF.tabsBlock : 0);

    // Offsets from the top rule, in reference px.
    const entryOffsets: number[] = [];
    let offset = firstEntryOffset;
    entries.forEach((entry, index) => {
        if (index > 0) {
            offset += entry === 'heading' ? REF.rowToHeading : entries[index - 1] === 'heading' ? REF.headingToRow : REF.rowPitch;
        }
        entryOffsets.push(offset);
    });

    const lastEntryOffset = entryOffsets.length > 0 ? offset : firstEntryOffset;
    const actionRuleAboveOffset = lastEntryOffset + REF.backRuleAboveGap;
    const actionTextOffset = actionRuleAboveOffset + REF.backTextGap;
    const blockHeight = actionRuleAboveOffset + REF.backRuleBelowGap;

    const unit = Math.min(viewHeight / REFERENCE_HEIGHT, viewWidth / REFERENCE_WIDTH, viewHeight / (blockHeight + MIN_VERTICAL_MARGIN));
    const centerX = viewWidth / 2;

    const topRuleY = (viewHeight - blockHeight * unit) / 2;
    const at = (offsetPx: number): number => topRuleY + offsetPx * unit;

    const rule = (width: number, offsetPx: number): HorizontalRule => ({
        x0: centerX - (width * unit) / 2,
        x1: centerX + (width * unit) / 2,
        y: at(offsetPx),
    });

    const rowYs: number[] = [];
    const headingYs: number[] = [];
    entries.forEach((entry, index) => {
        (entry === 'heading' ? headingYs : rowYs).push(at(entryOffsets[index]));
    });

    const clearance = REF.dotClearance * unit;
    const bottomRule = rule(REF.longRule, blockHeight);

    return {
        unit,
        centerX,
        dottedTop: { x: centerX, y0: 0, y1: topRuleY - clearance },
        dottedBottom: { x: centerX, y0: bottomRule.y + clearance, y1: viewHeight },
        dotSize: REF.dotSize * unit,
        dotPitch: REF.dotPitch * unit,
        title: { x: centerX, y: at(REF.titleOffset) },
        tabsY: options.tabs ? at(REF.tabsOffset) : null,
        titleRules: { above: rule(REF.longRule, 0), below: rule(REF.shortRule, REF.titleBottomRuleOffset) },
        rowYs,
        headingYs,
        labelRightX: centerX - REF.labelGap * unit,
        controlLeftX: centerX + REF.controlGap * unit,
        controlWidth: REF.controlWidth * unit,
        action: {
            x: centerX,
            y: at(actionTextOffset),
            ruleAbove: rule(REF.shortRule, actionRuleAboveOffset),
            ruleBelow: bottomRule,
        },
        hints: {
            confirm: { x: viewWidth - 250 * unit, y: viewHeight - 60 * unit },
            back: { x: viewWidth - 100 * unit, y: viewHeight - 60 * unit },
        },
        metrics: {
            titleFontSize: 62 * unit,
            headingFontSize: 20 * unit,
            headingLetterSpacing: 6 * unit,
            headingRuleLength: 130 * unit,
            headingRuleGap: 22 * unit,
            labelFontSize: 30 * unit,
            controlFontSize: 24 * unit,
            tabFontSize: 22 * unit,
            tabLetterSpacing: 3 * unit,
            tabPaddingX: 20 * unit,
            tabGap: 30 * unit,
            actionFontSize: 34 * unit,
            chipPaddingX: 14 * unit,
            chipPaddingY: 4 * unit,
            chipGap: 44 * unit,
            selectorFieldWidth: 250 * unit,
            arrowSize: 20 * unit,
            sliderLineWidth: 310 * unit,
            sliderLineThickness: Math.max(2, 2 * unit),
            sliderHandleSize: 22 * unit,
            frameStroke: Math.max(1, 2 * unit),
            framePadding: 8 * unit,
        },
    };
}

/** Centres of the dots along a vertical dotted line, `pitch` apart, starting `pitch / 2` in. */
export function computeDotPositions(y0: number, y1: number, pitch: number): number[] {
    const positions: number[] = [];
    if (pitch <= 0) {
        return positions;
    }

    for (let y = y0 + pitch / 2; y <= y1; y += pitch) {
        positions.push(y);
    }
    return positions;
}
