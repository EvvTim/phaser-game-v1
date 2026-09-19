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
- **Composition over Inheritance:** Favor composition of reusable behavior components (e.g., Health, Movement, Lifetime, Input) over multi-level class inheritance hierarchies for GameObjects.
- **Type-Safety with Zod:** Use Zod schemas to validate raw configuration files, level data, external payloads, API responses, and custom event payloads before passing them to Phaser 4 scenes or logic units.

### 4. Localization (i18next)
- **Never hardcode user-visible text.** Every label, title and message goes through `t('some.key')` from `src/game/i18n/i18n.ts`.
- Supported languages: `ru`, `uk` (shown as "UA"), `en`, `pl` — see `src/game/i18n/languages.ts`. Translations live in `src/game/i18n/locales/`.
- **Adding a string:** add the key to `locales/en.ts` first (it defines the `Translation` shape and the typed `t()` keys), then to `ru.ts`, `uk.ts` and `pl.ts`. A missing key is a compile error.
- Language names in the language picker are shown in their own language and are NOT translated (`LANGUAGE_NATIVE_NAMES`).
- Default language: the system/browser language if supported, otherwise English. An explicit choice is persisted with the other settings.
- Text is read when a scene is created, so a language change must restart/re-render the scene (the Settings scene already does this on `SETTINGS_CHANGED`).

### 5. Settings
- Persisted settings live in `src/game/settings/`: Zod schema (`settingsSchema.ts`, every field needs a default), storage (`settingsStorage.ts`), and `SettingsStore` (emits `EVENTS.SETTINGS_CHANGED`).
- **Adding a setting:** schema field + default → `SettingsStore` setter (if new section) → apply it at startup and on change in `game/main.ts` (display settings via `applyDisplaySettings`) → UI in the Settings scene → i18n keys in all 4 locales → tests.

### 6. Gamepad UI
- Focus is moved by the D-pad to the nearest button in that direction (`input/spatialNavigation.ts`); tabs are NOT D-pad targets — they switch only with **L / R** (or a click), and after a switch focus starts on the first interactive element of the section (or Back if it has none).
- Visual cues: yellow Glow = active tab (`Button` `selectedGlow`), cyan Glow = gamepad focus, yellow tint = selected option. Glow filters are created lazily and only for those buttons (each one costs a render pass); their quality is a user setting (`config/glowQuality.ts`, default low).

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
