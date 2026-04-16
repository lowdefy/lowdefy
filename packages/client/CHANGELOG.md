# Change Log

## 5.0.0

### Major Changes

- f430f02dde: Rename `areas` to `slots` throughout the framework.

  ### Breaking Changes

  - **`areas` renamed to `slots`**: All block area definitions use `slots` instead of `areas`. The build pipeline auto-migrates `areas` to `slots` with a deprecation warning in dev mode (error in production).
  - **Engine internals**: `Areas.js` renamed to `Slots.js`. Block instances expose `.slots` instead of `.areas`.
  - **Layout internals**: `layoutParamsToArea` renamed to `layoutParamsToSlot`.
  - **Custom blocks**: Blocks that render child areas must use `content.slotName()` — the API is unchanged but the terminology in config and docs is now `slots`.

- 29eb199c7f: Restructure block metadata from component static properties to dedicated `meta.js` files.

  ### Breaking Changes

  - **`schema.js` renamed to `meta.js`**: Block definitions moved from `schema.js` to `meta.js`. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys`, `events`, and `properties` (JSON Schema).
  - **`schemas.js` barrel renamed to `metas.js`**: Block packages export `./metas` instead of `./schemas`.
  - **`.meta` removed from components**: Block components no longer have a `.meta` static property. Metadata is loaded from the `blockMetas.json` build artifact at runtime.
  - **`blockMetas.json` build artifact**: The build pipeline writes `plugins/blockMetas.json` containing category, valueType, and initValue for each block type.
  - **`buildBlockSchema(meta)`**: New function in `@lowdefy/block-utils` generates complete JSON Schema from meta objects with operator support and CSS slot key validation.

- f430f02dde: Replace antd Row/Col grid with a pure CSS grid layout system.

  ### Breaking Changes

  - **antd Grid dependency removed**: `@lowdefy/layout` no longer imports antd's `Row`, `Col`, or `Grid` components.
  - **CSS Grid implementation**: Layout uses a 24-column CSS grid with CSS custom properties and media queries. Responsive breakpoints align with Tailwind CSS v4.
  - **`span: 0` hides block**: Setting `layout.span: 0` now applies `display: none` instead of making the block full-width.
  - **Responsive `style` breakpoints removed**: `style.sm`, `style.md` etc. no longer work. Use Tailwind classes via `class: "p-16 sm:p-8"` instead.
  - **`_media` operator**: Returns `"2xl"` instead of `"xxl"` for the largest breakpoint (1536px instead of 1600px).

  ### Renamed Layout Properties

  The `content*` prefix is dropped. Build normalizes old names with a deprecation warning.

  | Old                       | New                | Purpose                        |
  | ------------------------- | ------------------ | ------------------------------ |
  | `layout.contentGutter`    | `layout.gap`       | Spacing between child blocks   |
  | `layout.contentAlign`     | `layout.align`     | Vertical alignment of children |
  | `layout.contentJustify`   | `layout.justify`   | Horizontal distribution        |
  | `layout.contentDirection` | `layout.direction` | Flex direction                 |
  | `layout.contentWrap`      | `layout.wrap`      | Flex wrap                      |
  | `layout.contentOverflow`  | `layout.overflow`  | Overflow behavior              |
  | `slots.*.gutter`          | `slots.*.gap`      | Gap within a slot              |
  | `xxl` breakpoint          | `2xl`              | Aligns with Tailwind v4        |

- f430f02dde: Replace the Less/Emotion styling system with unified `style` and `class` properties using `.` prefixed CSS slot keys.

  ### Breaking Changes

  - **Less removed**: `.less` files are no longer supported. All styling uses CSS, CSS Modules, or Tailwind utilities.
  - **`makeCssClass` removed**: Blocks no longer call `methods.makeCssClass()`. They receive `classNames` and `styles` objects as props, keyed by CSS slot names (`element`, `icon`, `header`, `body`, etc.).
  - **`mediaToCssObject` removed** from `@lowdefy/block-utils`.
  - **`style` replaces `styles`**: The `style` (singular) property handles all styling. Using `styles` (plural) throws a `ConfigError`.
  - **`class` property added**: New `class` property for CSS classes (Tailwind utilities, custom classes). Supports string, array, or object with `.` slot keys.
  - **`properties.style` moved**: Block-specific `properties.style` maps to `style: { .element }` at build time.
  - **Inline style props removed**: `headerStyle`, `bodyStyle`, `maskStyle`, `contentWrapperStyle`, `contentStyle`, `labelStyle`, `valueStyle`, `tabBarStyle`, `overlayStyle` are replaced by CSS slot keys (e.g., `style: { .header }`, `style: { .body }`).

  ### CSS Slot Keys

  `.` prefixed keys target specific parts of a block:

  | Key                                | Target                                                  |
  | ---------------------------------- | ------------------------------------------------------- |
  | `.block`                           | Layout wrapper (grid column)                            |
  | `.element`                         | Component root element                                  |
  | `.header`, `.body`, `.cover`, etc. | Antd semantic sub-elements (declared in `meta.cssKeys`) |

  Flat shorthand (no `.` keys) maps to `.block`:

  ```yaml
  # These are equivalent:
  style: { marginTop: 20 }
  style:
    .block: { marginTop: 20 }
  ```

### Minor Changes

- f430f02dde: Add ErrorBar component to the development server that displays build errors and warnings in a fixed bottom bar. Build warnings now propagate from the build pipeline to the browser for immediate developer feedback.
- 130a569d36: Add keyboard shortcut support for block events.

  Blocks can now define keyboard shortcuts on events using the `shortcut` property in the event long-form object. Shortcuts are platform-aware (`mod+K` maps to Cmd+K on Mac, Ctrl+K on Windows), support sequences (`g i`), and can be arrays for multiple bindings.

  - **Build validation** warns on duplicate shortcuts within a page and conflicts with browser defaults (e.g. `mod+N`)
  - **ShortcutManager** registers a single global keydown listener via tinykeys with visibility gating and input field suppression
  - **ShortcutBadge** component renders platform-appropriate key symbols (e.g. `⌘ K`) and is available to all blocks via `components.ShortcutBadge`
  - **ShortcutBadge in blocks**: Button, Anchor, Tag, and Search blocks display a platform-aware keyboard shortcut badge (e.g. `⌘S` / `Ctrl+S`) next to the title when the event has a `shortcut` defined

- c8f4a41063: Add `theme.darkMode` config with system preference support.

  **System Dark Mode (`theme.darkMode`)**

  - New `theme.darkMode` config key accepts `'system'` (default), `'light'`, or `'dark'`
  - When set to `'system'`, the app follows the OS dark mode preference and updates live when it changes
  - When set to `'light'` or `'dark'`, the developer locks the mode — user preferences are stored but not applied

  **SetDarkMode Action**

  - Now accepts string params: `darkMode: 'system' | 'light' | 'dark'`
  - Without params, cycles through light, dark, and system preferences

  **`_media` Operator**

  - New `_media: darkModePreference` returns the user's preference (`'system'`, `'light'`, or `'dark'`)
  - `_media: darkMode` continues to return the effective boolean state

  **Dark Mode Rendering**

  - Notification, Message, and ConfirmModal render with correct dark mode colors via `App.useApp()` hooks
  - Loader blocks (Skeleton, Spinner) use antd design tokens instead of hardcoded colors
  - 404 page and loading states use theme-aware backgrounds
  - Mobile menu drawer background matches the active theme

- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- Updated dependencies [f430f02dde]
- Updated dependencies [29eb199c7f]
- Updated dependencies [130a569d36]
- Updated dependencies [905d5d406]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/engine@5.0.0
  - @lowdefy/layout@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/engine@4.7.3
- @lowdefy/layout@4.7.3
- @lowdefy/block-utils@4.7.3
- @lowdefy/errors@4.7.3
- @lowdefy/helpers@4.7.3
- @lowdefy/logger@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/engine@4.7.2
- @lowdefy/layout@4.7.2
- @lowdefy/block-utils@4.7.2
- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2
- @lowdefy/logger@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/engine@4.7.1
- @lowdefy/layout@4.7.1
- @lowdefy/block-utils@4.7.1
- @lowdefy/errors@4.7.1
- @lowdefy/helpers@4.7.1
- @lowdefy/logger@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/engine@4.7.0
  - @lowdefy/layout@4.7.0
  - @lowdefy/block-utils@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- 5e03091ee: Add e2e testing package for Lowdefy apps

  **@lowdefy/e2e-utils** (new package)

  - Locator-first API via `ldf` Playwright fixture: `ldf.block('id').do.*`, `ldf.block('id').expect.*`
  - Request mocking with static YAML files (`mocks.yaml`) and inline per-test overrides
  - Request assertion API: `ldf.request('id').expect.toFinish()`, `.toHaveResponse()`, `.toHavePayload()`
  - State and URL assertions: `ldf.state('key').expect.toBe()`, `ldf.url().expect.toBe()`
  - Manifest generation from build artifacts for block type resolution and helper loading
  - `createConfig()` and `createMultiAppConfig()` for Playwright config with automatic build/server management
  - Scaffold command (`npx @lowdefy/e2e-utils`) for project setup with templates and dependency management
  - Block helper factory with auto-provided expect methods (visible, hidden, disabled, validation)

  **@lowdefy/cli**

  - Add `--server` option to `lowdefy build` for server variant selection (e.g., `--server e2e`)

  **@lowdefy/client**

  - Expose `window.lowdefy` when `stage="e2e"` for e2e state/validation access

  **@lowdefy/blocks-antd**

  - Flatten e2e helper APIs for polymorphic proxy compatibility
  - Add TextArea e2e helper

  **@lowdefy/block-dev-e2e**

  - Remove unused srcDir variable

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

### Patch Changes

- aebca6ab51: refactor: Consolidate error classes into @lowdefy/errors package with environment-specific subpaths

  **Error Package Restructure**

  - New `@lowdefy/errors` package with all error classes (`ConfigError`, `PluginError`, `ServiceError`, `UserError`, `LowdefyInternalError`, `ConfigWarning`)
    - `@lowdefy/errors/build` - Build-time errors with sync resolution via keyMap/refMap
  - Moved ConfigMessage, resolveConfigLocation from node-utils to errors/build

  **TC39 Standard Constructor Signatures**

  - All error constructors standardized to `new MyError(message, { cause, ...options })`:
    ```javascript
    new ConfigError('Property must be a string.', { configKey });
    new OperatorError(e.message, { cause: e, typeName: '_if', received: params });
    new ServiceError(undefined, { cause: error, service: 'MongoDB', configKey });
    ```
  - Plugins throw simple errors without knowing about configKey
  - Interface layer adds configKey before re-throwing

  **configKey Added to ALL Errors**

  - Interface layer now adds configKey to ALL error types (not just PluginError):
    - ConfigError: adds configKey if not present, re-throws
    - ServiceError: created via `new ServiceError(undefined, { cause: error, service, configKey })`
    - Plain Error: wraps in PluginError with configKey
  - Helps developers trace any error back to its config source, including service/network errors

  **Cause Chain Support**

  - All error classes use TC39 `error.cause` instead of custom stack copying
  - CLI logger walks cause chain displaying `Caused by:` lines
  - `extractErrorProps` recursively serializes Error causes for pino JSON logs
  - ConfigError and PluginError extract `received` and `configKey` from `cause`:
    ```javascript
    new ConfigError(undefined, { cause: plainError }); // extracts cause.received and cause.configKey
    new PluginError(undefined, { cause: plainError }); // same extraction
    ```

  **Error Display**

  - `errorToDisplayString()` formats errors for display, appending `Received: <JSON>` when `error.received` is defined
  - `rawMessage` stores the original unformatted message on PluginError

- Updated dependencies [7936ee3fd8]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [f673e3ab3]
  - @lowdefy/engine@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/block-utils@4.6.0
  - @lowdefy/logger@4.6.0
  - @lowdefy/layout@4.6.0

## 4.5.2

### Patch Changes

- d573e8ff8: Add guard to prevent TypeError in icon `formatTitle`.
  - @lowdefy/engine@4.5.2
  - @lowdefy/layout@4.5.2
  - @lowdefy/block-utils@4.5.2
  - @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/engine@4.5.1
- @lowdefy/layout@4.5.1
- @lowdefy/block-utils@4.5.1
- @lowdefy/helpers@4.5.1

## 4.5.0

### Minor Changes

- d9512d9be: - Refactor build to create individual block instances.
  - Add hybrid block type to extend block functionality.

### Patch Changes

- 4f610de5c: Allow custom icon titles and format the icon name if a title is not specified.
- Updated dependencies [d9512d9be]
  - @lowdefy/engine@4.5.0
  - @lowdefy/layout@4.5.0
  - @lowdefy/block-utils@4.5.0
  - @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/engine@4.4.0
- @lowdefy/layout@4.4.0
- @lowdefy/block-utils@4.4.0
- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/engine@4.3.2
- @lowdefy/layout@4.3.2
- @lowdefy/block-utils@4.3.2
- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/engine@4.3.1
- @lowdefy/layout@4.3.1
- @lowdefy/block-utils@4.3.1
- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/engine@4.3.0
- @lowdefy/layout@4.3.0
- @lowdefy/block-utils@4.3.0
- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/engine@4.2.2
- @lowdefy/layout@4.2.2
- @lowdefy/block-utils@4.2.2
- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/layout@4.2.1
  - @lowdefy/engine@4.2.1
  - @lowdefy/block-utils@4.2.1
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- 47d855918: Move layoutParamsToArea into Area component.
- 47d855918: Remove highlightBorders from layout.
- Updated dependencies [47d855918]
- Updated dependencies [47d855918]
  - @lowdefy/layout@4.2.0
  - @lowdefy/engine@4.2.0
  - @lowdefy/block-utils@4.2.0
  - @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- Updated dependencies [d040e3005]
  - @lowdefy/engine@4.1.0
  - @lowdefy/layout@4.1.0
  - @lowdefy/block-utils@4.1.0
  - @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/engine@4.0.2
- @lowdefy/layout@4.0.2
- @lowdefy/block-utils@4.0.2
- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/engine@4.0.1
- @lowdefy/layout@4.0.1
- @lowdefy/block-utils@4.0.1
- @lowdefy/helpers@4.0.1

## 4.0.0

### Minor Changes

- f44cfa0cb: Add built with lowdefy branding to servers.

### Patch Changes

- e694f72ee: Add a message to Link Action to inform when popups are blocked.
- 84e479d11: Fix show branding logic.
  Change invalid license throws to return invalid license objects.
  - @lowdefy/engine@4.0.0
  - @lowdefy/layout@4.0.0
  - @lowdefy/block-utils@4.0.0
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- Update to Next 13 and update Link. ([33c34c3](https://github.com/lowdefy/lowdefy/commit/33c34c3b5b10973bd749b7dc806210aa7d92dbda))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- Auth methods should return signin promises. ([5dcb778](https://github.com/lowdefy/lowdefy/commit/5dcb7788f54c07f6b5e4f3e9cf3d27537a795bb4))
- Fix basePath on requests. ([a2b4aaf](https://github.com/lowdefy/lowdefy/commit/a2b4aaf19ba6a5ccf213e7d08a2df342794d4420)), closes [#1554](https://github.com/lowdefy/lowdefy/issues/1554)
- Fix initialisation of lowdefy context object. ([2ed4398](https://github.com/lowdefy/lowdefy/commit/2ed4398d59be5b037e7a4d17f7e5a14398e73973))

### Features

- **actions-core:** Add UpdateSession action. ([c5d6011](https://github.com/lowdefy/lowdefy/commit/c5d601151acbdb791aaf1304ae95b0ccb18b8c03))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Features

- deserialize client config. ([1f82002](https://github.com/lowdefy/lowdefy/commit/1f820025445567c5f1f0f146c3a84941a5eece24))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **client:** Allow onClick to be passed down to Link component. ([718a352](https://github.com/lowdefy/lowdefy/commit/718a35259ac111cc385df098c069957095ff1413))
- **client:** Update how Link handles onClick. ([622ec8c](https://github.com/lowdefy/lowdefy/commit/622ec8cf94b111862098325629e69fbc3cd28123))
- **deps:** Update dependency @ant-design/icons ([497ff67](https://github.com/lowdefy/lowdefy/commit/497ff672a3f90c3fa00fa1d0839168a71702f456))
- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **engine:** Update Link to allow use of href. ([d00344a](https://github.com/lowdefy/lowdefy/commit/d00344adf2c36291878abb87b725893327853012))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))
- **tests:** Fix jest tests for es modules. ([0dc3bed](https://github.com/lowdefy/lowdefy/commit/0dc3bede2f7f3e4bb9096fcfe43da7c43fd4f7b5))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- Read urlQuery from location where used, not on lowdefy. ([11541e4](https://github.com/lowdefy/lowdefy/commit/11541e4722359bb57bace8298fc475caf58dbf6e))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Features

- Add extra next-auth configuration properties. ([9781ba4](https://github.com/lowdefy/lowdefy/commit/9781ba46620eb0ddaa11d7d41eb0d8f518999784))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
- **client:** Remove area and layout default object. ([27a56f1](https://github.com/lowdefy/lowdefy/commit/27a56f18e6e71faa51696d014b41b97744a3ff57))
- **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))

### Features

- Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
- Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
- **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))

### Features

- Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
- Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- **engine:** RootBlocks.map to use blockId. ([d31064f](https://github.com/lowdefy/lowdefy/commit/d31064ff9c685d1ae959ce9142ac11aca55fb6c0))
- Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
- Update all packages to use @lowdefy/jest-yaml-transform. ([7bdf0a4](https://github.com/lowdefy/lowdefy/commit/7bdf0a4bb8ea972de7e4d4b82097a6fdaebfea56))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))
- Set login providerId if only one provider is configured. ([8bc34a1](https://github.com/lowdefy/lowdefy/commit/8bc34a1b0533e6231bfdc2655ba48e1df701a772))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

### Bug Fixes

- **client:** Clean up use effect hook. ([413c697](https://github.com/lowdefy/lowdefy/commit/413c697a08c429c39100f9a23298e591bc194ed4))
- **client:** On mount async method should always be called. ([912e405](https://github.com/lowdefy/lowdefy/commit/912e40522999e8e8b7eb65ec2855f43fab9c759b))

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Adapt createAuthMethods for client package. ([4675297](https://github.com/lowdefy/lowdefy/commit/467529780bc1c90a089f6b157e264e5fbe10ca63))
- Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
- **client:** Fix setupLink - createLink needs lowdefy for input. ([314f131](https://github.com/lowdefy/lowdefy/commit/314f131ceb82bc39cf339dd2e6dfdf56aadb8543))
- Remove user from block properties. ([7cadf63](https://github.com/lowdefy/lowdefy/commit/7cadf6389a3c50fafbb4834f099e6514cad790bd))

### Features

- Next auth login and logout working. ([d47f9e5](https://github.com/lowdefy/lowdefy/commit/d47f9e56cd6da7827499ef9cf248dfc64f8bd12b))
- **server:** Add read user object from next-auth session. ([fbab7f1](https://github.com/lowdefy/lowdefy/commit/fbab7f14e7a23fcc82f4a7e1903c4aafdda8169d))
- Use next-auth session to authenticate in api. ([462c0ac](https://github.com/lowdefy/lowdefy/commit/462c0ac0d05429514ecd2a2b11a6a21b8915b462))

### BREAKING CHANGES

- Removed user from block properties.

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **client:** Fix setupLink - createLink needs lowdefy for input. ([f152ac2](https://github.com/lowdefy/lowdefy/commit/f152ac2c5ef0bf3dc085fbe7e89648ac2ca7c550))
- **client:** Render progress bar next to context, and event order fixes. ([fc32c75](https://github.com/lowdefy/lowdefy/commit/fc32c75ea2d8c5c97e21280b09fce5518ec14d37))

### Features

- **client:** Add display message implementation. ([f94ee32](https://github.com/lowdefy/lowdefy/commit/f94ee32a797b61b5f0f2bcc4de429b815f6de864))
- **client:** Apply reset context flag to recreate context on client. ([09f49a2](https://github.com/lowdefy/lowdefy/commit/09f49a2072f2803268b20f69655e03a57ef8f097))
- **client:** Init @lowdefy/client. ([bb7931d](https://github.com/lowdefy/lowdefy/commit/bb7931d0da4ca3614ae4223ca19663a9088d2a45))
