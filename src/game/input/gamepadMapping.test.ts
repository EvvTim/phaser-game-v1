import { describe, expect, it } from 'vitest';
import {
    detectControllerFamily,
    detectGamepadMapping,
    getButtonLabel,
    getControllerDisplayName,
    readHatDirection,
    STANDARD_MAPPING,
    STANDARD_MAPPINGS,
} from './gamepadMapping';

describe('detectControllerFamily', () => {
    it.each([
        ['Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', 'xbox'],
        ['Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)', 'playstation'],
        ['Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)', 'nintendo'],
        ['Steam Deck Controller (STANDARD GAMEPAD Vendor: 28de Product: 1205)', 'steam'],
        ['054c-05c4-Wireless Controller', 'playstation'], // Firefox id format
        ['045E-028E-Controller (XBOX 360 For Windows)', 'xbox'],
        ['DUALSHOCK 4 Wireless Controller Extended Gamepad', 'playstation'], // Safari: no vendor id
        ['Xbox 360 Controller (XInput STANDARD GAMEPAD)', 'xbox'], // Chrome/Windows: no vendor id
        ['Nintendo Switch Pro Controller', 'nintendo'],
        ['8BitDo Pro 2 (STANDARD GAMEPAD Vendor: 2dc8 Product: 6003)', 'generic'],
        ['Generic Gamepad', 'generic'],
    ])('classifies "%s" as %s', (padId, family) => {
        expect(detectControllerFamily(padId)).toBe(family);
    });

    it('prefers the vendor id over a misleading name', () => {
        expect(detectControllerFamily('Xbox-style pad (Vendor: 054c Product: 0000)')).toBe('playstation');
    });
});

describe('detectGamepadMapping', () => {
    it('uses the brand-specific standard layout when the browser reports one', () => {
        const xbox = detectGamepadMapping('Xbox Controller (Vendor: 045e Product: 02fd)', 'standard');
        expect(xbox).toBe(STANDARD_MAPPINGS.xbox);
        expect(xbox.family).toBe('xbox');

        expect(detectGamepadMapping('Wireless Controller (Vendor: 054c Product: 09cc)', 'standard').family).toBe(
            'playstation',
        );
    });

    it('shares the same button indices across every standard layout', () => {
        for (const mapping of Object.values(STANDARD_MAPPINGS)) {
            expect(mapping.shoulderLeftButton).toBe(4);
            expect(mapping.shoulderRightButton).toBe(5);
            expect(mapping.dpad).toEqual({ type: 'buttons', up: 12, down: 13, left: 14, right: 15 });
        }
    });

    it("follows each brand's confirm/back convention", () => {
        // Xbox / PlayStation / Steam / generic: bottom face button (0) confirms.
        for (const family of ['xbox', 'playstation', 'steam', 'generic'] as const) {
            expect(STANDARD_MAPPINGS[family].confirmButton).toBe(0);
            expect(STANDARD_MAPPINGS[family].backButton).toBe(1);
        }
        // Nintendo: the right face button (1, "A") confirms.
        expect(STANDARD_MAPPINGS.nintendo.confirmButton).toBe(1);
        expect(STANDARD_MAPPINGS.nintendo.backButton).toBe(0);
    });

    it('recognizes the Switch 2 Pro Controller by vendor/product id, case-insensitively', () => {
        const mapping = detectGamepadMapping('Pro Controller 2 (Finally) (Vendor: 057E Product: 2069)', '');
        expect(mapping.family).toBe('nintendo');
        expect(mapping.confirmButton).toBe(1);
        expect(mapping.backButton).toBe(0);
        expect(mapping.shoulderLeftButton).toBe(9);
        expect(mapping.shoulderRightButton).toBe(10);
    });

    it('does not apply the Switch 2 Pro override to a pad the browser already maps as standard', () => {
        const mapping = detectGamepadMapping('Pro Controller 2 (Vendor: 057e Product: 2069)', 'standard');
        expect(mapping).toBe(STANDARD_MAPPINGS.nintendo);
        expect(mapping.shoulderLeftButton).toBe(4);
    });

    it('marks only hardware-measured mappings as measured', () => {
        expect(detectGamepadMapping('Pro Controller 2 (Vendor: 057e Product: 2069)', '').measured).toBe(true);
        expect(detectGamepadMapping('Some Unknown Pad (Vendor: dead Product: beef)', '').measured).toBeUndefined();
        for (const mapping of Object.values(STANDARD_MAPPINGS)) {
            expect(mapping.measured).toBeUndefined();
        }
    });

    it('falls back to the standard layout for an unrecognized non-standard pad', () => {
        expect(detectGamepadMapping('Some Unknown Pad (Vendor: dead Product: beef)', '')).toBe(STANDARD_MAPPING);
    });

    it('falls back to the standard layout when the id has no vendor/product info', () => {
        expect(detectGamepadMapping('Generic Gamepad', '')).toBe(STANDARD_MAPPING);
    });
});

describe('getControllerDisplayName', () => {
    it.each([
        ['Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', 'Xbox Wireless Controller'],
        ['054c-09cc-Wireless Controller', 'Wireless Controller'],
        ['DUALSHOCK 4 Wireless Controller Extended Gamepad', 'DUALSHOCK 4 Wireless Controller Extended Gamepad'],
        ['Xbox 360 Controller (XInput STANDARD GAMEPAD)', 'Xbox 360 Controller'],
        ['(weird)', '(weird)'],
    ])('turns "%s" into "%s"', (padId, expected) => {
        expect(getControllerDisplayName(padId)).toBe(expected);
    });
});

describe('getButtonLabel', () => {
    it('returns the known name for a mapped button', () => {
        expect(getButtonLabel(STANDARD_MAPPING, 0)).toBe('A');
    });

    it('returns undefined for an index the mapping has no label for', () => {
        expect(getButtonLabel(STANDARD_MAPPING, 999)).toBeUndefined();
    });
});

describe('readHatDirection', () => {
    const source = {
        type: 'hatAxis' as const,
        axisIndex: 9,
        values: { up: -1, right: -3 / 7, down: 1 / 7, left: 5 / 7 },
        tolerance: 0.12,
    };

    it('reads each direction from its known value', () => {
        expect(readHatDirection(-1, source)).toBe('up');
        expect(readHatDirection(-3 / 7, source)).toBe('right');
        expect(readHatDirection(1 / 7, source)).toBe('down');
        expect(readHatDirection(5 / 7, source)).toBe('left');
    });

    it('tolerates small measurement noise around a known value', () => {
        expect(readHatDirection(-0.429 + 0.05, source)).toBe('right');
    });

    it('returns null for the released/center sentinel value', () => {
        expect(readHatDirection(9 / 7, source)).toBeNull();
    });

    it('returns null for a value between two directions', () => {
        expect(readHatDirection((-1 + -3 / 7) / 2, source)).toBeNull();
    });
});
