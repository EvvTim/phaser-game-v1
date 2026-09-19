# Phaser 4 + TypeScript Project Instructions (Spec-Base)

## Core Stack & Tooling
- **Engine:** Phaser 4 (Modern 2D Web Engine)
- **Language:** TypeScript (Strict mode enabled)
- **Validation:** Zod (for runtime validation, config definitions, external data, and game state payloads)
- **Testing:** Vitest (unit testing)

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
