# Phaser Game

A Phaser 4 + TypeScript game, built with Vite. See `CLAUDE.md` for the
architectural rules this project follows.

## Requirements

[Node.js](https://nodejs.org) and `npm`.

## Commands

| Command             | Description                                    |
|----------------------|-------------------------------------------------|
| `npm install`        | Install dependencies                            |
| `npm run dev`        | Start the dev server (http://localhost:8080)    |
| `npm run build`      | Type-check and build a production bundle to `dist` |
| `npm run preview`    | Preview the production build locally            |
| `npm run typecheck`  | Type-check without emitting                     |
| `npm test`           | Run the Vitest test suite once                  |
| `npm run test:watch` | Run Vitest in watch mode                        |

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

## Assets

Static files (audio, spritesheets, etc.) go in `public/assets` and are
loaded via `this.load.image('key', 'assets/file.png')`. Imported/bundled
assets can instead be `import`-ed directly into a scene module.
