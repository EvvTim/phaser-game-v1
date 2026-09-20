# Phaser Game

A Phaser 4 + TypeScript game, built with Vite. See `CLAUDE.md` for the
architectural rules this project follows.

## Requirements

[Bun](https://bun.sh) — the only supported package manager and script
runner. Don't use `npm`/`npx`/`yarn`/`pnpm` (they'd create a competing
lockfile); `bun.lock` is the single source of truth.

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
src/game/i18n/          i18next setup, supported languages, RU/UA/EN/PL translations
src/game/input/         Input helpers built on Phaser's native input plugins (gamepad, etc.)
src/game/settings/      Persisted settings: Zod schema, localStorage-backed SettingsStore
src/game/ui/            Reusable UI primitives (Button, TabBar, Title, SectionHeading) for menu/settings screens
src/game/scenes/        Boot -> Preloader -> MainMenu -> Game -> GameOver, MainMenu -> Settings -> MainMenu
```

Gamepad support uses Phaser's built-in `Input.Gamepad` plugin (enabled via
`input.gamepad: true` in `game/main.ts`) rather than raw `navigator.getGamepads()`.

- `src/game/input/gamepadMapping.ts` — per-controller button/axis indices
  and brand conventions. Any pad the browser recognizes reports the W3C
  "standard" layout (same indices for Xbox, DualShock/DualSense, Switch Pro,
  Steam Deck and most third-party pads), so support for those is a matter of
  telling brands apart: `detectControllerFamily()` reads the USB vendor id
  out of the pad's `id` (Chrome, Firefox and Safari format it differently)
  or falls back to its name, and picks one of `STANDARD_MAPPINGS`
  (`xbox` / `playstation` / `nintendo` / `steam` / `generic`). The family
  decides the confirm/back convention (Nintendo's right-face-button "A"
  confirms; everyone else's bottom button does), the printed button names,
  and which prompt icons are shown. An unrecognized pad is `generic`
  (Xbox-style). Very new hardware the browser doesn't have in its database
  yet reports `mapping: ''`, and its real indices (buttons *and* which axis
  the D-pad lands on, if it's not even button-based) have to be found
  empirically — there's one hardcoded, measured entry for the Nintendo
  Switch 2 Pro Controller (D-pad is a single hat-style axis, not 4 buttons);
  add another as new non-standard controllers turn up.
- `src/game/input/GamepadNavigator.ts` — one per scene; give it the
  navigable `Button[]` via `setItems()` (rebuild it whenever that set
  changes, e.g. Settings on tab switch; the first item gets focus). The D-pad
  moves focus to the nearest button in that direction on screen
  (`input/spatialNavigation.ts` — no wrap-around; sideways moves stay in
  their row, up/down can always reach the next row), confirm activates,
  back fires `onBack`. Focus is shown via `Button.setFocused()` (a cyan Glow
  filter, independent of the `selected` tint so both can show at once).
  Shoulder buttons (`onShoulderLeft`/`onShoulderRight`) fire independently of
  focus — Settings uses them to switch tabs, and deliberately does NOT
  register the tab buttons with the navigator, so tabs change only via L/R
  (or a click), and focus then lands on the section's first interactive
  element. `onGamepadStatusChange` reports the first
  connected pad's mapping (or `null`) — Settings uses it to show/hide the
  `ui/GamepadHint.ts` prompts (L/R beside the tab bar, confirm/back in the
  footer) only while a gamepad is actually connected, with icons chosen for
  that mapping's `family` via `ui/gamepadPrompts.ts` (PlayStation shows
  Cross/Circle, Nintendo shows L/R, the rest L1/R1 and A/B).
  Remember to remove any `pad.on('down', ...)` / plugin listener you add
  elsewhere on scene shutdown — the physical device's Gamepad wrapper
  outlives any one scene, so an un-removed listener leaks and keeps firing
  (with stale state) alongside whatever replaces it.
- `src/game/input/gamepadLogger.ts` is a console-log diagnostic for
  discovering a new controller's mapping empirically (as above) — kept
  around for the next unrecognized device, not removed now that the Switch
  2 Pro Controller itself works.

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

## Localization

UI text uses [i18next](https://www.i18next.com) with four languages: Russian
(`ru`), Ukrainian (`uk`, shown as "UA"), English (`en`), Polish (`pl`).

- Never hardcode visible text — use `t('mainMenu.play')` from
  `src/game/i18n/i18n.ts`. Keys are type-checked against `locales/en.ts`.
- To add a string: add the key to `locales/en.ts` first, then `ru.ts`,
  `uk.ts`, `pl.ts` (each is typed as `Translation`, so a missing key fails
  `bun run typecheck`).
- The default language is the system/browser language when supported
  (`detectSystemLanguage()`), otherwise English; picking one in Settings ->
  Language is saved and wins from then on. Language names on the picker
  buttons are shown in their own language and aren't translated.
- Text is read at scene creation, so a language change restarts the Settings
  scene (see `SETTINGS_CHANGED`); `game/main.ts` applies the language before
  any scene reacts.

## Settings screen

Reachable from MainMenu -> Settings. Tabs: Display, Controls, Language,
Audio — Display, Controls and Language are implemented; Audio renders a
"Coming soon" stub until built out. **Controls is DEV-only**: it's shown
only under `bun run dev` (`IS_DEV` in `game/config/devMode.ts`, i.e.
`import.meta.env.DEV`), and production builds omit the tab and drop the tester
code from the bundle. Which tabs exist is decided by `getVisibleTabs()` in
`settings/settingsTabs.ts`; `resolveActiveTab()` keeps a scene restart from
landing on a hidden tab. Anything else that must be DEV-only should read
`IS_DEV` too.

The **Controls** tab is a live gamepad tester (`src/game/ui/GamepadTester.ts`)
for checking that every button of a connected controller works — browsers
only expose a pad after its first button press, so it asks for one. A pad the
browser maps as `standard` gets a controller-shaped diagram of that brand's
prompt icons (`ui/gamepadLayout.ts` holds the positions): pressed buttons
turn yellow and inverted, the D-pad shows its direction, sticks show
deflection and click. Any other pad gets a raw grid of every button index
plus live axis values — the tool for working out an unknown device's layout
(names are shown only for mappings measured on real hardware, i.e.
`GamepadMapping.measured`; otherwise plain `#index`, since guessed names
would mislead). The platform Guide/Home button has no artwork (the pack's
license excludes Guide buttons), so it's a text chip.

