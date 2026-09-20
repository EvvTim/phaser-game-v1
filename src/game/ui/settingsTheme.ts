/**
 * Colours of the settings screen, sampled from examples/settings-menu-example.png:
 * warm cream ink on a dark brown.
 */
export const SETTINGS_COLORS = Object.freeze({
    /** Cream ink (lines, dots, the selected chip and the slider), as a number for shapes. */
    cream: 0xfffff0,
    creamCss: '#fffff0',
    /** An option that isn't selected. */
    idleCss: '#c8c5b6',
    /** Pointer over an unselected option. */
    hoverCss: '#fffff0',
    /** Text on a cream (selected) chip. */
    darkCss: '#16110b',
    /** The dark base under the blurred artwork behind the settings screens. */
    curtain: 0x1e1816,
} as const);
