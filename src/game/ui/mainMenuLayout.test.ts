import { describe, expect, it } from 'vitest';
import { computeMainMenuLayout, computeSideShade } from './mainMenuLayout';

describe('computeMainMenuLayout', () => {
    it('reproduces the reference proportions at 1920x1080', () => {
        const [item] = computeMainMenuLayout(1920, 1080, 2).items;

        expect(item.x).toBe(143);
        expect(item.idle).toMatchObject({ width: 400, height: 72, fontSize: 38 });
        expect(item.active).toMatchObject({ width: 484, height: 77, fontSize: 45 });
    });

    it('makes the highlighted state wider and bigger than the idle one', () => {
        const [item] = computeMainMenuLayout(1920, 1080, 2).items;

        expect(item.active.width).toBeGreaterThan(item.idle.width);
        expect(item.active.height).toBeGreaterThan(item.idle.height);
        expect(item.active.fontSize).toBeGreaterThan(item.idle.fontSize);
        expect(item.active.labelInset).toBeGreaterThan(item.idle.labelInset);
    });

    it('anchors the last item to the bottom and stacks the rest upward', () => {
        const [first, second] = computeMainMenuLayout(1920, 1080, 2).items;

        expect(second.y).toBe(1080 - 198);
        expect(second.y - first.y).toBe(90);
    });

    it('keeps the last item in place when more entries are added', () => {
        const two = computeMainMenuLayout(1920, 1080, 2).items;
        const four = computeMainMenuLayout(1920, 1080, 4).items;

        expect(four[3].y).toBe(two[1].y);
        expect(four[0].y).toBeLessThan(two[0].y);
    });

    it('scales everything with the viewport height', () => {
        const small = computeMainMenuLayout(960, 540, 2);
        const reference = computeMainMenuLayout(1920, 1080, 2);

        expect(small.items[0].idle.height).toBe(reference.items[0].idle.height / 2);
        expect(small.items[0].active.fontSize).toBe(reference.items[0].active.fontSize / 2);
        expect(small.items[1].y).toBe(reference.items[1].y / 2);
    });

    it('never lets the highlighted plate overflow a narrow viewport', () => {
        const [item] = computeMainMenuLayout(500, 1000, 2).items;

        expect(item.x + item.active.width).toBeLessThanOrEqual(500);
        expect(item.idle.width).toBeLessThan(item.active.width);
    });

    it('puts the hint in the bottom-right and the version in the bottom-left', () => {
        const layout = computeMainMenuLayout(1920, 1080, 2);

        expect(layout.hint.x).toBeGreaterThan(1920 / 2);
        expect(layout.hint.y).toBeGreaterThan(1080 / 2);
        expect(layout.version.x).toBeLessThan(1920 / 2);
        expect(layout.version.y).toBeGreaterThan(1080 / 2);
    });
});

describe('computeSideShade', () => {
    const fullWidthBackground = { x: 0, width: 1920 };

    it('darkens everything left of the characters', () => {
        const { left } = computeSideShade(1920, fullWidthBackground);

        expect(left.width).toBeCloseTo(1920 * 0.57);
        expect(left.alpha).toBeGreaterThan(0.5);
    });

    it('follows the background when it is wider than the window and cropped', () => {
        // Cover-fit on a tall window: the image overflows the view on both sides.
        const { left } = computeSideShade(1000, { x: -300, width: 1600 });

        expect(left.width).toBeCloseTo(-300 + 1600 * 0.57);
    });

    it('keeps the shade strips inside the viewport and off each other', () => {
        for (const background of [fullWidthBackground, { x: -300, width: 1600 }, { x: 0, width: 400 }]) {
            const { left, right } = computeSideShade(1000, background);

            expect(left.width).toBeGreaterThanOrEqual(0);
            expect(right.width).toBeGreaterThanOrEqual(0);
            expect(left.width + right.width).toBeLessThanOrEqual(1000);
        }
    });

    it('shades the far right edge more lightly than the left', () => {
        const { left, right } = computeSideShade(1920, fullWidthBackground);

        expect(right.alpha).toBeLessThan(left.alpha);
        expect(right.width).toBeLessThan(left.width);
    });
});
