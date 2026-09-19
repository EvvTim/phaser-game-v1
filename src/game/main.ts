import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Settings } from './scenes/Settings';
import { AUTO, Core, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { createValidatedGameConfig } from './config/gameConfig';
import { setGlowQuality } from './config/glowQuality';
import { getPixelRatio, setRenderQuality, toDevicePixels } from './config/pixelRatio';
import { syncCanvasSize } from './config/canvasSize';
import { SettingsStore } from './settings/SettingsStore';
import { applyDisplaySettings } from './settings/applyDisplaySettings';
import { EventBus } from './events/EventBus';
import { setLanguage } from './i18n/i18n';
import { EVENTS } from './events/GameEvents';
import type { Settings as GameSettings } from './settings/settingsSchema';

const StartGame = (parent: string): Game => {
    const { parent: validatedParent, width, height, backgroundColor } = createValidatedGameConfig(parent);

    setRenderQuality(SettingsStore.get().display.renderQuality);
    setGlowQuality(SettingsStore.get().display.glowQuality);
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
        scene: [Boot, Preloader, MainMenu, MainGame, GameOver, Settings],
    };

    const game = new Game(config);

    const onWindowResize = (): void => {
        syncCanvasSize(game);
    };

    const onSettingsChanged = (settings: GameSettings): void => {
        setLanguage(settings.language.locale);
        applyDisplaySettings(game, settings.display);
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
