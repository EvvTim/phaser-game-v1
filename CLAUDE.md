# Phaser 4 + TypeScript Project Instructions (Spec-Base)

## Core Stack & Tooling
- **Engine:** Phaser 4 (Modern 2D Web Engine)
- **Language:** TypeScript (Strict mode enabled)
- **Validation:** Zod (for runtime validation, config definitions, external data, and game state payloads)
- **Testing:** Vitest (unit testing)
- **Localization:** i18next (RU, UA, EN, PL)
- **Package manager / runner:** Bun ONLY

### Package Manager (Bun only)
- Use **only `bun`**: `bun install`, `bun add <pkg>`, `bun run <script>`, `bunx`. **Never use `npm`, `npx`, `yarn` or `pnpm`**, and never leave a `package-lock.json` behind — `bun.lock` is the only lockfile.
- Check work with `bun run typecheck`, `bun run test` and `bun run build`.

---

## Architectural Rules & Development Philosophy

### 1. Phaser 4 API-First Principle
- **Always check Phaser 4 built-in capabilities first.** Before implementing custom utilities, custom physics logic, or custom state handling, check if Phaser 4 provides native solutions (e.g., Phaser Timers, Tween Manager, Actions API, Math functions, Input handlers, PathFollowers, New GPU Particle Emitters, Native Spatial Hash Grid).
- **Phaser 4 Rendering Systems:** Use Phaser 4 native Render Nodes and Actions API instead of custom WebGL pipelines or legacy custom FX shaders.
- **No reinventing the wheel.** Create custom implementations ONLY if standard Phaser 4 API explicitly lacks the required feature.

### 2. Extreme Component Reuse & Object Pooling (Crucial)
- **Object Pooling:** ALWAYS use `Phaser.GameObjects.Group` / `Phaser.Physics.Arcade.Group` (with `runChildUpdate: true`, `maxSize`, and `classType`) for frequently spawned objects (bullets, enemies, particles, floating text, UI items). NEVER call `.destroy()` and `new` dynamically in gameplay loops. Use `.setActive(false).setVisible(false)` and recycle via `.get()`.
- **Reusable Scene UI & Entities:** Design game entities, buttons, panels, and indicators as reusable modular components (subclasses of `Phaser.GameObjects.Container` or custom components) that accept configuration objects validated by Zod.
- **Factory & Prototype Pattern:** Centralize the creation and recycling of game objects through dedicated Factory modules or Phaser Group pools.
- **Asset Reuse:** Use shared Texture Atlases, Sprite Sheets, and Bitmap Fonts instead of individual loose image assets.

### 3. Architecture & Design Patterns
- **Event-Driven Architecture:** Use Phaser’s native Event Emitter (`this.events` inside Scenes, or a shared Phaser Event Emitter / Scene Manager events) for communication between components, managers, systems, and scenes. Avoid tight coupling and direct cross-system references.
- **Scene Isolation:** Keep Scenes focused on lifecycle, setup, and orchestration. Offload domain logic, data models, and complex calculations to isolated helper classes or pure functional modules.
- **Motion:** animate with Phaser's Tween Manager / camera fades through `ui/motion.ts` (`MOTION` timings, `tweenIn` / `tweenOut`, `fadeCameraIn` / `fadeCameraOutThen`) so every screen moves the same way, and it must respect `prefers-reduced-motion` (the helpers do). Lay the final layout out first, then tween *to* it. A scene takes `animate` / `fade` in `init(data)`; a rebuild of the same screen (language change, resize) restarts with `animate: false`. See README, Motion.
- **Composition over Inheritance:** Favor composition of reusable behavior components (e.g., Health, Movement, Lifetime, Input) over multi-level class inheritance hierarchies for GameObjects.
- **Type-Safety with Zod:** Use Zod schemas to validate raw configuration files, level data, external payloads, API responses, and custom event payloads before passing them to Phaser 4 scenes or logic units.

### 4. Localization (i18next)
- **Never hardcode user-visible text.** Every label, title and message goes through `t('some.key')` from `src/game/i18n/i18n.ts`.
- Supported languages: `ru`, `uk` (shown as "UA"), `en`, `pl` — see `src/game/i18n/languages.ts`. Translations live in `src/game/i18n/locales/`.
- **Adding a string:** add the key to `locales/en.ts` first (it defines the `Translation` shape and the typed `t()` keys), then to `ru.ts`, `uk.ts` and `pl.ts`. A missing key is a compile error.
- Language names in the language picker are shown in their own language and are NOT translated (`LANGUAGE_NATIVE_NAMES`).
- Default language: the system/browser language if supported, otherwise English. An explicit choice is persisted with the other settings.
- Text is read when a scene is created, so a language change must restart/re-render the scene (the Settings scene already does this on `SETTINGS_CHANGED`).

### 5. Text & font
- **One font for the whole game:** Exo 2 SemiBold (`ui/gameFont.ts`, license in `public/assets/fonts/`). Create every Text with `gameTextStyle({ ... })` (`ui/textStyle.ts`) — never a raw `fontFamily: 'Arial'` — so all four languages (incl. Cyrillic) match. The font is loaded in `Preloader` before any scene that draws text.

