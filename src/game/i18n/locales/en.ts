/** Recursively widens string literals so other locales can satisfy the same shape with different text. */
type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

/**
 * Source-of-truth translation shape. Every other locale is typed as
 * `Translation`, so a missing or extra key is a compile error, not a
 * blank label at runtime.
 */
export const en = {
    common: {
        back: '< Back',
    },
    mainMenu: {
        title: 'Main Menu',
        play: 'Play',
        settings: 'Settings',
    },
    settings: {
        title: 'Settings',
        tabs: {
            display: 'Display',
            controls: 'Controls',
            language: 'Language',
            audio: 'Audio',
        },
        display: {
            glowQuality: 'Glow quality',
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
        comingSoon: 'Coming soon...',
    },
    game: {
        placeholder: 'Game',
    },
    gameOver: {
        title: 'Game Over',
    },
} as const;

export type Translation = DeepString<typeof en>;
