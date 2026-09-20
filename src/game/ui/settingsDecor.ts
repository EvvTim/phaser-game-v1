import type { GameObjects, Scene } from 'phaser';
import { toDevicePixels } from '../config/pixelRatio';
import { MOTION, motionMs, prefersReducedMotion } from './motion';
import { computeDotPositions, type DottedLine, type HorizontalRule, type SettingsLayout } from './settingsLayout';
import { SETTINGS_COLORS } from './settingsTheme';

/**
 * The settings screens' static ornaments, one Graphics object each so they can
 * be animated on their own: the dotted vertical lines running in from the top
 * and bottom edges, and the thin horizontal rules around the title and around
 * the bottom action. Each is drawn around its own pivot — a dotted line at the
 * screen edge it grows from, a rule at its centre — so scaling it from 0 to 1
 * makes it "grow" from there.
 */
export interface SettingsDecor {
    dottedTop: GameObjects.Graphics;
    dottedBottom: GameObjects.Graphics;
    /** The four rules, in the order they should appear: above the title, under it, above the action, under it. */
    rules: GameObjects.Graphics[];
}

export function drawSettingsDecor(scene: Scene, layout: SettingsLayout): SettingsDecor {
    const thickness = Math.max(1, 2 * layout.unit);

    /** A dotted line, drawn relative to `pivotY` (its top end for the top line, its bottom end for the bottom one). */
    const dotted = (line: DottedLine, pivotY: number): GameObjects.Graphics => {
        const graphics = scene.add.graphics({ x: line.x, y: pivotY });
        graphics.fillStyle(SETTINGS_COLORS.cream, 1);
        for (const y of computeDotPositions(line.y0, line.y1, layout.dotPitch)) {
            graphics.fillCircle(0, y - pivotY, layout.dotSize / 2);
        }
        return graphics;
    };

    /** A horizontal rule, drawn relative to its own centre. */
    const rule = (line: HorizontalRule): GameObjects.Graphics => {
        const centerX = (line.x0 + line.x1) / 2;
        const graphics = scene.add.graphics({ x: centerX, y: line.y });
        graphics.fillStyle(SETTINGS_COLORS.cream, 1);
        graphics.fillRect(line.x0 - centerX, -thickness / 2, line.x1 - line.x0, thickness);
        return graphics;
    };

    return {
        dottedTop: dotted(layout.dottedTop, layout.dottedTop.y0),
        dottedBottom: dotted(layout.dottedBottom, layout.dottedBottom.y1),
        rules: [
            rule(layout.titleRules.above),
            rule(layout.titleRules.below),
            rule(layout.action.ruleAbove),
            rule(layout.action.ruleBelow),
        ],
    };
}

/**
 * Grows the ornaments in: the dotted lines run in from the screen edges, the
 * rules spread out from their centres, the title's before the action's.
 */
export function playDecorIn(scene: Scene, decor: SettingsDecor, delay = 0): void {
    if (prefersReducedMotion()) {
        return;
    }

    for (const line of [decor.dottedTop, decor.dottedBottom]) {
        line.setScale(1, 0);
        scene.tweens.add({ targets: line, scaleY: 1, duration: MOTION.enterMs * 1.5, delay, ease: 'Cubic.easeOut' });
    }

    const rulesDelay = [80, 200, 460, 540].map(motionMs);
    decor.rules.forEach((rule, index) => {
        rule.setScale(0, 1);
        scene.tweens.add({
            targets: rule,
            scaleX: 1,
            duration: MOTION.enterMs,
            delay: delay + rulesDelay[index],
            ease: 'Cubic.easeOut',
        });
    });
}

/** Shrinks the ornaments back toward where they grew from, together, for a screen that is leaving. */
export function playDecorOut(scene: Scene, decor: SettingsDecor): void {
    if (prefersReducedMotion()) {
        return;
    }

    for (const line of [decor.dottedTop, decor.dottedBottom]) {
        scene.tweens.add({ targets: line, scaleY: 0, duration: MOTION.exitMs, ease: 'Cubic.easeIn' });
    }
    for (const rule of decor.rules) {
        scene.tweens.add({ targets: rule, scaleX: 0, duration: MOTION.exitMs, ease: 'Cubic.easeIn' });
    }
}

/**
 * The thin rules flanking a section heading (`—— DISPLAY ——`): one each side
 * of the text, `gap` away from it, `length` long. Drawn in the dim ink so the
 * heading stays quieter than the title and the row labels. Positioned at the
 * heading's centre, so it can be moved and faded with the rest of a section.
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

    const graphics = scene.add.graphics({ x: layout.centerX, y });
    graphics.fillStyle(SETTINGS_COLORS.cream, 0.55);
    graphics.fillRect(-half - length, -thickness / 2, length, thickness);
    graphics.fillRect(half, -thickness / 2, length, thickness);

    return graphics;
}

/** Distance (device px) the settings screens' sections drift while entering or leaving. */
export function settingsSlideDistance(): number {
    return toDevicePixels(46);
}
