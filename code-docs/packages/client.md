# @lowdefy/client

React client for rendering Lowdefy pages. Orchestrates block rendering, context management, and user interactions.

## Purpose

This package provides:

- The main `Client` React component that renders pages
- Page context initialization and management
- Block component mounting and lifecycle
- API communication (requests, endpoints)
- Navigation and routing integration

## Key Export

```javascript
import Client from '@lowdefy/client';

// Used by the server to render pages
<Client
  auth={authSession}
  Components={componentMap}
  config={pageConfig}
  jsMap={customJsFunctions}
  lowdefy={lowdefyContext}
  router={router}
  stage={buildStage}
  types={typeDefinitions}
  window={windowObject}
/>;
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Client                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ProgressBarCtrl  │  │ DisplayMessage  │  │    Context      │  │
│  │ (loading state) │  │ (notifications) │  │  (page state)   │  │
│  └─────────────────┘  └─────────────────┘  └────────┬────────┘  │
│                                                      │          │
│                                              ┌───────▼───────┐  │
│                                              │     Head      │  │
│                                              │ (meta tags)   │  │
│                                              └───────────────┘  │
│                                              ┌───────▼───────┐  │
│                                              │     Block     │  │
│                                              │ (root block)  │  │
│                                              └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Modules

### Core Components

| Module                     | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| `Client.js`                | Main entry component, initializes lowdefy context |
| `Context.js`               | Page context provider, manages state and requests |
| `Head.js`                  | HTML head management (title, meta)                |
| `DisplayMessage.js`        | Toast notifications and messages                  |
| `ProgressBarController.js` | Loading progress indicator                        |
| `useDarkMode.js`           | Dark mode hook (config → localStorage → OS pref)  |

### Block Rendering (`/block/`)

| Module      | Purpose                                         |
| ----------- | ----------------------------------------------- |
| `Block.js`  | Renders individual blocks with their components |
| (in engine) | Block state, events, and lifecycle              |

### API Communication

| Module                 | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `createCallRequest.js` | Creates function to call data requests    |
| `createCallAPI.js`     | Creates function to call custom endpoints |
| `request.js`           | HTTP request utilities                    |

### Keyboard Shortcuts

| Module                     | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `createShortcutManager.js` | Global keyboard shortcut listener lifecycle (tinykeys)  |
| `createShortcutBadge.js`   | ShortcutBadge React component for visual key indicators |

**ShortcutManager lifecycle:** Initialized on page context creation → walks block tree to collect all shortcuts → registers a single global keydown listener via tinykeys → checks block visibility lazily per handler → destroyed on context change/unmount.

**ShortcutBadge** is registered in `initLowdefyContext.js` as a component (alongside Icon and Link). Blocks receive it via props and render it next to titles/labels. It detects the platform (Mac vs Windows/Linux) and renders modifier symbols accordingly (⌘/⇧/⌥ on Mac, Ctrl/Shift/Alt elsewhere).

See [keyboard-shortcuts.md](../architecture/keyboard-shortcuts.md) for the full data flow.

### Context Initialization

| Module                   | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `initLowdefyContext.js`  | Sets up the global lowdefy context                           |
| `createHandleError.js`   | Creates error handler with dedup, server round-trip, display |
| `setupLink.js`           | Configures navigation links                                  |
| `createLinkComponent.js` | Creates the Link component for navigation                    |
| `createIcon.js`          | Creates the `Icon` component that renders `IconData`         |

### Authentication (`/auth/`)

Handles auth state and session management on the client.

### Icons (`createIcon.js`)

`createIcon(Icons)` returns the `Icon` component that blocks receive as `components.Icon`, and that HTML `data-icon` renders through `registerHtmlEnhancements`. `Icons` is `types.icons`: the build-generated `plugins/icons.js`, a plain map from every icon name the app uses (semantic `edit`, set `Pencil`, qualified `lucide:Pencil`) to `IconData`:

```javascript
{ node: [['path', { d: 'M21.174 6.812…' }], ['path', { d: 'm15 5 4 4' }]], size: 24, attrs: { … } }
```

The build resolves names and bakes set `attrs` into the data, so the client does a plain `Icons[name]` lookup on every render (never at creation, so dev can add names to the same object later).

**Rendering.** The data renders as children of lucide-react's generic `Icon`, with `icon={{ node: [], size, width, height }}` giving the viewBox. `renderNodes` walks the node tree recursively with index keys, because lucide-react's own `iconNode` renderer drops nested children. The `<svg>` sits inside `@ant-design/icons`' `Icon` through a stable `IconHost`, so the DOM stays `span.anticon > svg.lucide` and antd component CSS still spaces icons.

**Props.**

- `size`, `strokeWidth` and `nonScalingStroke` are per-icon props over the `LucideProvider` defaults. `Client.js` sets the provider from `lowdefy.theme.icons`, read at render because `createIcon` runs before the theme is set. The build writes the defaults into `theme.json`, so there are no client fallbacks.
- `nonScalingStroke` is read with `useLucideContext()` and set as `vector-effect` on each shape, because children bypass lucide-react's handling.
- `color` and `rotate` go through CSS (`color`, `transform`), so they work for stroke and fill sets alike.
- An empty title sets `aria-hidden="true"`; a non-empty one renders a `<title>` child. The Icon block generates titles from names (`ArrowLeftRight` → "Arrow left right"); HTML icons pass `title: ''`.
- `spin` swaps in the spinning `loading` icon. An unknown name renders `icon-missing` in red. Both are semantic names, so aliases and sets restyle them.

**antd chrome.** `Client.js` also wraps the page in a nested `ConfigProvider` whose icon keys (`modal.closeIcon`, `alert.successIcon`, `collapse.expandIcon`, `button.loadingIcon`, …) are `<Icon>` elements with semantic names. Message, Notification and ConfirmModal render through `App.useApp()` holders above `Client`, so the message and notification helpers set `icon` and `closeIcon` on each call instead.

See [plugin-system.md](../architecture/plugin-system.md#icon-sets) for how the build resolves names.

## The Lowdefy Context

The `lowdefy` object is the central context passed through the app:

```javascript
lowdefy = {
  // User session
  user: { id, email, roles, ... },

  // Navigation
  router: router,
  Link: LinkComponent,

  // Configuration
  home: { pageId, configured },
  menus: [...],
  urlQuery: { ... },

  // Internal
  _internal: {
    blockComponents: { ... },    // Loaded block components
    displayMessage: fn,          // Show toast messages
    callRequest: fn,             // Call data requests
    callEndpoint: fn,            // Call API endpoints
    handleError: fn,             // Error handler with dedup, server round-trip, display
    logger: browserLogger,       // Shared browser logger (createBrowserLogger)
    ...
  }
}
```

## Page Context

Each page has its own context (from `@lowdefy/engine`):

```javascript
context = {
  // State containers
  state: { ... },              // Form/input values
  requests: { ... },           // Request responses

  // Internals
  _internal: {
    RootAreas: { ... },        // Block tree
    onInitDone: boolean,       // Initialization complete
    ...
  }
}
```

## Client Rendering Flow

```
1. Client receives props from server
         │
         ▼
