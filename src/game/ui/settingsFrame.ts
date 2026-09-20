import type { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { motionMs, tweenIn } from './motion';
import { addSettingsBackdrop } from './settingsBackdrop';
import { drawSettingsDecor, playDecorIn, type SettingsDecor } from './settingsDecor';
import type { SettingsLayout } from './settingsLayout';
import { SETTINGS_COLORS } from './settingsTheme';
import { gameTextStyle } from './textStyle';

export interface SettingsFrame {
    title: GameObjects.Text;
    decor: SettingsDecor;
}

/**
 * What every settings-style screen shares: the blurred artwork, the
 * ornaments and the title. With `animate` the backdrop defocuses, the
 * ornaments grow in and the title drops into place (see motion.ts).
 */
export function createSettingsFrame(scene: Scene, layout: SettingsLayout, label: string, animate: boolean): SettingsFrame {
    addSettingsBackdrop(scene, animate);

    const decor = drawSettingsDecor(scene, layout);

    const title = scene.add
        .text(
            layout.title.x,
            layout.title.y,
            label,
            gameTextStyle({
                fontSize: layout.metrics.titleFontSize,
                color: SETTINGS_COLORS.creamCss,
                letterSpacing: 4 * layout.unit,
            }),
        )
        .setOrigin(0.5);

    if (animate) {
        playDecorIn(scene, decor);
        tweenIn(scene, [title], { dy: -toDevicePixels(28), delay: motionMs(160) });
    }

    return { title, decor };
}
