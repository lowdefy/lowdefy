# Keyboard Shortcuts

How keyboard shortcuts flow from YAML config through build validation, the engine, and the client to the browser.

## Data Flow

```
YAML Config                    Build                     Engine                   Client
───────────                    ─────                     ──────                   ──────
events:                    lowdefySchema.js           Events.js              ShortcutManager
  onClick:                 validates shortcut         initEvent() stores     registers listener
    shortcut: mod+K  ───►  is string | string[] ───►  shortcut on event ───► via tinykeys
    try: [...]             buildEvents.js                                         │
                           warns on browser                                       ▼
                           default conflicts                                 keypress
                                                                                  │
                                                                             visibility check
                                                                                  │
                                                                             triggerEvent()
                                                                                  │
                                                                             ShortcutBadge
                                                                             renders ⌘ K
```

## Build Phase (`@lowdefy/build`)

### Schema Validation — `lowdefySchema.js`

The event long-form object schema includes `shortcut` alongside `try`, `catch`, and `debounce`:

```javascript
shortcut: {
  anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }];
}
```

### Build Validation — `buildEvents.js`

During build, `buildEvents.js`:

1. Validates that `shortcut` is a string or array of strings.
2. Warns on browser default conflicts (`mod+n`, `mod+t`, `mod+w`, `mod+r`, `mod+q`, `mod+l`) — these can't be reliably overridden.
3. Collects shortcut references for duplicate detection within the page.

## Engine Phase (`@lowdefy/engine`)

### Events Class — `Events.js`

`initEvent()` extracts `shortcut` from the event config object and stores it on the runtime event state:

```javascript
shortcut: type.isObject(actions) ? actions.shortcut ?? null : null;
```

The shortcut is read-only metadata. The Events class doesn't use it for triggering — it's consumed by the client's ShortcutManager and by blocks for rendering ShortcutBadge.

## Client Phase (`@lowdefy/client`)

### ShortcutManager — `createShortcutManager.js`

Factory function that creates the global keyboard shortcut manager.

**Lifecycle:**

1. **Init** — Called when a page context mounts. Walks the block tree, collects all `events.*.shortcut` strings, normalizes them to tinykeys format, and registers a single global `keydown` listener via `tinykeys()`.
2. **Handler** — On keypress, the listener checks if the block is visible (lazy visibility check), then calls `triggerEvent()` on the matching event.
3. **Destroy** — Called on context change or unmount. Removes the tinykeys listener.

**Shortcut normalization:**

Lowdefy uses a readable format (`mod+K`, `shift+Enter`). Tinykeys uses `$mod+k`, `Shift+Enter`. The normalizer:

- Lowercases single-letter keys
- Maps `mod` → `$mod`
- Preserves special key names (`Escape`, `Enter`, `Backspace`, etc.)
- Handles space-separated sequences (`g i` → tinykeys sequence format)

**Input field suppression:**

Non-modifier shortcuts (single keys like `Escape`, `/`) are suppressed when focus is in `<input>`, `<textarea>`, or `contentEditable` elements. Modifier shortcuts (`mod+K`, `alt+N`) fire regardless of focus.

**Browser defaults:**

When a shortcut handler fires, it calls `event.preventDefault()` to suppress the browser's default action for that key combination.

### ShortcutBadge — `createShortcutBadge.js`

Factory function that creates a React component for rendering keyboard shortcut indicators.

**Registration:** Created in `initLowdefyContext.js` and passed to blocks via `lowdefy._internal.Components.ShortcutBadge`. Blocks import it from their props (alongside Icon and Link).

**Props:**

| Prop       | Type                         | Description                   |
| ---------- | ---------------------------- | ----------------------------- |
| `shortcut` | `string \| string[] \| null` | Shortcut string(s) to display |

**Platform detection:**

Uses `navigator.platform` to detect Mac vs Windows/Linux. Renders platform-appropriate symbols:

| Modifier | Mac | Windows/Linux |
| -------- | --- | ------------- |
| `mod`    | ⌘   | Ctrl          |
| `shift`  | ⇧   | Shift         |
| `alt`    | ⌥   | Alt           |
| `ctrl`   | ⌃   | Ctrl          |

Special key display: `Escape` → `Esc`, `Enter` → `↵`, `Backspace` → `⌫`, `Delete` → `⌦`, arrows → `←↑↓→`, `Tab` → `⇥`, `Space` → `␣`.

**Rendering:**

Each key in the combination is rendered as a `<kbd>` element with `style.module.css` classes (`.shortcut-badge`, `.shortcut-kbd`, `.shortcut-then`). Multiple shortcuts (array) render as separate badge groups.

**Styling:** `style.module.css` provides:

- `.shortcut-badge` — Inline flex container with small font
- `.shortcut-kbd` — Individual key with background fill and border
- `.shortcut-then` — "then" text separator for key sequences

## Block Integration

Blocks that render ShortcutBadge follow a two-line pattern:

```javascript
const { ShortcutBadge } = lowdefy._internal.Components;

// In the render:
<ShortcutBadge shortcut={events?.onClick?.shortcut} />;
```

Current blocks with ShortcutBadge support: **Button**, **Anchor**, **Tag**, **Search**.

The Search block has additional shortcut logic — it accepts a `properties.shortcut` value (default `mod+k`) and registers its own keyboard listener for opening the search modal, independent of the event shortcut system.

## Item-Level Shortcuts — `useItemShortcuts.js`

A React hook in `blocks-antd` for keyboard shortcuts on list items (Select options, Dropdown menu items). Separate from the global ShortcutManager — handles per-item matching within a block's internal item list.

## Duplicate and Conflict Handling

- **Build time:** `buildEvents.js` collects all shortcuts on a page and warns on duplicates.
- **Runtime:** Last-registered-wins. If two blocks bind the same shortcut, the one registered last (later in the block tree) takes precedence.
- **Browser conflicts:** Build warns on known browser defaults. At runtime, `preventDefault()` suppresses the browser action, but some combinations (`mod+N`, `mod+T`, `mod+W`) may not be overridable.

## Dependencies

- **tinykeys** (~650B) — Minimal keyboard shortcut library. Single global listener, supports key sequences, `$mod` for platform-aware modifier. Chosen for size and simplicity.
