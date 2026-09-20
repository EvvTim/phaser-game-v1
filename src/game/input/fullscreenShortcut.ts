/** The part of a keyboard event the fullscreen shortcut looks at. */
export interface ShortcutKeyEvent {
    code: string;
    repeat: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
}

/**
 * Whether a key press should toggle fullscreen: a plain `F`.
 * - It goes by the physical key (`code`), not the character, so it works on any
 *   keyboard layout — on a Russian or Ukrainian one the same key types "а".
 * - Auto-repeat is ignored, otherwise holding the key would flip the mode back and forth.
 * - Combinations with Ctrl, Cmd or Alt are ignored: those belong to the browser and the OS
 *   (Ctrl+F is find-in-page, Cmd+Ctrl+F is macOS's own fullscreen).
 */
export function isFullscreenShortcut(event: ShortcutKeyEvent): boolean {
    return event.code === 'KeyF' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey;
}
