import { describe, expect, it } from 'vitest';
import atlasJson from '../../../public/assets/gamepad/prompts-atlas.json?raw';
import { CONTROLLER_FAMILIES } from '../input/gamepadMapping';
import { GAMEPAD_FRAMES, getPressedFrame, getPromptFrame, type PromptRole } from './gamepadPrompts';

const ROLES: PromptRole[] = [
    'shoulderLeft',
    'shoulderRight',
    'triggerLeft',
    'triggerRight',
    'confirm',
    'back',
    'faceSouth',
    'faceEast',
    'faceWest',
    'faceNorth',
    'select',
    'start',
    'dpad',
    'dpadUp',
    'dpadDown',
    'dpadLeft',
    'dpadRight',
];

describe('getPromptFrame', () => {
    it('shows PlayStation glyphs for its face buttons', () => {
        expect(getPromptFrame('playstation', 'confirm')).toBe(GAMEPAD_FRAMES.psCross);
        expect(getPromptFrame('playstation', 'back')).toBe(GAMEPAD_FRAMES.psCircle);
    });

    it('shows plain L / R labels for Nintendo shoulders and L1 / R1 for everyone else', () => {
        expect(getPromptFrame('nintendo', 'shoulderLeft')).toBe(GAMEPAD_FRAMES.nintendoL);
        expect(getPromptFrame('nintendo', 'shoulderRight')).toBe(GAMEPAD_FRAMES.nintendoR);
        for (const family of ['xbox', 'playstation', 'steam', 'generic'] as const) {
            expect(getPromptFrame(family, 'shoulderLeft')).toBe(GAMEPAD_FRAMES.sharedL1);
            expect(getPromptFrame(family, 'shoulderRight')).toBe(GAMEPAD_FRAMES.sharedR1);
        }
    });

    it('shows A / B for every non-PlayStation family', () => {
        for (const family of ['xbox', 'nintendo', 'steam', 'generic'] as const) {
            expect(getPromptFrame(family, 'confirm')).toBe(GAMEPAD_FRAMES.sharedA);
            expect(getPromptFrame(family, 'back')).toBe(GAMEPAD_FRAMES.sharedB);
        }
    });

    it('places Nintendo A/B/X/Y in their own positions (B bottom, A right, Y left, X top)', () => {
        expect(getPromptFrame('nintendo', 'faceSouth')).toBe(GAMEPAD_FRAMES.sharedB);
        expect(getPromptFrame('nintendo', 'faceEast')).toBe(GAMEPAD_FRAMES.sharedA);
        expect(getPromptFrame('nintendo', 'faceWest')).toBe(GAMEPAD_FRAMES.sharedY);
        expect(getPromptFrame('nintendo', 'faceNorth')).toBe(GAMEPAD_FRAMES.sharedX);
        // ...and its confirm (the right button, "A") matches what the diagram shows there.
        expect(getPromptFrame('nintendo', 'confirm')).toBe(getPromptFrame('nintendo', 'faceEast'));
    });

    it("keeps each brand's confirm/back glyphs equal to its diagram's positions", () => {
        for (const family of ['xbox', 'playstation', 'steam', 'generic'] as const) {
            expect(getPromptFrame(family, 'confirm')).toBe(getPromptFrame(family, 'faceSouth'));
            expect(getPromptFrame(family, 'back')).toBe(getPromptFrame(family, 'faceEast'));
        }
    });

    it('uses -/+ for Nintendo, Create/Options for PlayStation and View/Menu for Xbox and Steam', () => {
        expect(getPromptFrame('nintendo', 'select')).toBe(GAMEPAD_FRAMES.nintendoMinus);
        expect(getPromptFrame('nintendo', 'start')).toBe(GAMEPAD_FRAMES.nintendoPlus);
        expect(getPromptFrame('playstation', 'select')).toBe(GAMEPAD_FRAMES.psCreate);
        expect(getPromptFrame('playstation', 'start')).toBe(GAMEPAD_FRAMES.psOptions);
        for (const family of ['xbox', 'steam'] as const) {
            expect(getPromptFrame(family, 'select')).toBe(GAMEPAD_FRAMES.xboxView);
            expect(getPromptFrame(family, 'start')).toBe(GAMEPAD_FRAMES.xboxMenu);
        }
    });

    it('has an icon for every family and role', () => {
        for (const family of CONTROLLER_FAMILIES) {
            for (const role of ROLES) {
                expect(getPromptFrame(family, role)).toBeTruthy();
            }
        }
    });
});

describe('gamepad prompt atlas', () => {
    it('contains every frame the code references (regenerate with art-source/gamepad/build-atlas.mjs)', () => {
        const atlas = JSON.parse(atlasJson) as {
            frames: Record<string, unknown>;
        };

        const available = Object.keys(atlas.frames);

        for (const frame of Object.values(GAMEPAD_FRAMES)) {
            expect(available, frame).toContain(frame);
            expect(available, getPressedFrame(frame)).toContain(getPressedFrame(frame));
        }
    });
});
