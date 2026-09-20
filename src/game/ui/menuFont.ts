/**
 * Exo 2 SemiBold (SIL OFL — license in public/assets/fonts/), the rounded
 * squared "techno" face of the main menu. Picked as the closest free match
 * to the mock-up's lettering (letter shapes, stroke weight and proportions
 * compared letter by letter against examples/main-menu-example.png) among
 * ~50 free fonts, and the only close one that also covers Cyrillic, so all
 * four UI languages look the same. Subset to Latin, Latin Extended-A and
 * Cyrillic.
 */
export const MENU_FONT_FAMILY = 'Exo 2';

/** CSS weight of the bundled instance — use it as Phaser's `fontStyle`. */
export const MENU_FONT_WEIGHT = '600';

/** Full CSS stack: the system faces only show if the font file fails to load. */
export const MENU_FONT_STACK = `"${MENU_FONT_FAMILY}", Arial, sans-serif`;

/**
 * Phaser draws Text onto a canvas, so a web font must be loaded before the
 * first Text using it is created — otherwise it is measured and drawn with
 * the fallback. Resolves either way; a failed load just means the fallback.
 */
export async function loadMenuFont(): Promise<void> {
    const face = new FontFace(MENU_FONT_FAMILY, 'url(assets/fonts/Exo2-SemiBold.woff2)', {
        weight: MENU_FONT_WEIGHT,
    });

    try {
        document.fonts.add(await face.load());
    } catch {
        // Keep going with the fallback stack in MENU_FONT_STACK.
    }
}
