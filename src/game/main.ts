import { Audio } from './scenes/Audio';
import { FullscreenOverlay } from './scenes/FullscreenOverlay';
import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Settings } from './scenes/Settings';
import { AUTO, Core, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { GamepadTest } from './scenes/GamepadTest';
import { IS_DEV } from './config/devMode';
import { createValidatedGameConfig } from './config/gameConfig';
import { getPixelRatio, setRenderQuality, toDevicePixels } from './config/pixelRatio';
import { syncCanvasSize } from './config/canvasSize';
import { SettingsStore } from './settings/SettingsStore';
import { applyDisplaySettings } from './settings/applyDisplaySettings';
import { hasDisplayChanged } from './settings/settingsChange';
import { EventBus } from './events/EventBus';
import { setLanguage } from './i18n/i18n';
import { EVENTS } from './events/GameEvents';
import type { Settings as GameSettings } from './settings/settingsSchema';

const StartGame = (parent: string): Game => {
    const { parent: validatedParent, width, height, backgroundColor } = createValidatedGameConfig(parent);

    setRenderQuality(SettingsStore.get().display.renderQuality);
    setLanguage(SettingsStore.get().language.locale);
    const pixelRatio = getPixelRatio();

    // Scale.RESIZE would fight us here: on every window resize it resets the
    // canvas backing buffer straight back to CSS-pixel size, ignoring zoom.
    // Scale.NONE + a manual `scale.resize()` call (below) is the supported
    // way to keep the canvas rendering at device-pixel resolution — see
    // config/pixelRatio.ts for why that matters.
    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        parent: validatedParent,
        backgroundColor,
        input: {
            gamepad: true,
        },
        scale: {
            mode: Scale.NONE,
            width: toDevicePixels(width),
            height: toDevicePixels(height),
            zoom: 1 / pixelRatio,
            autoCenter: Scale.CENTER_BOTH,
        },
        // GamepadTest is a DEV-only screen, left out of production builds.
        // FullscreenOverlay goes last so its button draws above every other scene.
        scene: [
            Boot,
            Audio,
            Preloader,
            MainMenu,
            MainGame,
            GameOver,
            Settings,
            ...(IS_DEV ? [GamepadTest] : []),
            FullscreenOverlay,
        ],
    };

    const game = new Game(config);

    const onWindowResize = (): void => {
        syncCanvasSize(game);
    };

    // Re-fit the canvas only when the display settings actually changed: doing it for every
    // setting (a volume slider being dragged, say) makes Phaser emit a resize each time.
    let previousDisplay = SettingsStore.get().display;
    const onSettingsChanged = (settings: GameSettings): void => {
        setLanguage(settings.language.locale);

        if (hasDisplayChanged(previousDisplay, settings.display)) {
            applyDisplaySettings(game, settings.display);
        }
        previousDisplay = settings.display;
    };

    window.addEventListener('resize', onWindowResize);
    EventBus.on(EVENTS.SETTINGS_CHANGED, onSettingsChanged);

    game.events.once(Core.Events.DESTROY, () => {
        window.removeEventListener('resize', onWindowResize);
        EventBus.off(EVENTS.SETTINGS_CHANGED, onSettingsChanged);
    });

    return game;
};

export default StartGame;
