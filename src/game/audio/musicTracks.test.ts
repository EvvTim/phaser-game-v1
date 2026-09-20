import { describe, expect, it } from 'vitest';
import {
    DEFAULT_MUSIC_TRACK,
    decideMusicAction,
    getMusicKey,
    getMusicUrl,
    MUSIC_TRACK_IDS,
    type MusicSituation,
} from './musicTracks';

const base: MusicSituation = {
    wanted: true,
    desired: 'theme2',
    playingId: null,
    desiredLoaded: false,
    loadingId: null,
};

describe('music track registry', () => {
    it('has a default that is a known track', () => {
        expect(MUSIC_TRACK_IDS).toContain(DEFAULT_MUSIC_TRACK);
    });

    it('gives every track a distinct cache key and file', () => {
        const keys = MUSIC_TRACK_IDS.map(getMusicKey);
        const urls = MUSIC_TRACK_IDS.map(getMusicUrl);

        expect(new Set(keys).size).toBe(MUSIC_TRACK_IDS.length);
        expect(new Set(urls).size).toBe(MUSIC_TRACK_IDS.length);
    });

    it('resolves tracks under assets/music', () => {
        for (const id of MUSIC_TRACK_IDS) {
            expect(getMusicUrl(id)).toMatch(/^assets\/music\/.+\.m4a$/);
        }
    });
});

describe('decideMusicAction', () => {
    it('does nothing when music is not wanted and none is playing', () => {
        expect(decideMusicAction({ ...base, wanted: false })).toBe('none');
    });

    it('stops the music when it is no longer wanted', () => {
        expect(decideMusicAction({ ...base, wanted: false, playingId: 'theme2' })).toBe('stop');
    });

    it('leaves the chosen track alone while it is already playing', () => {
        expect(decideMusicAction({ ...base, playingId: 'theme2', desiredLoaded: true })).toBe('none');
    });

    it('plays the chosen track once it is decoded', () => {
        expect(decideMusicAction({ ...base, desiredLoaded: true })).toBe('play');
    });

    it('switches when a different track is playing', () => {
        expect(decideMusicAction({ ...base, playingId: 'theme1', desiredLoaded: true })).toBe('play');
    });

    it('loads the chosen track when it is not decoded yet', () => {
        expect(decideMusicAction(base)).toBe('load');
        expect(decideMusicAction({ ...base, playingId: 'theme1' })).toBe('load');
    });

    it('waits for a load that is already in flight instead of starting another', () => {
        expect(decideMusicAction({ ...base, loadingId: 'theme2' })).toBe('none');
    });

    it('loads the newly chosen track even if another one is still loading', () => {
        expect(decideMusicAction({ ...base, loadingId: 'theme1' })).toBe('load');
    });
});