- `src/game/settings/settingsSchema.ts` — Zod schema for the persisted shape.
  Extend this (with a default for every new field, so old saved data still
  parses) as each tab gets real settings.
- `src/game/settings/settingsStorage.ts` — the pure load/save functions
  (validated through the schema; corrupt or unavailable storage falls back to
  defaults) — kept free of Phaser so they're unit-tested.
- `src/game/settings/SettingsStore.ts` — holds the current settings, persists
  every change to `localStorage` (they survive a reload), and emits
  `EVENTS.SETTINGS_CHANGED` on the shared `EventBus` on every change, rather
  than any screen reaching into another. Saved settings are per browser
  origin — a different dev-server port is a different origin.
- The Display tab has two rows. "Render quality" (Auto/High/Medium/Low) scales
  `getPixelRatio()` in `game/config/pixelRatio.ts` — see `QUALITY_SCALE` —
  trading HiDPI sharpness for fill-rate. Changing it live re-applies the
  canvas resize/zoom (`settings/applyDisplaySettings.ts`) and restarts the
  Settings scene so its own UI re-renders at the new ratio.
- "Glow quality" (High/Medium/Low, default Low) sets how expensive the Glow
  filters on buttons are (`game/config/glowQuality.ts`): Phaser's Glow shader
  samples `distance × quality` times per pixel and those are fixed when the
  filter is created, so a change applies to buttons created afterwards (the
  Settings scene restarts, so it takes effect immediately there).
- The Language tab lists the four languages; see Localization above.
- `src/game/ui/Button.ts` and `TabBar.ts` are plain `GameObjects.Container`
  components that don't self-register — call `scene.add.existing(...)` (or
  `container.add(...)` to nest one) after constructing them.
- `Button` sizes itself like a CSS box: pass explicit `width`/`height`, or
  omit either to size it from the label + `padding` instead (a number, an
  `{ x, y }` pair, or individual sides — see `ui/padding.ts`). Asymmetric
  padding shifts the label off-center within a fixed size, same as CSS.
  `TabBar` uses this to size each tab to its own label instead of a single
  fixed width that would overflow for longer ones.
- `Button` supports two independent glows: `setFocused()` (cyan, gamepad
  focus) and the `selectedGlow` option (yellow, while `selected` — `TabBar`
  turns it on so the active tab stands out).
- `src/game/ui/SectionHeading.ts` is the title over a group of options
  (e.g. "Render quality"): white text on a semi-transparent dark rounded
  background, auto-sized to its label. Decorative only.
- `src/game/ui/Title.ts` is a screen header: a `banner_hex` background with
  a centered label, same CSS-box sizing/padding as `Button` (they share the
  sizing math via `ui/boxLayout.ts`) but not interactive. It's meant to sit
  above a screen's content panel with its own background — see how
  `MainMenu` and `Settings` position it before the panel, not inside it.

## Assets

Button-prompt icons come from [Gamepad Prompt Asset Pack](https://github.com/AL2009man/Gamepad-Prompt-Asset-Pack)
by AL2009man (MIT; license in `public/assets/gamepad/`) — see
`art-source/gamepad/README.md` for how the atlas is built and how to add an
icon. Only use this pack, not the author's separate "Gamepad Asset Pack"
(controller overlays), which isn't cleared for commercial games.

Static files (audio, spritesheets, etc.) go in `public/assets` and are
loaded via `this.load.image('key', 'assets/file.png')`. Imported/bundled
assets can instead be `import`-ed directly into a scene module.

### UI kit atlas

`public/assets/ui/menu-atlas.{png,json}` is a texture atlas (one shared
texture, per CLAUDE.md's asset-reuse rule) of a wood/green cartoon UI kit —
panels, buttons, bars, icon buttons. Loaded once in `Preloader`, referenced
everywhere via `UI_ATLAS_KEY` / `UI_FRAMES` in `src/game/ui/uiAtlas.ts`
rather than string literals.

- `Button` and the Settings/MainMenu panel backgrounds use Phaser's native
  `GameObjects.NineSlice` (`this.add.nineslice`) so the wood border stays
  crisp while the middle stretches to fit — the slice metrics
  (`ui/Button.ts`'s `SLICE`, `ui/panelSlice.ts`) are tuned for how large
  each element actually renders in-game, not the raw source art
  proportions; a NineSlice border is an absolute pixel size, so it doesn't
  auto-scale down for a small button.
- The atlas is generated from a raw, unsliced sprite sheet — see
  `art-source/ui/README.md` for the extraction pipeline (only the source
  art and scripts live there; it's never shipped, unlike the atlas).
