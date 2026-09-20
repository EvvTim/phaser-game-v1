/** Every Settings tab, in display order. */
export const SETTINGS_TABS = ['display', 'controls', 'language', 'audio'] as const;

export type SettingsTabKey = (typeof SETTINGS_TABS)[number];

/** Tabs that only exist in DEV (the Controls tab holds just the gamepad tester). */
const DEV_ONLY_TABS: readonly SettingsTabKey[] = ['controls'];

const FALLBACK_TAB: SettingsTabKey = 'display';

/** The tabs to show: everything, or everything except the dev-only ones outside DEV. */
export function getVisibleTabs(isDev: boolean): readonly SettingsTabKey[] {
    return isDev ? SETTINGS_TABS : SETTINGS_TABS.filter((key) => !DEV_ONLY_TABS.includes(key));
}

/** The requested tab if it's visible, otherwise Display. */
export function resolveActiveTab(
    requested: SettingsTabKey | undefined,
    visibleTabs: readonly SettingsTabKey[],
): SettingsTabKey {
    return requested !== undefined && visibleTabs.includes(requested) ? requested : FALLBACK_TAB;
}
