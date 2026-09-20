import { describe, expect, it } from 'vitest';
import { computeDotPositions, computeSettingsLayout, type SettingsEntry } from './settingsLayout';

const rows = (count: number): SettingsEntry[] => Array.from({ length: count }, () => 'row');

/** display (2 rows), language (1), audio (4) — the production page. */
const PAGE: SettingsEntry[] = ['heading', 'row', 'row', 'heading', 'row', 'heading', 'row', 'row', 'row', 'row'];

describe('computeSettingsLayout', () => {
    it('reproduces the reference proportions at 1920x1080', () => {
        const layout = computeSettingsLayout(1920, 1080, rows(7));

        expect(layout.unit).toBe(1);
        expect(layout.centerX).toBe(960);
        expect(layout.labelRightX).toBe(940);
        expect(layout.controlLeftX).toBe(1020);
        expect(layout.controlWidth).toBe(430);
        expect(layout.metrics.titleFontSize).toBe(62);
    });

    it('spaces the rows evenly, top to bottom', () => {
        const { rowYs } = computeSettingsLayout(1920, 1080, rows(7));

        expect(rowYs).toHaveLength(7);
        for (let index = 1; index < rowYs.length; index += 1) {
            expect(rowYs[index] - rowYs[index - 1]).toBe(54);
        }
    });

    it('centres the whole block (top rule to bottom rule) vertically', () => {
        const layout = computeSettingsLayout(1920, 1080, rows(7));
        const above = layout.titleRules.above.y;
        const below = layout.action.ruleBelow.y;

        expect(above).toBeGreaterThan(0);
        expect(above + below).toBeCloseTo(1080);
    });

    it('stacks title, rows and the action in order', () => {
        const layout = computeSettingsLayout(1920, 1080, rows(7));

        expect(layout.titleRules.above.y).toBeLessThan(layout.title.y);
        expect(layout.title.y).toBeLessThan(layout.titleRules.below.y);
        expect(layout.titleRules.below.y).toBeLessThan(layout.rowYs[0]);
        expect(layout.rowYs[6]).toBeLessThan(layout.action.ruleAbove.y);
        expect(layout.action.ruleAbove.y).toBeLessThan(layout.action.y);
        expect(layout.action.y).toBeLessThan(layout.action.ruleBelow.y);
    });

    it('grows the block, not the row pitch, when a row is added', () => {
        const seven = computeSettingsLayout(1920, 1080, rows(7));
        const eight = computeSettingsLayout(1920, 1080, rows(8));

        expect(eight.rowYs[1] - eight.rowYs[0]).toBe(seven.rowYs[1] - seven.rowYs[0]);
        expect(eight.titleRules.above.y).toBeLessThan(seven.titleRules.above.y);
    });

    it('runs the dotted lines from the screen edges up to the content', () => {
        const layout = computeSettingsLayout(1920, 1080, rows(7));

        expect(layout.dottedTop.y0).toBe(0);
        expect(layout.dottedTop.y1).toBeLessThan(layout.titleRules.above.y);
        expect(layout.dottedBottom.y0).toBeGreaterThan(layout.action.ruleBelow.y);
        expect(layout.dottedBottom.y1).toBe(1080);
    });

    it('scales everything with the window height', () => {
        const half = computeSettingsLayout(960, 540, rows(7));
        const full = computeSettingsLayout(1920, 1080, rows(7));

        expect(half.unit).toBe(0.5);
        expect(half.metrics.controlFontSize).toBe(full.metrics.controlFontSize / 2);
        expect(half.rowYs[3]).toBeCloseTo(full.rowYs[3] / 2);
    });

    it('shrinks to fit a narrow window instead of overflowing', () => {
        const layout = computeSettingsLayout(500, 1080, rows(7));

        expect(layout.unit).toBeLessThan(0.5);
        expect(layout.controlLeftX + layout.controlWidth).toBeLessThanOrEqual(500);
        // Even the widest chip row (about 580 reference px right of the centre) stays inside.
        expect(layout.centerX + 580 * layout.unit).toBeLessThanOrEqual(500);
    });

    it('puts the gamepad hints in the bottom-right corner', () => {
        const { hints } = computeSettingsLayout(1920, 1080, rows(7));

        expect(hints.confirm.x).toBeLessThan(hints.back.x);
        expect(hints.back.x).toBeGreaterThan(1920 / 2);
        expect(hints.back.y).toBeGreaterThan(1080 / 2);
    });
});

