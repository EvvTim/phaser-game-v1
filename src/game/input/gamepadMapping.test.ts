import { describe, expect, it } from 'vitest';
import { detectGamepadMapping, getButtonLabel, readHatDirection, STANDARD_MAPPING } from './gamepadMapping';

describe('detectGamepadMapping', () => {
    it('uses the standard mapping when the browser reports one', () => {
        expect(detectGamepadMapping('Xbox Controller (Vendor: 045e Product: 02fd)', 'standard')).toBe(
            STANDARD_MAPPING,
        );
    });

    it('recognizes the Switch 2 Pro Controller by vendor/product id, case-insensitively', () => {
        const mapping = detectGamepadMapping('Pro Controller 2 (Finally) (Vendor: 057E Product: 2069)', '');
        expect(mapping).not.toBe(STANDARD_MAPPING);
        expect(mapping.confirmButton).toBe(1);
        expect(mapping.backButton).toBe(0);
        expect(mapping.shoulderLeftButton).toBe(9);
        expect(mapping.shoulderRightButton).toBe(10);
    });

    it('falls back to the standard mapping for an unrecognized non-standard pad', () => {
        expect(detectGamepadMapping('Some Unknown Pad (Vendor: dead Product: beef)', '')).toBe(STANDARD_MAPPING);
    });

    it('falls back to the standard mapping when the id has no vendor/product info', () => {
        expect(detectGamepadMapping('Generic Gamepad', '')).toBe(STANDARD_MAPPING);
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
