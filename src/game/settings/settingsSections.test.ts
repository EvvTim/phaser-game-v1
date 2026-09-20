import { describe, expect, it } from 'vitest';
import { getVisibleSections, resolveSection, SETTINGS_SECTIONS, stepSection } from './settingsSections';

describe('getVisibleSections', () => {
    it('shows every section in DEV', () => {
        expect(getVisibleSections(true)).toEqual(SETTINGS_SECTIONS);
    });

    it('hides the Controls (gamepad test) section outside DEV, keeping the order', () => {
        expect(getVisibleSections(false)).toEqual(['display', 'language', 'audio']);
    });
});

describe('resolveSection', () => {
    it('keeps a requested section that is visible', () => {
        expect(resolveSection('audio', getVisibleSections(false))).toBe('audio');
        expect(resolveSection('controls', getVisibleSections(true))).toBe('controls');
    });

    it('falls back to Display when the requested section is hidden or missing', () => {
        expect(resolveSection('controls', getVisibleSections(false))).toBe('display');
        expect(resolveSection(undefined, getVisibleSections(true))).toBe('display');
    });
});

describe('stepSection', () => {
    const visible = getVisibleSections(false);

    it('moves to the next and previous section', () => {
        expect(stepSection('display', visible, 1)).toBe('language');
        expect(stepSection('audio', visible, -1)).toBe('language');
    });

    it('wraps around at both ends', () => {
        expect(stepSection('audio', visible, 1)).toBe('display');
        expect(stepSection('display', visible, -1)).toBe('audio');
    });

    it('includes Controls in the cycle only in DEV', () => {
        expect(stepSection('audio', getVisibleSections(true), 1)).toBe('controls');
        expect(stepSection('audio', getVisibleSections(false), 1)).toBe('display');
    });

    it('falls back to Display when the current section is not visible', () => {
        expect(stepSection('controls', visible, 1)).toBe('display');
    });
});
