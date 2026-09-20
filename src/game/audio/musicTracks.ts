import type { Loader } from 'phaser';

/**
 * The selectable menu music tracks. The ids are what gets persisted in the
 * settings (and validated by Zod), so keep them stable — reorder or rename
 * the files freely, but never reuse an id for a different track.
 */
export const MUSIC_TRACK_IDS = ['theme1', 'theme2', 'theme3', 'theme4'] as const;
export type MusicTrackId = (typeof MUSIC_TRACK_IDS)[number];

export const DEFAULT_MUSIC_TRACK: MusicTrackId = 'theme1';

/** Files in public/assets/music (Opus in an MP4 container, ~3-4 minutes each). */
const TRACK_FILES: Readonly<Record<MusicTrackId, string>> = {
    theme1: 'main-theme.m4a',
    theme2: 'main-theme2.m4a',
    theme3: 'main-theme3.m4a',
    theme4: 'main-theme4.m4a',
};

/** Menu music level (0-1). */
export const MUSIC_VOLUME = 0.5;

/** Fade durations (ms) when the music starts, stops or changes track. */
export const MUSIC_FADE_IN_MS = 700;
export const MUSIC_FADE_OUT_MS = 400;

/** Key of a track in Phaser's audio cache. */
export function getMusicKey(id: MusicTrackId): string {
    return `music-${id}`;
}

/** URL of a track, relative to the page (the game is served with `base: './'`). */
export function getMusicUrl(id: MusicTrackId): string {
    return `assets/music/${TRACK_FILES[id]}`;
}

/**
 * Queues a track on a scene's loader. Independent of the loader's current
 * path (the Preloader sets one), so it works from any scene.
 *
 * A decoded track is ~70-90 MB of PCM, so tracks are loaded one at a time —
 * only the selected one — rather than all up front.
 */
export function queueMusicTrack(loader: Loader.LoaderPlugin, id: MusicTrackId): void {
    const previousPath = loader.path;

    loader.setPath('');
    loader.audio(getMusicKey(id), getMusicUrl(id));
    loader.setPath(previousPath);
}

export interface MusicSituation {
    /** A scene wants menu music right now (the menu/settings scenes are up). */
    wanted: boolean;
    /** The track chosen in settings. */
    desired: MusicTrackId;
    /** The track currently playing (or fading in), if any. */
    playingId: MusicTrackId | null;
    /** The desired track is already decoded in the audio cache. */
    desiredLoaded: boolean;
    /** A track whose load is in flight, if any. */
    loadingId: MusicTrackId | null;
}

export type MusicAction = 'none' | 'stop' | 'play' | 'load';

/** What the Audio scene should do next, given the current situation. */
export function decideMusicAction(situation: MusicSituation): MusicAction {
    const { wanted, desired, playingId, desiredLoaded, loadingId } = situation;

    if (!wanted) {
        return playingId === null ? 'none' : 'stop';
    }
    if (playingId === desired) {
        return 'none';
    }
    if (desiredLoaded) {
        return 'play';
    }
    return loadingId === desired ? 'none' : 'load';
}