### 6. Settings
- Persisted settings live in `src/game/settings/`: Zod schema (`settingsSchema.ts`, every field needs a default), storage (`settingsStorage.ts`), and `SettingsStore` (emits `EVENTS.SETTINGS_CHANGED`).
- **Audio:** menu music and UI sound effects are owned by the persistent `Audio` scene (`scenes/Audio.ts`); scenes and components drive it only through events — `EVENTS.MUSIC_MENU_START` / `EVENTS.MUSIC_STOP`, and `emitUiSound(kind)` (`EVENTS.UI_SOUND`) for effects — never by referencing it. Decode only the selected track (~70-90 MB each). Volumes (master / music / effects) are percents in `settings.audio`, applied live; a control that updates a setting in place (a slider) must return `none` from `getSettingsChangeEffect()` so the Settings scene isn't rebuilt under it. See `audio/` and README.
- **Adding a setting:** schema field + default → `SettingsStore` setter (if new section) → apply it at startup and on change in `game/main.ts` (display settings via `applyDisplaySettings`) → UI in the Settings scene → i18n keys in all 4 locales → tests.

### 7. Gamepad UI
- **Controller support:** identify a pad's brand through `detectControllerFamily()` (`input/gamepadMapping.ts`) — never hardcode Xbox assumptions. New non-standard hardware gets an empirically measured entry (use `gamepadLogger.ts`), not a guessed one. Confirm/back follow the brand's own convention (Nintendo: right face button confirms).
- **Gamepad tester:** Settings -> Controls -> Gamepad test (`ui/GamepadTester.ts`, shown by the `GamepadTest` scene) is **DEV-only** — the tab is hidden and the scene/code dropped from production builds via `IS_DEV` (`config/devMode.ts`); section visibility lives in `settings/settingsSections.ts`. Guard any new dev-only tool the same way. It must keep covering every standard button (0-16) — `ui/gamepadLayout.ts` has a test for it. For a non-standard pad show raw `#index` chips, and only trust `buttonLabels` when the mapping is `measured`.
- **Prompts:** show button icons via `GamepadHint` + `getPromptFrame(family, role)` (`ui/gamepadPrompts.ts`) so they match the connected controller; icons come from AL2009man's Gamepad Prompt Asset Pack (MIT, credit kept in `public/assets/gamepad/`), built by `art-source/gamepad/build-atlas.mjs`. Do not use the same author's "Gamepad Asset Pack" (controller overlays) in the game — its licensing isn't cleared for commercial use.
- `GamepadNavigator` works on any `NavigableItem` (`input/NavigableItem.ts`: `setFocused`, `activate`, world position) — `MenuItem` and the settings controls (`ChoiceChip`, `ArrowSelector`, `LineSlider`, `TextButton`) implement it; give a new focusable component that interface. A control that uses a D-pad direction itself (a slider's left/right) implements the optional `handleDirection()`.
- Focus is moved by the D-pad to the nearest item in that direction (`input/spatialNavigation.ts`); the Settings tabs are NOT D-pad targets — they switch only with **L / R** (or a click), and after a switch focus starts on the first control of the section (or Back if it has none).
- Visual cues: in the settings a focused control (gamepad or mouse hover) gets a plain thin cream frame (`ui/FocusFrame.ts`) — **no effects, no filters**; the selected option is a cream plate with dark text. Keep it that plain; do not bring back Glow filters.

---

## Testing Guidelines (Vitest)

### Scope & Boundaries
- **DO NOT test Phaser 4 internal engine features.** Do not test standard Phaser rendering, Canvas/WebGL context creation, physics collisions, scene transitions, or built-in engine methods.
- **Test ONLY business logic and custom code:**
    - Game rules, state management, scoring logic, and custom math handlers.
    - Zod parsing schemas and data transformations.
    - Event payload formats and event logic handlers (mocking the Phaser Event Emitter if necessary).
    - Custom data structures, state machines, and pool management logic.
- **Mocking Strategy:** Isolate pure business logic into decoupled functions/classes or mock Phaser dependencies so Vitest tests run fast without demanding WebGL/Canvas context.

---

## Code Style & Implementation Checklist

1. **Strict Types:** Explicit return types for all public functions and methods. Strict prohibition of `any`.
2. **Event Naming:** Store event name string identifiers as `const` enums or immutable freeze objects (`const EVENTS = { ... } as const`).
3. **Resource Cleanup:** Always remove custom event listeners and return pooled objects to their groups on Scene shutdown or destroy (`this.events.once(Phaser.Scenes.Events.SHUTDOWN, ...)` or `Phaser.Scenes.Events.DESTROY`) to prevent memory leaks.
4. **Maximized API Usage:** Strive to maximize usage of official Phaser 4 API capabilities (`Phaser.Math`, `Phaser.Utils`, `Phaser.Data.DataManager`, `Phaser.Events.EventEmitter`, `Phaser.Actions`, `Phaser.GameObjects.Group`).
