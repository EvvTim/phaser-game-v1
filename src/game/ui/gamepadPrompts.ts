import type { ControllerFamily } from '../input/gamepadMapping';

/**
 * Button-prompt icons from AL2009man's Gamepad Prompt Asset Pack (MIT — see
 * public/assets/gamepad/LICENSE-Gamepad-Prompt-Asset-Pack.txt and
 * art-source/gamepad/README.md for how the atlas is built). Reference
 * frames through GAMEPAD_FRAMES rather than string literals at call sites.
 *
 * Every frame also has a "pressed" twin (white fill instead of black) named
 * `<frame>_on` — see {@link getPressedFrame}.
 */
export const GAMEPAD_ATLAS_KEY = 'gamepad-prompts';

export const GAMEPAD_FRAMES = Object.freeze({
    sharedL1: 'shared_l1',
    sharedR1: 'shared_r1',
    sharedL2: 'shared_l2',
    sharedR2: 'shared_r2',
    sharedA: 'shared_a',
    sharedB: 'shared_b',
    sharedX: 'shared_x',
    sharedY: 'shared_y',
    sharedSelect: 'shared_select',
    sharedStart: 'shared_start',
    sharedDpad: 'shared_dpad',
    sharedDpadUp: 'shared_dpad_up',
    sharedDpadDown: 'shared_dpad_down',
    sharedDpadLeft: 'shared_dpad_left',
    sharedDpadRight: 'shared_dpad_right',
    nintendoL: 'nintendo_l',
    nintendoR: 'nintendo_r',
    nintendoZl: 'nintendo_zl',
    nintendoZr: 'nintendo_zr',
    nintendoMinus: 'nintendo_minus',
    nintendoPlus: 'nintendo_plus',
    psCross: 'ps_cross',
    psCircle: 'ps_circle',
    psSquare: 'ps_square',
    psTriangle: 'ps_triangle',
    psCreate: 'ps_create',
    psOptions: 'ps_options',
    xboxView: 'xbox_view',
    xboxMenu: 'xbox_menu',
} as const);

export type GamepadFrame = (typeof GAMEPAD_FRAMES)[keyof typeof GAMEPAD_FRAMES];

/** The inverted (white-filled) twin of a frame, used to show a button as pressed. */
export function getPressedFrame(frame: GamepadFrame): string {
    return `${frame}_on`;
}

/**
 * What a prompt refers to. `confirm`/`back` are semantic (they land on
 * different physical buttons per brand); the `face*` roles are positional
 * (south = bottom face button, matching W3C standard index 0, and so on).
 */
export type PromptRole =
    | 'shoulderLeft'
    | 'shoulderRight'
    | 'triggerLeft'
    | 'triggerRight'
    | 'confirm'
    | 'back'
    | 'faceSouth'
    | 'faceEast'
    | 'faceWest'
    | 'faceNorth'
    | 'select'
    | 'start'
    | 'dpad'
    | 'dpadUp'
    | 'dpadDown'
    | 'dpadLeft'
    | 'dpadRight';

type FamilyIcons = Record<PromptRole, GamepadFrame>;

/**
 * The pack has no Xbox-specific LB/RB/LT/RT or Steam-specific art, so those
 * (and unrecognized pads) share the plain L1/R1/L2/R2 + A/B/X/Y set; the
 * brand-specific overrides below cover PlayStation (Cross/Circle/Square/
 * Triangle, Create/Options), Nintendo (L/R/ZL/ZR, -/+, and A/B/X/Y in
 * *their* positions — B bottom, A right, Y left, X top) and Xbox/Steam's
 * View/Menu pair (the same pictograms on both).
 */
const SHARED_ICONS: FamilyIcons = {
    shoulderLeft: GAMEPAD_FRAMES.sharedL1,
    shoulderRight: GAMEPAD_FRAMES.sharedR1,
    triggerLeft: GAMEPAD_FRAMES.sharedL2,
    triggerRight: GAMEPAD_FRAMES.sharedR2,
    confirm: GAMEPAD_FRAMES.sharedA,
    back: GAMEPAD_FRAMES.sharedB,
    faceSouth: GAMEPAD_FRAMES.sharedA,
    faceEast: GAMEPAD_FRAMES.sharedB,
    faceWest: GAMEPAD_FRAMES.sharedX,
    faceNorth: GAMEPAD_FRAMES.sharedY,
    select: GAMEPAD_FRAMES.sharedSelect,
    start: GAMEPAD_FRAMES.sharedStart,
    dpad: GAMEPAD_FRAMES.sharedDpad,
    dpadUp: GAMEPAD_FRAMES.sharedDpadUp,
    dpadDown: GAMEPAD_FRAMES.sharedDpadDown,
    dpadLeft: GAMEPAD_FRAMES.sharedDpadLeft,
    dpadRight: GAMEPAD_FRAMES.sharedDpadRight,
};

const XBOX_STYLE_ICONS: FamilyIcons = {
    ...SHARED_ICONS,
    select: GAMEPAD_FRAMES.xboxView,
    start: GAMEPAD_FRAMES.xboxMenu,
};

const ICONS_BY_FAMILY: Readonly<Record<ControllerFamily, FamilyIcons>> = {
    xbox: XBOX_STYLE_ICONS,
    steam: XBOX_STYLE_ICONS,
    generic: SHARED_ICONS,
    playstation: {
        ...SHARED_ICONS,
        confirm: GAMEPAD_FRAMES.psCross,
        back: GAMEPAD_FRAMES.psCircle,
        faceSouth: GAMEPAD_FRAMES.psCross,
        faceEast: GAMEPAD_FRAMES.psCircle,
        faceWest: GAMEPAD_FRAMES.psSquare,
        faceNorth: GAMEPAD_FRAMES.psTriangle,
        select: GAMEPAD_FRAMES.psCreate,
        start: GAMEPAD_FRAMES.psOptions,
    },
    nintendo: {
        ...SHARED_ICONS,
        shoulderLeft: GAMEPAD_FRAMES.nintendoL,
        shoulderRight: GAMEPAD_FRAMES.nintendoR,
        triggerLeft: GAMEPAD_FRAMES.nintendoZl,
        triggerRight: GAMEPAD_FRAMES.nintendoZr,
        // Confirm is the right face button, "A" — same glyph as Xbox's A, different physical button.
        confirm: GAMEPAD_FRAMES.sharedA,
        back: GAMEPAD_FRAMES.sharedB,
        faceSouth: GAMEPAD_FRAMES.sharedB,
        faceEast: GAMEPAD_FRAMES.sharedA,
        faceWest: GAMEPAD_FRAMES.sharedY,
        faceNorth: GAMEPAD_FRAMES.sharedX,
        select: GAMEPAD_FRAMES.nintendoMinus,
        start: GAMEPAD_FRAMES.nintendoPlus,
    },
};

/** The atlas frame showing `role`'s button on a controller of `family`. */
export function getPromptFrame(family: ControllerFamily, role: PromptRole): GamepadFrame {
    return ICONS_BY_FAMILY[family][role];
}
