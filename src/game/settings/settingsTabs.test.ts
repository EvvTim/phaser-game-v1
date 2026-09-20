import { describe, expect, it } from 'vitest';
import { getVisibleTabs, resolveActiveTab, SETTINGS_TABS } from './settingsTabs';

describe('getVisibleTabs', () => {
    it('shows every tab in DEV', () => {
        expect(getVisibleTabs(true)).toEqual(SETTINGS_TABS);
    });

    it('hides the Controls (gamepad tester) tab outside DEV', () => {
        expect(getVisibleTabs(false)).not.toContain('controls');
    });

    it('keeps the remaining tabs in order outside DEV', () => {
        expect(getVisibleTabs(false)).toEqual(['display', 'language', 'audio']);
    });
});

describe('resolveActiveTab', () => {
    it('keeps a requested tab that is visible', () => {
        expect(resolveActiveTab('language', getVisibleTabs(false))).toBe('language');
        expect(resolveActiveTab('controls', getVisibleTabs(true))).toBe('controls');
    });

    it('falls back to Display when the requested tab is hidden', () => {
        expect(resolveActiveTab('controls', getVisibleTabs(false))).toBe('display');
    });

    it('falls back to Display when nothing is requested', () => {
        expect(resolveActiveTab(undefined, getVisibleTabs(true))).toBe('display');
    });
});
