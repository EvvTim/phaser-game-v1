import { describe, expect, it } from 'vitest';
import { isFullscreenShortcut, type ShortcutKeyEvent } from './fullscreenShortcut';

const press = (overrides: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent => ({
    code: 'KeyF',
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...overrides,
});

describe('isFullscreenShortcut', () => {
    it('accepts a plain F', () => {
        expect(isFullscreenShortcut(press())).toBe(true);
    });

    it('goes by the physical key, so a Cyrillic layout works too', () => {
        // The same physical key types "а" on a Russian layout, but its code is still KeyF.
        expect(isFullscreenShortcut(press({ code: 'KeyF' }))).toBe(true);
    });

    it('ignores every other key', () => {
        for (const code of ['KeyG', 'KeyD', 'Enter', 'Escape', 'F11', 'Space']) {
            expect(isFullscreenShortcut(press({ code }))).toBe(false);
        }
    });

    it('ignores auto-repeat, so holding F does not flip the mode back and forth', () => {
        expect(isFullscreenShortcut(press({ repeat: true }))).toBe(false);
    });

    it('leaves browser and OS shortcuts alone', () => {
        expect(isFullscreenShortcut(press({ ctrlKey: true }))).toBe(false);
        expect(isFullscreenShortcut(press({ metaKey: true }))).toBe(false);
        expect(isFullscreenShortcut(press({ altKey: true }))).toBe(false);
        expect(isFullscreenShortcut(press({ ctrlKey: true, metaKey: true }))).toBe(false);
    });
});
