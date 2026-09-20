import { Scale, Scene, Scenes } from 'phaser';
import { emitUiSound } from '../audio/emitUiSound';
import { toDevicePixels } from '../config/pixelRatio';
import { isFullscreenShortcut } from '../input/fullscreenShortcut';
import { FullscreenButton } from '../ui/FullscreenButton';
import { computeFullscreenButtonLayout } from '../ui/fullscreenButtonLayout';
import { motionMs, tweenIn } from '../ui/motion';
import { restartSceneOnResize } from '../ui/restartSceneOnResize';

/** Smallest the button gets, in CSS px — comfortable for a finger. */
const MIN_SIZE_CSS = 38;

interface FullscreenOverlaySceneData {
    /** Fade the button in (default). A rebuild after a resize passes `false`. */
    animate?: boolean;
}

/**
 * A persistent, display-only scene (launched by Boot, never stopped, and
 * registered last so it draws above every other scene) that owns the
 * fullscreen button in the top-right corner. It's a scene of its own so the
 * one button shows on every screen — menu, settings, game — instead of being
 * rebuilt in each.
 *
 * Uses Phaser's native `scale.toggleFullscreen()`; the icon follows Phaser's
 * `ENTER_FULLSCREEN` / `LEAVE_FULLSCREEN` events, so leaving with Esc updates
 * it too. The `F` key does the same as the button, on every screen (this scene
 * is always running); Phaser handles key presses inside the browser's own key
 * event, so it counts as the user gesture browsers require for fullscreen. Where the browser has no Fullscreen API (an iPhone) no button is
 * created. The canvas follows the window on its own (see game/main.ts), so
 * entering and leaving fullscreen just resizes it like any window resize.
 */
export class FullscreenOverlay extends Scene {
    constructor() {
        super('FullscreenOverlay');
    }

    create(data: FullscreenOverlaySceneData): void {
        const { scale } = this;
        if (!scale.fullscreen.available) {
            return;
        }

        const { width, height } = scale;
        const layout = computeFullscreenButtonLayout(width, height, toDevicePixels(MIN_SIZE_CSS));

        const button = new FullscreenButton(this, layout.x, layout.y, {
            size: layout.size,
            fullscreen: scale.isFullscreen,
            onToggle: () => scale.toggleFullscreen(),
        });
        this.add.existing(button);

        if (data.animate ?? true) {
            tweenIn(this, [button], { dy: -toDevicePixels(12), delay: motionMs(900) });
        }

        const onChange = (): void => button.setFullscreen(scale.isFullscreen);
        scale.on(Scale.Events.ENTER_FULLSCREEN, onChange);
        scale.on(Scale.Events.LEAVE_FULLSCREEN, onChange);

        // `F` toggles it too (the button plays its own click sound).
        const keyboard = this.input.keyboard;
        const onKeyDown = (event: KeyboardEvent): void => {
            if (isFullscreenShortcut(event)) {
                emitUiSound('select');
                scale.toggleFullscreen();
            }
        };
        keyboard?.on('keydown', onKeyDown);

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            scale.off(Scale.Events.ENTER_FULLSCREEN, onChange);
            scale.off(Scale.Events.LEAVE_FULLSCREEN, onChange);
            keyboard?.off('keydown', onKeyDown);
        });

        restartSceneOnResize(this, () => ({ animate: false }));
    }
}
