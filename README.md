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
src/game/audio/         Menu music: track registry + pure play/load decision logic (the player is scenes/Audio.ts)
src/game/config/        Game config + its Zod schema (validated at startup)
src/game/events/        Shared EventBus and the EVENTS name registry
src/game/factories/     Object-pool factories (Phaser.GameObjects.Group wrappers)
src/game/i18n/          i18next setup, supported languages, RU/UA/EN/PL translations
src/game/input/         Input helpers built on Phaser's native input plugins (gamepad, etc.)
src/game/settings/      Persisted settings: Zod schema, localStorage-backed SettingsStore
src/game/ui/            Reusable UI: FullscreenButton, MenuItem (main menu), the settings controls (ChoiceChips, ArrowSelector, LineSlider, TextButton), layouts, font
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
  navigable items (`MenuItem`, `ChoiceChip`, `ArrowSelector`, `LineSlider`,
  `TextButton` — anything implementing `input/NavigableItem.ts`) via
  `setItems()` (rebuild it whenever that set changes, e.g. Settings on a tab
  switch; the first item gets focus). The D-pad moves focus to the nearest
  item in that direction on screen (`input/spatialNavigation.ts` — no
  wrap-around; sideways moves stay in their row, up/down can always reach the
  next row), confirm activates, back fires `onBack`. A focused item can claim
  a direction for itself through the optional `handleDirection()`: a slider
  takes left/right to change its value and an arrow selector to cycle, while
  up/down still move focus. `focusItem()` moves focus to an item directly
  (mouse hover), so the pointer and the pad share one highlight. In the
  settings the focused control gets a plain thin cream frame
  (`ui/FocusFrame.ts`, no effects); the main menu's highlighted plate is its
  own design.
  Shoulder buttons (`onShoulderLeft`/`onShoulderRight`) fire independently of
  focus — Settings uses them to switch tabs, and deliberately does NOT
  register the tab chips with the navigator, so tabs change only via L/R (or a
  click), and focus then lands on the section's first control.
  `onGamepadStatusChange` reports the first connected pad's mapping (or
  `null`) — Settings uses it to show/hide the `ui/GamepadHint.ts` prompts (L/R
  beside the tab row, confirm/back in the corner) only while a gamepad is
  actually connected, with icons chosen for that mapping's `family` via
  `ui/gamepadPrompts.ts` (PlayStation shows Cross/Circle, Nintendo shows L/R,
  the rest L1/R1 and A/B).
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

## Main menu

A full-screen artwork (`public/assets/ui/main-menu-bg2.png`, key
`MAIN_MENU_BG_KEY`) with a list of options at the bottom-left, laid out after
the mock-up in `examples/main-menu-example.png`. For now there are two options:
Play (-> `Game`) and Settings (-> `Settings`); add an entry in `getEntries()`
in `scenes/MainMenu.ts` and the list grows upward.

