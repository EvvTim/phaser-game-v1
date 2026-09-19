# Phaser Game

A Phaser 4 + TypeScript game, built with Vite. See `CLAUDE.md` for the
architectural rules this project follows.

## Requirements

[Bun](https://bun.sh) (used as the package manager and script runner).

## Commands

| Command             | Description                                    |
|----------------------|-------------------------------------------------|
| `bun install`        | Install dependencies                            |
| `bun run dev`        | Start the dev server (http://localhost:8080)    |
| `bun run build`      | Type-check and build a production bundle to `dist` |
| `bun run preview`    | Preview the production build locally            |
| `bun run typecheck`  | Type-check without emitting                     |
| `bun run test`       | Run the Vitest test suite once                  |
| `bun run test:watch` | Run Vitest in watch mode                        |

## Project structure

```
index.html              Host page for the game
public/                 Static assets served as-is (public/assets/*)
src/main.ts             Application bootstrap
src/game/main.ts         Builds the validated game config and starts Phaser.Game
src/game/config/        Game config + its Zod schema (validated at startup)
src/game/events/        Shared EventBus and the EVENTS name registry
src/game/factories/     Object-pool factories (Phaser.GameObjects.Group wrappers)
src/game/scenes/        Boot -> Preloader -> MainMenu -> Game -> GameOver
```

As gameplay is added, prefer these additional folders, kept next to the
code they support:

- `src/game/components/` — composable behaviors (Health, Movement, Lifetime, Input, ...)
  attached to entities instead of deep class hierarchies.
- `src/game/schemas/` — Zod schemas for level data / external payloads.
- Co-locate `*.test.ts` files next to the module they test; only unit-test
  business logic (schemas, state, scoring, pooling) — never Phaser's own
  engine behavior.

## Full-window, HiDPI-aware canvas

The game fills the whole browser window and re-fits it on resize (see
`game/main.ts`), and it renders at (a capped) `devicePixelRatio` so text and
shapes stay crisp on Retina/HiDPI screens — Phaser 4 doesn't do this on its
own (`Scale.RESIZE` always resets the canvas back to CSS-pixel resolution),
so it's done manually with `Scale.NONE` + `scale.resize()` + `zoom`.

One consequence: game-world units are device pixels, not CSS pixels. Any
size meant to look visually consistent across screens — font sizes, stroke
widths, UI element dimensions — must go through
`toDevicePixels()` from `game/config/pixelRatio.ts` instead of a raw number:

```ts
fontSize: toDevicePixels(38) // not fontSize: 38
```

Positions derived from `this.scale.width` / `this.scale.height` need no
conversion — they're already in that same device-pixel space.

## Assets

Static files (audio, spritesheets, etc.) go in `public/assets` and are
loaded via `this.load.image('key', 'assets/file.png')`. Imported/bundled
assets can instead be `import`-ed directly into a scene module.
