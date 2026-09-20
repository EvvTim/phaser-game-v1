/**
 * Play Bold (SIL OFL — license in public/assets/fonts/), the squared
 * "techno" face of the main menu. Subset to Latin, Latin Extended-A and
 * Cyrillic so all four UI languages render with it.
 */
export const MENU_FONT_FAMILY = 'Play';

/** Full CSS stack: the system faces only show if the font file fails to load. */
export const MENU_FONT_STACK = `"${MENU_FONT_FAMILY}", "Arial Black", Arial, sans-serif`;

/**
 * Phaser draws Text onto a canvas, so a web font must be loaded before the
 * first Text using it is created — otherwise it is measured and drawn with
 * the fallback. Resolves either way; a failed load just means the fallback.
 */
export async function loadMenuFont(): Promise<void> {
    const face = new FontFace(MENU_FONT_FAMILY, 'url(assets/fonts/Play-Bold.woff2)', { weight: '700' });

    try {
        document.fonts.add(await face.load());
    } catch {
        // Keep going with the fallback stack in MENU_FONT_STACK.
    }
}