- The background is cover-fitted with Phaser's `Geom.Rectangle.FitOutside`,
  centred horizontally but pinned to the top (a 16:9 window crops the
  near-square art vertically, and the robot's head must stay in view), and mirrored horizontally (`setFlipX`) — the source art has the characters
  on the left, where the menu list sits. The image contains no text, so the
  flip is safe; drop it if the artwork is replaced by one composed for the menu.
  The scene restarts on `Scale.Events.RESIZE` so the background and the item
  textures follow the window size.
- **Background effects** (`ui/mainMenuEffects.ts`, main menu only). The artwork
  is a small picture that was scaled up (4224 px wide, but with halos, posterized
  patches and soft detail that show at full size and on HiDPI screens), so instead
  of pretending it is sharp the menu gives it a soft-focus, filmic look and puts
  crisp small things in front of it: a very light blur and a vignette (Phaser 4's
  native `filters.external.addBlur` / `addVignette`), a film-grain overlay (a
  256 px zero-mean noise tile drawn into a canvas texture at startup and tiled by
  a `TileSprite` whose offset jumps ~12x a second) and sparse drifting star dust
  (a native `ParticleEmitter`, additive, capped by `maxAliveParticles`). There are
  no image assets; the tuning constants (`BLUR`, `VIGNETTE`, `GRAIN_*`, the dust)
  are at the top of the file. The filters and the dust cost fill-rate, so they
  follow Settings -> Display -> Render quality (`getMenuEffects()` in
  `ui/mainMenuEffectsConfig.ts`, tested): at Low only the grain stays, at Medium
  the dust is thinner. The camera background is set to black there so the blur
  doesn't show the game's blue as a rim at the window edge. The settings screens
  reuse the same artwork but without these effects (blurred and darkened instead).
- The scenery beside the characters is darkened so they stand out
  (`computeSideShade()` in `ui/mainMenuLayout.ts`): a left-to-centre
  gradient that fades out where the characters begin (`CHARACTERS_LEFT_SHARE`,
  measured in the mirrored image, so it follows the cover-fit crop) plus a
  light shade on the far right edge. It's two native `Graphics.fillGradientStyle`
  rects between the background and the menu — no filter render pass, and the
  menu items stay bright. Tune `SIDE_SHADE` (alpha, right width) there.
- `ui/mainMenuLayout.ts` is the pure layout math (designed on 1920x1080,
  scaled by viewport height; tests next to it). Change the menu position,
  item size or font size there.
- `ui/MenuItem.ts` is one option, styled after the mock-up (sizes and colours
  measured from it): a faint translucent plate with a thin rim and a
  glowing label when idle; when highlighted the plate grows wider and turns
  into a periwinkle bar that brightens to white on the right, and the label
  grows and steps right. The two plate skins (gradient + glow, which Phaser's
  Graphics can't draw) are semi-transparent Canvas 2D textures generated once
  per size by `ui/menuItemTextures.ts`. Labels are upper-cased in code with the
  current language's rules, not in translations, and use the Exo 2 SemiBold
  font (see Assets).
- One item is highlighted at a time: the D-pad moves it, and the mouse
  hovering an item moves it too (`GamepadNavigator#focusItem`). Items are
  anything implementing `input/NavigableItem.ts` (`Button` and `MenuItem` do).
- The "Select" `GamepadHint` (bottom-right) shows only while a gamepad is
  connected; the bottom-left label is the `package.json` version.

## Fullscreen button

A small icon button in the top-right corner of every screen (main menu, settings,
game, game over) — or the `F` key — toggles the browser's fullscreen. It lives in a scene of its own,
`scenes/FullscreenOverlay.ts`: launched by `Boot`, never stopped, and registered
**last** in the scene list so it draws above every other scene — so the one button
appears everywhere instead of being rebuilt in each scene.

- Uses Phaser's native `scale.toggleFullscreen()` — no custom Fullscreen API code. The
  icon (`ui/FullscreenButton.ts`: a translucent plate with a thin cream rim and four
  corner brackets drawn with `Graphics`, no assets; brackets on the outer corners
  = "go fullscreen", pointing inward = "leave") follows Phaser's `ENTER_FULLSCREEN` /
  `LEAVE_FULLSCREEN` events, so leaving with Esc updates it too. The button fires on
  `pointerup`, which browsers accept as a valid gesture on touch screens too.
- **The `F` key does the same** on every screen (the overlay scene is always running).
  `input/fullscreenShortcut.ts` (`isFullscreenShortcut()`, tested) decides what counts:
  the physical key (`event.code === 'KeyF'`, so it works on Russian / Ukrainian layouts
  too), no auto-repeat (holding it would flip the mode back and forth), and no
  Ctrl / Cmd / Alt (those are the browser's and the OS's: Ctrl+F is find-in-page,
  Cmd+Ctrl+F is macOS fullscreen). Phaser handles key presses synchronously inside the
  browser's own key event, so it counts as the user gesture that fullscreen requires.
- Where the browser has no Fullscreen API (an iPhone), `scale.fullscreen.available` is
  false and no button is created.
- The canvas follows the window on its own (`game/main.ts` -> `syncCanvasSize` on the
  window `resize` event), so entering or leaving fullscreen is just a resize; Phaser
  wraps the canvas in a 100% x 100% element while fullscreen.
- Position and size are pure math in `ui/fullscreenButtonLayout.ts`
  (`computeFullscreenButtonLayout()`, tested): 46 px at 1920x1080, scaled with the
  window, never below a fingertip-sized minimum, kept fully inside the window.
- Not persisted: browsers only allow fullscreen from a user gesture (a click or a key press),
  so it can't be restored on load. The corner is otherwise free on every screen, so nothing sits under
  the button; keep it that way when adding UI there.

## Motion

Screens animate in and out with one shared motion language (`ui/motion.ts`), all on
Phaser's native Tween Manager and camera fades — no custom animation code.
`MOTION` holds the timings and curves (arriving takes longer than leaving; the
stagger between the elements of a group is capped). **`MOTION_SPEED` in
`ui/motion.ts` is the one knob for how fast everything plays** (1 = the original
design timings, now 1.8): every duration, delay and stagger in the UI goes through
`motionMs()`, so never write a raw millisecond number in an animation; `tweenIn()` lays elements out
first and brings them in from an offset, transparent, one after another;
`tweenOut()` drifts them away and calls back when the last is gone. With the
system's *reduced motion* preference (`prefers-reduced-motion`) nothing animates:
everything appears where it belongs and callbacks run at once.

- **Main menu.** On arrival the camera fades in (when coming from a faded-out
  scene), the artwork settles from 1.05x to its real size (it ends exactly where
  the settings draw it), the items slide in from the left one after another and the
  version and the gamepad hint fade in last. Leaving slides the items away; into
  gameplay the whole screen fades to black.
- **Main menu -> Settings** is one continuous move: the settings backdrop starts as
  the menu looks (same artwork, same place, sharp, undarkened) and defocuses and
  darkens over ~0.75 s (`ui/settingsBackdrop.ts` tweens the Blur filter's offset and
  the curtain's alpha). Then `ui/settingsFrame.ts` builds the frame: the dotted
  lines run in from the screen edges, the rules spread from their centres
  (`ui/settingsDecor.ts` draws each ornament around its own pivot so scaling it
  from 0 grows it from there), the title drops in, the tabs, the section's
  controls and Back follow one after another.
- **Switching a section.** The old page and the new one exist side by side for a
  moment: the old drifts away and fades (its input is disabled first), the new
  arrives from the opposite side — the direction follows the tabs' order — with its
  controls staggered. Each switch gets a fresh container, so switching quickly
  can't leave anything half-built. The newly selected chip's plate grows in, and an
  arrow selector's value slides in from the side you stepped toward.
- **Leaving Settings** drifts the page away, shrinks the ornaments and fades the
  camera; the menu then plays its own entrance.
- **Scene data.** Scenes take `animate` (default true) and `fade` in `init(data)`.
  A rebuild of the same screen — a language change, a window resize — passes
  `animate: false`, so the page doesn't replay its entrance on every click; a scene
  that arrives after a faded-out one gets `fade: true`.

## Audio

Menu music: four tracks in `public/assets/music/` (Opus in an MP4 container,
~3-4 minutes each), registered in `src/game/audio/musicTracks.ts`
(`MUSIC_TRACK_IDS` — the ids are what settings persist, so never reuse one for
a different track). Settings -> Audio picks which one plays
(`settings.audio.musicTrack`, default `theme1`); the choice takes effect at once.

- `scenes/Audio.ts` is a persistent, display-less scene launched by `Boot` and
  never stopped. It has to be its own scene because Phaser cancels a scene's
  loads when it shuts down, and the music must keep loading/playing across
  menu scenes. Other scenes don't call it: they emit `EVENTS.MUSIC_MENU_START`
  (`MainMenu`, `Settings`, `GamepadTest`) or `EVENTS.MUSIC_STOP` (`Game` — there is no
  gameplay music yet), and it also follows `SETTINGS_CHANGED`. Tracks loop and
  fade in/out with native tweens.
- **Only the chosen track is decoded.** A decoded track is ~70-90 MB of PCM, so
  the Preloader queues just the selected one (`queueMusicTrack`), the Audio scene
  loads another on demand when it's picked, and the previous one is dropped from
  the audio cache. Stopping (entering `Game`) keeps the buffer, so returning to the
  menu resumes instantly.
- **Volumes** (Settings -> Audio, whole percents 0-100, persisted in `audio`):
  master (100), music (50) and effects (70). Music plays at master x music and
  effects at master x effects (`audio/volume.ts`: `getMusicGain`/`getSfxGain`,
  tested); they apply live — the Audio scene re-reads them on `SETTINGS_CHANGED`,
  so the playing track follows the slider as it is dragged.
- **UI sounds** (`audio/uiSounds.ts`): scenes and components call
  `emitUiSound(kind)` (`audio/emitUiSound.ts`), which emits `EVENTS.UI_SOUND`; the
  Audio scene validates the payload with Zod and plays it at the effects volume
  (each kind has a small relative gain; the same sound isn't restarted within
  35 ms; nothing is played while the browser still blocks audio, so no burst of
  queued sounds at the first click). The four sounds are loaded by the
  Preloader. Where they fire:
  `navigate` — `GamepadNavigator` when focus actually moves (D-pad and mouse
  hover) and a Settings tab switch (the tab chips and L / R play it); `select`
  — any `MenuItem`, option chip, arrow-selector step or text button (a `sound`
  option changes or silences it); `confirm` — Play; `back` — the Back button
  and the pad's back button. Releasing the master or effects slider plays a
  `select` preview so the new level can be heard.
- `decideMusicAction()` in `audio/musicTracks.ts` is the pure "stop / play / load /
  nothing" decision, unit-tested; tweak volume and fades there (`MUSIC_VOLUME`,
  `MUSIC_FADE_*`).
- Browsers block audio until the first click/key; Phaser's SoundManager queues the
  play and starts it on that first interaction, so nothing special is needed.
- **Adding a track:** drop the file in `public/assets/music/`, add an id to
  `MUSIC_TRACK_IDS` and its file to `TRACK_FILES`; the Audio tab's arrow selector
  builds its entries ("Track N") from `MUSIC_TRACK_IDS`, so any number works. Opus-in-MP4 plays in current Chrome, Edge and Firefox
  (Safari support is newer); add an `.ogg`/`.mp3` alternative if an older
  browser matters.

## Settings screen

Reachable from MainMenu -> Settings, styled after
`examples/settings-menu-example.png`: over the main menu artwork, blurred and
darkened (`ui/settingsBackdrop.ts`), cream ink, dotted vertical lines running in
from the top and bottom edges, thin rules around the title and around the
bottom action. It has the title, a
row of section **tabs** — Display, Language, Audio and (DEV only) Controls —
and, under it, the active section: its heading (`—— AUDIO ——`) and its
`label  control` rows. Click a tab or use the gamepad's **L / R** shoulders to
switch (tabs are deliberately not D-pad targets). Every setting applies at once
and is saved automatically, so the action at the bottom is just **Back** (the
example's "Save settings" and "Requires restart" have nothing to do here).

| Section | Rows |
|---|---|
| Display | Render quality (Auto / High / Medium / Low) |
| Language | Language (`ru` / `uk` / `en` / `pl`, shown in their own names) |
| Audio | Music track, Master / Music / Effects volume |
| Controls (DEV) | Gamepad test -> Open |

- **Backdrop.** `ui/mainMenuBackground.ts` places the artwork (cover-fitted,
  top-pinned) for both the main menu and the settings, so it has exactly the same
  position and size on both; `ui/settingsBackdrop.ts` only blurs it with Phaser 4's
  native `filters.external.addBlur` (`BLUR`) and covers it with a black layer
  (`DARKNESS`) — tune those two constants there, and never scale or move the image
  in it. The blur is a filter, so it is redrawn each frame: one full-screen blur,
  the only filter in the game. Without WebGL the artwork is just darkened.
- **Layout** is pure math in `ui/settingsLayout.ts` (`computeSettingsLayout()`,
  tested): designed on 1920x1080 and scaled uniformly (also down to fit a
  narrow or short window), sized for the tallest section so the title, tabs and
  Back don't jump when switching. `ui/settingsDecor.ts` draws the dotted lines
  and rules with one `Graphics`; colours are in `ui/settingsTheme.ts` (sampled
  from the example).
- **Controls** are reusable containers configured by objects validated with
  Zod, all `NavigableItem`s and all updating themselves in place:
  `ChoiceChips` (a row of text options, the selected one on a cream plate; also
  the tab row), `ArrowSelector` (`◀ value ▶`, cycles and wraps; click an arrow,
  or D-pad left/right, confirm = next), `LineSlider` (a thin line with a square
  handle and the percent: click or drag — snaps to 5%, the drag keeps working
  outside the line — or D-pad left/right for 10% steps), and `TextButton`.
  Their focus marker is a plain thin frame (`ui/FocusFrame.ts`), also shown on
  mouse hover.
- **Font:** every Text in the game uses Exo 2 SemiBold through `gameTextStyle()`
  (`ui/textStyle.ts`); see Assets. Headings, tabs and labels are upper-cased
  in code with the current language's rules, not in translations.
- **When the scene rebuilds.** `getSettingsChangeEffect()`
  (`settings/settingsChange.ts`, tested) says `restart` for render quality and
  language (they change how the UI is built) and `none` for everything else — the
  control that made the change already shows it, and rebuilding a slider while it
  is dragged would end the drag. Add any new setting that a control updates in
  place to its `none` case. `main.ts` only re-fits the canvas when the display
  settings really changed (`hasDisplayChanged()`), and scenes rebuild on a
  window resize only if the size actually changed (`ui/restartSceneOnResize.ts`) —
  Phaser also emits `resize` when nothing changed, which used to restart the
  page on every setting change.
- **DEV-only Controls section.** It is shown only under `bun run dev` (`IS_DEV`
  in `game/config/devMode.ts`, i.e. `import.meta.env.DEV`); production builds omit
  the tab and the `GamepadTest` scene, so the tester is dropped from the bundle.
  Which sections exist is `getVisibleSections()` in `settings/settingsSections.ts`
  (tested, with `resolveSection()` and the L / R `stepSection()`). Anything else
  that must be DEV-only should read `IS_DEV` too.

The **Gamepad test** (`scenes/GamepadTest.ts`, using `ui/GamepadTester.ts`) is a
live tester for checking that every button of a connected controller works —
browsers only expose a pad after its first button press, so it asks for one. A
pad the browser maps as `standard` gets a controller-shaped diagram of that
brand's prompt icons (`ui/gamepadLayout.ts` holds the positions): pressed
buttons turn yellow and inverted, the D-pad shows its direction, sticks show
deflection and click. Any other pad gets a raw grid of every button index plus
live axis values — the tool for working out an unknown device's layout (names are
shown only for mappings measured on real hardware, i.e. `GamepadMapping.measured`;
otherwise plain `#index`, since guessed names would mislead). The platform
Guide/Home button has no artwork (the pack's license excludes Guide buttons), so
it's a text chip.

- `src/game/settings/settingsSchema.ts` — Zod schema for the persisted shape.
  Extend this (with a default for every new field, so old saved data still
  parses) as each section gets real settings.
- `src/game/settings/settingsStorage.ts` — the pure load/save functions
  (validated through the schema; corrupt or unavailable storage falls back to
  defaults) — kept free of Phaser so they're unit-tested.
- `src/game/settings/SettingsStore.ts` — holds the current settings, persists
  every change to `localStorage` (they survive a reload), and emits
  `EVENTS.SETTINGS_CHANGED` on the shared `EventBus` on every change, rather
  than any screen reaching into another. Saved settings are per browser
  origin — a different dev-server port is a different origin.
- **Render quality** (Auto/High/Medium/Low) scales `getPixelRatio()` in
  `game/config/pixelRatio.ts` — see `QUALITY_SCALE` — trading HiDPI sharpness
  for fill-rate. Changing it live re-applies the canvas resize/zoom
  (`settings/applyDisplaySettings.ts`) and rebuilds the scene so its UI re-renders
  at the new ratio.
- **Language:** see Localization above.

## Assets

The game font is [Exo 2](https://fonts.google.com/specimen/Exo+2)
SemiBold (SIL Open Font License; text in `public/assets/fonts/OFL-Exo2.txt`),
a static 600-weight instance subset to Latin, Latin Extended-A and Cyrillic so
all four languages render — `public/assets/fonts/Exo2-SemiBold.woff2`. It was
chosen as the closest free match to the mock-up's lettering: ~50 free
techno/squared Google Fonts were compared letter by letter (shape, stroke
weight, width) against `examples/main-menu-example.png`. Exo 2 scored near the
top and is the only close match that also has Cyrillic (Exo and Oxanium
scored marginally higher but are Latin-only; Play scored clearly lower). Font
size and letter spacing in `ui/mainMenuLayout.ts` are fitted to the mock-up's
measured word widths.
Phaser Text draws to a canvas, so the font must be loaded before the first
Text using it exists: `Preloader` awaits `loadGameFont()` (`ui/gameFont.ts`)
before starting `MainMenu`. It is the font of every Text in the game — create
them with `gameTextStyle({ ... })` (`ui/textStyle.ts`), never with a raw
`fontFamily`.

Button-prompt icons come from [Gamepad Prompt Asset Pack](https://github.com/AL2009man/Gamepad-Prompt-Asset-Pack)
by AL2009man (MIT; license in `public/assets/gamepad/`) — see
`art-source/gamepad/README.md` for how the atlas is built and how to add an
icon. Only use this pack, not the author's separate "Gamepad Asset Pack"
(controller overlays), which isn't cleared for commercial games.

UI sound effects (`public/assets/sfx/`, each as `.ogg` + `.m4a` so Safari, which
doesn't play Ogg, gets one too) come from Kenney's
[Interface Sounds](https://kenney.nl/assets/interface-sounds), CC0 (no
attribution required; license text kept next to them). Picked for being short,
clean and at a similar level; how they are played is described under Audio.

| File | Original | Meant for |
|---|---|---|
| `ui-navigate` | `tick_001` (0.05 s) | focus moved (D-pad, mouse hover, tab switch) |
| `ui-select` | `select_003` (0.38 s) | picking an option / activating a button |
| `ui-confirm` | `confirmation_003` (0.32 s, -1 dB) | the main action (e.g. Play) |
| `ui-back` | `back_002` (0.09 s, -3 dB) | going back |

Other CC0 candidates in the same pack (and in Kenney's UI Audio pack,
`kenney.nl/assets/ui-audio`) if a sound doesn't fit: `tick_004`,
`select_001`/`004`, `confirmation_001`, `toggle_001`, `back_004`,
`rollover1-6`. To swap one, re-encode it to `.ogg` + `.m4a` with the same name.

The main menu artwork is `public/assets/ui/` (key `MAIN_MENU_BG_KEY`, file named in
`Preloader`); the settings screens reuse it, blurred, and have no image assets of
their own — everything else on them is drawn with `Graphics` and Text.

Static files (audio, spritesheets, etc.) go in `public/assets` and are
loaded via `this.load.image('key', 'assets/file.png')`. Imported/bundled
assets can instead be `import`-ed directly into a scene module.
