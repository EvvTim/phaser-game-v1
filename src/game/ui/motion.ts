import type { GameObjects, Scene } from 'phaser';

/**
 * How fast all UI motion plays: 1 is the original design timings, 2 is twice
 * as fast. This is the one knob for "make the animations quicker / calmer" —
 * every duration, delay and stagger in the UI goes through `motionMs()`.
 */
export const MOTION_SPEED = 1.8;

/** A design duration (ms) as it plays at the current `MOTION_SPEED`. */
export function motionMs(designMs: number): number {
    return Math.round(designMs / MOTION_SPEED);
}

/**
 * The game's motion language: one set of timings and curves, so every screen
 * enters, leaves and switches the same way. Everything runs on Phaser's native
 * Tween Manager and camera fades. When the player has asked their system for
 * reduced motion (`prefers-reduced-motion`), nothing animates: elements just
 * appear at their final place.
 */
export const MOTION = Object.freeze({
    /** Things arriving on a screen. */
    enterMs: motionMs(480),
    /** Things leaving it (shorter — leaving should never make the player wait). */
    exitMs: motionMs(240),
    /** A settings section leaving / arriving on a tab switch. */
    sectionOutMs: motionMs(150),
    sectionInMs: motionMs(320),
    /** A small state change of a control (a chip's plate, a selector's value). */
    microMs: motionMs(200),
    /** Delay between consecutive elements of a group. */
    staggerMs: motionMs(70),
    /** The stagger stops growing after this many steps, so a long list still finishes quickly. */
    maxStaggerSteps: 7,
    /** Camera fade in / out. */
    fadeInMs: motionMs(520),
    fadeOutMs: motionMs(280),
    easeIn: 'Cubic.easeOut',
    easeOut: 'Cubic.easeIn',
} as const);

/** What a tween needs from its target: any GameObject with a position and an opacity. */
export type Tweenable = Pick<GameObjects.Container, 'x' | 'y' | 'alpha'>;

export interface TweenInOptions {
    /** Offset (device px) the element starts from, relative to where it ends up. */
    dx?: number;
    dy?: number;
    duration?: number;
    delay?: number;
    /** Per-element delay step; 0 animates the whole group together. */
    stagger?: number;
    ease?: string;
}

/** The start delay of the `index`-th element of a staggered group (capped, see `MOTION.maxStaggerSteps`). */
export function staggerDelay(index: number, step: number = MOTION.staggerMs, maxSteps: number = MOTION.maxStaggerSteps): number {
    return Math.min(Math.max(0, index), maxSteps) * step;
}

/** Whether the system asks for less motion (also false where `matchMedia` doesn't exist). */
export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
}

/**
 * Brings elements onto the screen: each starts offset by (`dx`, `dy`) and
 * transparent, and tweens to where (and how opaque) it is now — so lay
 * everything out first, then call this. Elements are staggered in the order
 * given.
 */
export function tweenIn(scene: Scene, targets: readonly Tweenable[], options: TweenInOptions = {}): void {
    if (prefersReducedMotion()) {
        return;
    }

    const {
        dx = 0,
        dy = 0,
        duration = MOTION.enterMs,
        delay = 0,
        stagger = MOTION.staggerMs,
        ease = MOTION.easeIn,
    } = options;

    targets.forEach((target, index) => {
        const toX = target.x;
        const toY = target.y;
        const toAlpha = target.alpha;

        target.x = toX + dx;
        target.y = toY + dy;
        target.alpha = 0;

        scene.tweens.add({
            targets: target,
            x: toX,
            y: toY,
            alpha: toAlpha,
            duration,
            delay: delay + staggerDelay(index, stagger),
            ease,
        });
    });
}

/**
 * Takes elements off the screen: each drifts by (`dx`, `dy`) while fading out.
 * `onComplete` runs once the last one is gone — at once when motion is reduced
 * or there is nothing to animate, so callers can always chain a scene change
 * on it.
 */
export function tweenOut(
    scene: Scene,
    targets: readonly Tweenable[],
    options: TweenInOptions = {},
    onComplete?: () => void,
): void {
    if (prefersReducedMotion() || targets.length === 0) {
        onComplete?.();
        return;
    }

    const {
        dx = 0,
        dy = 0,
        duration = MOTION.exitMs,
        delay = 0,
        stagger = 0,
        ease = MOTION.easeOut,
    } = options;

    targets.forEach((target, index) => {
        const isLast = index === targets.length - 1;

        scene.tweens.add({
            targets: target,
            x: target.x + dx,
            y: target.y + dy,
            alpha: 0,
            duration,
            delay: delay + staggerDelay(index, stagger),
            ease,
            onComplete: isLast ? onComplete : undefined,
        });
    });
}

/**
 * Makes a container (and everything in it) stop reacting to the pointer, so
 * something that is only fading out can't be clicked. Walks nested containers.
 */
export function disableInputDeep(object: GameObjects.GameObject): void {
    if (object.input) {
        object.disableInteractive();
    }

    const children = (object as GameObjects.Container).list;
    if (Array.isArray(children)) {
        children.forEach(disableInputDeep);
    }
}

/** Phaser's `Cameras.Scene2D.Events.FADE_OUT_COMPLETE` (a literal, so this module stays free of runtime Phaser imports and unit-testable). */
const FADE_OUT_COMPLETE = 'camerafadeoutcomplete';

/** Fades the scene's camera in from black (a scene that arrives after a fade-out). */
export function fadeCameraIn(scene: Scene, duration: number = MOTION.fadeInMs): void {
    if (!prefersReducedMotion()) {
        scene.cameras.main.fadeIn(duration, 0, 0, 0);
    }
}

/** Fades the scene's camera to black, then runs `then` (at once when motion is reduced). */
export function fadeCameraOutThen(scene: Scene, then: () => void, duration: number = MOTION.fadeOutMs): void {
    if (prefersReducedMotion()) {
        then();
        return;
    }

    scene.cameras.main.once(FADE_OUT_COMPLETE, then);
    scene.cameras.main.fadeOut(duration, 0, 0, 0);
}
