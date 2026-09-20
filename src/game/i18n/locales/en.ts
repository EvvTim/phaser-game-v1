/** Recursively widens string literals so other locales can satisfy the same shape with different text. */
type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

/**
 * Source-of-truth translation shape. Every other locale is typed as
 * `Translation`, so a missing or extra key is a compile error, not a
 * blank label at runtime.
 */
export const en = {
    common: {
        back: 'Back',
        open: 'Open',
    },
    hints: {
        confirm: 'Select',
        back: 'Back',
    },
    mainMenu: {
        play: 'Play',
        settings: 'Settings',
    },
    settings: {
        title: 'Settings',
        sections: {
            display: 'Display',
            language: 'Language',
            audio: 'Audio',
            controls: 'Controls',
        },
        display: {
            renderQuality: 'Render quality',
            quality: {
                auto: 'Auto',
                high: 'High',
                medium: 'Medium',
                low: 'Low',
            },
        },
        language: {
            heading: 'Language',
        },
        controls: {
            tester: 'Gamepad test',
            noGamepad: 'Connect a controller and press any button',
            rawButtons: 'Raw buttons and axes',
            rawLayout: 'Raw buttons and axes (layout not recognized)',
        },
        audio: {
            musicTrack: 'Music track',
            masterVolume: 'Master volume',
            musicVolume: 'Music volume',
            sfxVolume: 'Effects volume',
            track: 'Track {{number}}',
        },
    },
    game: {
        placeholder: 'Game',
    },
    gameOver: {
        title: 'Game Over',
    },
} as const;

export type Translation = DeepString<typeof en>;
