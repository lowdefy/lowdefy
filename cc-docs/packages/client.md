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
  router={nextRouter}
  stage={buildStage}
  types={typeDefinitions}
  window={windowObject}
/>
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

| Module | Purpose |
|--------|---------|
| `Client.js` | Main entry component, initializes lowdefy context |
| `Context.js` | Page context provider, manages state and requests |
| `Head.js` | HTML head management (title, meta) |
| `DisplayMessage.js` | Toast notifications and messages |
| `ProgressBarController.js` | Loading progress indicator |

### Block Rendering (`/block/`)

| Module | Purpose |
|--------|---------|
| `Block.js` | Renders individual blocks; logs parse errors to server with deduplication |
| (in engine) | Block state, events, and lifecycle |

### API Communication

| Module | Purpose |
|--------|---------|
| `createCallRequest.js` | Creates function to call data requests |
| `createCallAPI.js` | Creates function to call custom endpoints |
| `request.js` | HTTP request utilities; deserializes `~err` server errors into typed error objects |

### Context Initialization

| Module | Purpose |
|--------|---------|
| `initLowdefyContext.js` | Sets up the global lowdefy context |
| `createLogError.js` | Creates error logging function with deduplication; sends to server, deserializes response |
| `setupLink.js` | Configures navigation links |
| `createLinkComponent.js` | Creates the Link component for navigation |
| `createIcon.js` | Creates icon rendering function |

### Authentication (`/auth/`)

Handles auth state and session management on the client.

## The Lowdefy Context

The `lowdefy` object is the central context passed through the app:

```javascript
lowdefy = {
  // User session
  user: { id, email, roles, ... },

  // Navigation
  router: nextRouter,
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
    logError: fn,                // Log errors with location resolution
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
- **@lowdefy/layout**: Provides layout components
- **@lowdefy/block-utils**: Block helper utilities
- **Block plugins**: Actual UI components
- **Next.js**: Router and head management

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