2. initLowdefyContext()
   - Set up auth, router, components
   - Initialize display message handler
         │
         ▼
3. Render ProgressBarController
   - Shows loading state during transitions
         │
         ▼
4. Render DisplayMessage
   - Toast notification container
         │
         ▼
5. Render Context (page context provider)
   - Creates page context via @lowdefy/engine
   - Handles onInit events
   - Manages state
         │
         ▼
6. Wait for onInitDone
         │
         ▼
7. Render Head (meta tags)
         │
         ▼
8. Render root Block
   - Recursively renders block tree
   - Each block gets its component and props
```

## Design Decisions

### Why Separate Client and Engine?

**Client** handles React-specific concerns:

- Component rendering
- DOM interactions
- Router integration
- HTTP requests

**Engine** handles framework-agnostic logic:

- State management
- Operator evaluation
- Action execution
- Event handling

This separation allows potential non-React implementations.

### Why Context Per Page?

Each page gets isolated context because:

- State doesn't leak between pages
- Clean slate on navigation
- Memory efficient (old context garbage collected)
- Predictable behavior

### Why Global Lowdefy Object?

The `lowdefy` object provides:

- Shared configuration across all blocks
- Single source for auth state
- Centralized navigation
- Common utilities

Blocks receive it as a prop, not via React context, for performance.

## Integration Points

- **@lowdefy/engine**: Provides state management and actions
- **@lowdefy/layout**: Provides layout components. Container.js, InputContainer.js, etc. pass `classNames.block`/`styles.block` to BlockLayout, and layout components accept `className`/`style` props instead of the deprecated `makeCssClass`/`blockStyle`/`areaStyle` pattern.
- **@lowdefy/block-utils**: Block helper utilities
- **Block plugins**: Actual UI components
- **`@lowdefy/client/adapters`**: History-API router, Link and Head components the server packages pass in as `router` and `Components`

## Event Flow Example

```
User clicks button
       │
       ▼
Block fires onClick event
       │
       ▼
@lowdefy/engine executes actions
       │
       ├──► SetState action
       │    Updates context.state
       │    Triggers re-render
       │
       ├──► Request action
       │    Calls createCallRequest()
       │    HTTP to /api/request
       │    Response stored in state
       │
       └──► Navigate action
            Calls lowdefy.router.push()
            Client unmounts, new page loads
```
