/**
 * The wood/green UI kit atlas (see art-source/ui/README.md for how it was
 * generated from the raw sprite sheet). Reference frames through UI_FRAMES
 * rather than string literals at call sites.
 */
export const UI_ATLAS_KEY = 'ui';

export const UI_FRAMES = Object.freeze({
    panelWood: 'panel_wood',
    bannerRect: 'banner_rect',
    bannerHex: 'banner_hex',
    bannerArrow: 'banner_arrow',
    ribbonLong: 'ribbon_bar_long',
    barFull: 'bar_full',
    bar80: 'bar_80',
    bar60: 'bar_60',
    bar40: 'bar_40',
    bar20: 'bar_20',
    barEmpty: 'bar_empty',
    starOutline: 'star_outline',
    starFilled: 'star_filled',
    arrowLeft: 'arrow_left',
    arrowRight: 'arrow_right',
    markX: 'mark_x',
    markCheck: 'mark_check',
    squareMenu: 'icon_square_menu',
    squareBack: 'icon_square_back',
    squareSettings: 'icon_square_settings',
    squareInfo: 'icon_square_info',
    squareHome: 'icon_square_home',
    squareSoundOn: 'icon_square_sound_on',
    squareSoundOff: 'icon_square_sound_off',
    squareDisabled: 'icon_square_disabled',
    squareBlank: 'icon_square_blank',
    roundMenu: 'icon_round_menu',
    roundBack: 'icon_round_back',
    roundSettings: 'icon_round_settings',
    roundInfo: 'icon_round_info',
    roundHome: 'icon_round_home',
    roundSoundOn: 'icon_round_sound_on',
    roundSoundOff: 'icon_round_sound_off',
    roundDisabled: 'icon_round_disabled',
    roundBlank: 'icon_round_blank',
} as const);
