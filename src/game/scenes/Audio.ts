import { Loader, Scene, Scenes, type Sound } from 'phaser';
import {
    decideMusicAction,
    getMusicKey,
    MUSIC_FADE_IN_MS,
    MUSIC_FADE_OUT_MS,
    MUSIC_VOLUME,
    queueMusicTrack,
    type MusicTrackId,
} from '../audio/musicTracks';
import { EventBus } from '../events/EventBus';
import { EVENTS } from '../events/GameEvents';
import { SettingsStore } from '../settings/SettingsStore';

type MusicSound = Sound.WebAudioSound | Sound.HTML5AudioSound | Sound.NoAudioSound;

/**
 * A persistent, display-less scene (launched by Boot, never stopped) that
 * owns the menu music. It has to be a scene of its own: Phaser cancels a
 * scene's loads when the scene shuts down, and the music has to keep loading
 * and playing while the player moves between menu scenes.
 *
 * Other scenes never touch it directly — they emit `MUSIC_MENU_START` /
 * `MUSIC_STOP` on the EventBus, and it also reacts to `SETTINGS_CHANGED`
 * (the track picked in Settings -> Audio).
 *
 * Only the chosen track is ever decoded (a decoded track is ~70-90 MB); when
 * the player picks another one it is loaded on demand and the previous
 * track is released.
 */
export class Audio extends Scene {
    /** Menu-flow scenes are up, so music is wanted. */
    private wanted = false;
    private playing: { id: MusicTrackId; sound: MusicSound } | null = null;
    private loadingId: MusicTrackId | null = null;

    constructor() {
        super('Audio');
    }

    create(): void {
        const onStart = (): void => {
            this.wanted = true;
            this.sync();
        };
        const onStop = (): void => {
            this.wanted = false;
            this.sync();
        };
        const onSettingsChanged = (): void => this.sync();

        EventBus.on(EVENTS.MUSIC_MENU_START, onStart);
        EventBus.on(EVENTS.MUSIC_STOP, onStop);
        EventBus.on(EVENTS.SETTINGS_CHANGED, onSettingsChanged);

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            EventBus.off(EVENTS.MUSIC_MENU_START, onStart);
            EventBus.off(EVENTS.MUSIC_STOP, onStop);
            EventBus.off(EVENTS.SETTINGS_CHANGED, onSettingsChanged);
        });
    }

    /** Brings what is playing in line with what is wanted and chosen. */
    private sync(): void {
        const desired = SettingsStore.get().audio.musicTrack;

        const action = decideMusicAction({
            wanted: this.wanted,
            desired,
            playingId: this.playing?.id ?? null,
            desiredLoaded: this.cache.audio.exists(getMusicKey(desired)),
            loadingId: this.loadingId,
        });

        switch (action) {
            case 'stop':
                this.stopPlaying(false);
                break;
            case 'play':
                this.playTrack(desired);
                break;
            case 'load':
                this.loadTrack(desired);
                break;
            case 'none':
                break;
        }
    }

    private loadTrack(id: MusicTrackId): void {
        const key = getMusicKey(id);
        this.loadingId = id;

        const onComplete = (): void => {
            this.stopListening(key, onComplete, onError);
            this.loadingId = null;
            this.sync();
        };
        const onError = (file: Loader.File): void => {
            if (file.key !== key) {
                return;
            }
            this.stopListening(key, onComplete, onError);
            this.loadingId = null;
            console.warn(`Could not load menu music "${id}" (${file.url}).`);
        };

        this.load.once(`${Loader.Events.FILE_KEY_COMPLETE}audio-${key}`, onComplete);
        this.load.on(Loader.Events.FILE_LOAD_ERROR, onError);

        queueMusicTrack(this.load, id);
        if (!this.load.isLoading()) {
            this.load.start();
        }
    }

    private stopListening(key: string, onComplete: () => void, onError: (file: Loader.File) => void): void {
        this.load.off(`${Loader.Events.FILE_KEY_COMPLETE}audio-${key}`, onComplete);
        this.load.off(Loader.Events.FILE_LOAD_ERROR, onError);
    }

    private playTrack(id: MusicTrackId): void {
        const previous = this.playing;
        if (previous) {
            this.stopPlaying(true);
        }

        const sound = this.sound.add(getMusicKey(id), { loop: true, volume: 0 });
        this.playing = { id, sound };
        sound.play();
        this.fadeTo(sound, MUSIC_VOLUME, MUSIC_FADE_IN_MS);
    }

    /**
     * Fades the current track out and releases it. When `releaseBuffer` is
     * set the decoded audio is dropped from the cache too (the player moved
     * on to another track); otherwise it's kept so coming back is instant.
     */
    private stopPlaying(releaseBuffer: boolean): void {
        const current = this.playing;
        if (!current) {
            return;
        }
        this.playing = null;

        const release = (): void => {
            current.sound.destroy();
            if (releaseBuffer) {
                this.cache.audio.remove(getMusicKey(current.id));
            }
        };

        // While the browser still blocks audio nothing is audible yet, so
        // there is nothing to fade (and tweening would only pile up queued
        // volume changes in Phaser's locked-actions queue).
        if (this.sound.locked) {
            release();
            return;
        }
        this.fadeTo(current.sound, 0, MUSIC_FADE_OUT_MS, release);
    }

    private fadeTo(sound: MusicSound, volume: number, duration: number, onComplete?: () => void): void {
        if (this.sound.locked) {
            sound.setVolume(volume);
            onComplete?.();
            return;
        }

        this.tweens.add({ targets: sound, volume, duration, onComplete });
    }
}