describe('computeSettingsLayout with section headings', () => {
    it('lists headings and rows separately, in order', () => {
        const layout = computeSettingsLayout(1920, 1080, PAGE);

        expect(layout.headingYs).toHaveLength(3);
        expect(layout.rowYs).toHaveLength(7);
    });

    it('interleaves them top to bottom', () => {
        const layout = computeSettingsLayout(1920, 1080, PAGE);
        const [h1, h2, h3] = layout.headingYs;
        const r = layout.rowYs;

        expect(h1).toBeLessThan(r[0]);
        expect(r[1]).toBeLessThan(h2);
        expect(h2).toBeLessThan(r[2]);
        expect(r[2]).toBeLessThan(h3);
        expect(h3).toBeLessThan(r[3]);
    });

    it('keeps rows of one section at the normal pitch and sets each heading apart', () => {
        const { headingYs, rowYs } = computeSettingsLayout(1920, 1080, PAGE);

        expect(rowYs[1] - rowYs[0]).toBe(54);
        expect(rowYs[4] - rowYs[3]).toBe(54);
        // A heading is further from the row above it than rows are from each other.
        expect(headingYs[1] - rowYs[1]).toBeGreaterThan(54);
        expect(rowYs[2] - headingYs[1]).toBeLessThan(54);
    });

    it('still centres the block and fits it inside the window', () => {
        const layout = computeSettingsLayout(1920, 1080, PAGE);

        expect(layout.titleRules.above.y).toBeGreaterThan(0);
        expect(layout.titleRules.above.y + layout.action.ruleBelow.y).toBeCloseTo(1080);
        expect(layout.action.ruleBelow.y).toBeLessThan(1080);
    });

    it('shrinks a page too tall for a short window instead of overflowing', () => {
        const tall: SettingsEntry[] = [...PAGE, 'heading', 'row', 'row', 'row', 'row', 'row'];
        const layout = computeSettingsLayout(1920, 1080, tall);

        expect(layout.unit).toBeLessThan(1);
        expect(layout.titleRules.above.y).toBeGreaterThanOrEqual(0);
        expect(layout.action.ruleBelow.y).toBeLessThanOrEqual(1080);
    });

    it('works for a page with no entries', () => {
        const layout = computeSettingsLayout(1920, 1080, []);

        expect(layout.rowYs).toEqual([]);
        expect(layout.headingYs).toEqual([]);
    });
});

describe('computeSettingsLayout with a tab row', () => {
    const section: SettingsEntry[] = ['heading', 'row', 'row', 'row', 'row'];

    it('has no tab row unless asked for', () => {
        expect(computeSettingsLayout(1920, 1080, section).tabsY).toBeNull();
    });

    it('puts the tabs between the title and the first entry', () => {
        const layout = computeSettingsLayout(1920, 1080, section, { tabs: true });

        expect(layout.tabsY).not.toBeNull();
        expect(layout.titleRules.below.y).toBeLessThan(layout.tabsY as number);
        expect(layout.tabsY as number).toBeLessThan(layout.headingYs[0]);
    });

    it('moves everything below the tabs down by the same amount, leaving the spacing alone', () => {
        const plain = computeSettingsLayout(1920, 1080, section);
        const tabbed = computeSettingsLayout(1920, 1080, section, { tabs: true });

        expect(tabbed.headingYs[0] - tabbed.titleRules.below.y).toBeGreaterThan(plain.headingYs[0] - plain.titleRules.below.y);
        expect(tabbed.rowYs[1] - tabbed.rowYs[0]).toBe(plain.rowYs[1] - plain.rowYs[0]);
    });

    it('still centres the block', () => {
        const layout = computeSettingsLayout(1920, 1080, section, { tabs: true });

        expect(layout.titleRules.above.y + layout.action.ruleBelow.y).toBeCloseTo(1080);
    });
});

describe('computeDotPositions', () => {
    it('places dots a pitch apart, half a pitch in from the start', () => {
        expect(computeDotPositions(0, 50, 15)).toEqual([7.5, 22.5, 37.5]);
    });

    it('returns nothing for an empty range or a non-positive pitch', () => {
        expect(computeDotPositions(10, 10, 15)).toEqual([]);
        expect(computeDotPositions(0, 100, 0)).toEqual([]);
    });
});
