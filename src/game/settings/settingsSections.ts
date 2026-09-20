/** Every Settings section (one tab each), in tab order. */
export const SETTINGS_SECTIONS = ['display', 'language', 'audio', 'controls'] as const;

export type SettingsSectionKey = (typeof SETTINGS_SECTIONS)[number];

/** Sections that only exist in DEV (Controls holds just the gamepad tester). */
const DEV_ONLY_SECTIONS: readonly SettingsSectionKey[] = ['controls'];

const FALLBACK_SECTION: SettingsSectionKey = 'display';

/** The sections to show: all of them, or all except the dev-only ones outside DEV. */
export function getVisibleSections(isDev: boolean): readonly SettingsSectionKey[] {
    return isDev ? SETTINGS_SECTIONS : SETTINGS_SECTIONS.filter((key) => !DEV_ONLY_SECTIONS.includes(key));
}

/** The requested section if it is visible, otherwise Display. */
export function resolveSection(
    requested: SettingsSectionKey | undefined,
    visible: readonly SettingsSectionKey[],
): SettingsSectionKey {
    return requested !== undefined && visible.includes(requested) ? requested : FALLBACK_SECTION;
}

/** The section `delta` places from `current` (wrapping around) — what the gamepad's L / R shoulders switch to. */
export function stepSection(
    current: SettingsSectionKey,
    visible: readonly SettingsSectionKey[],
    delta: number,
): SettingsSectionKey {
    const index = visible.indexOf(current);
    if (index === -1) {
        return resolveSection(undefined, visible);
    }

    return visible[(index + delta + visible.length) % visible.length];
}
