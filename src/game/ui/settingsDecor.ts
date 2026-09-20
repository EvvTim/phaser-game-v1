import type { GameObjects, Scene } from 'phaser';
import { computeDotPositions, type DottedLine, type HorizontalRule, type SettingsLayout } from './settingsLayout';
import { SETTINGS_COLORS } from './settingsTheme';

/**
 * Draws the settings screens' static ornaments with one Graphics object:
 * the dotted vertical lines running in from the top and bottom edges, and
 * the thin horizontal rules around the title and around the bottom action.
 */
export function drawSettingsDecor(scene: Scene, layout: SettingsLayout): GameObjects.Graphics {
    const graphics = scene.add.graphics();
    graphics.fillStyle(SETTINGS_COLORS.cream, 1);

    const thickness = Math.max(1, 2 * layout.unit);

    const dotted = (line: DottedLine): void => {
        for (const y of computeDotPositions(line.y0, line.y1, layout.dotPitch)) {
            graphics.fillCircle(line.x, y, layout.dotSize / 2);
        }
    };
    const rule = (line: HorizontalRule): void => {
        graphics.fillRect(line.x0, line.y - thickness / 2, line.x1 - line.x0, thickness);
    };

    dotted(layout.dottedTop);
    dotted(layout.dottedBottom);
    rule(layout.titleRules.above);
    rule(layout.titleRules.below);
    rule(layout.action.ruleAbove);
    rule(layout.action.ruleBelow);

    return graphics;
}

/**
 * The thin rules flanking a section heading (`—— DISPLAY ——`): one each side
 * of the text, `gap` away from it, `length` long. Drawn in the dim ink so the
 * heading stays quieter than the title and the row labels.
 */
export function drawHeadingRules(
    scene: Scene,
    layout: SettingsLayout,
    y: number,
    textWidth: number,
): GameObjects.Graphics {
    const { headingRuleLength: length, headingRuleGap: gap } = layout.metrics;
    const thickness = Math.max(1, layout.unit);
    const half = textWidth / 2 + gap;

    const graphics = scene.add.graphics();
    graphics.fillStyle(SETTINGS_COLORS.cream, 0.55);
    graphics.fillRect(layout.centerX - half - length, y - thickness / 2, length, thickness);
    graphics.fillRect(layout.centerX + half, y - thickness / 2, length, thickness);

    return graphics;
}
