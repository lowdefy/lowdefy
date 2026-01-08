# Lowdefy Monorepo Overview

> A configuration-driven web framework built on Next.js. Write YAML, get React apps.

## What Lowdefy Is

Lowdefy lets developers build web applications using YAML/JSON configuration instead of code. Users define:
- **Pages** with layouts and UI components (blocks)
- **Connections** to databases and APIs
- **Requests** that query those connections
- **Actions** triggered by user events
- **Operators** for dynamic logic within config

The framework compiles this config into a Next.js application at build time.

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User's YAML Config                          │
│    (lowdefy.yaml, pages/*.yaml, connections, requests, etc.)        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         @lowdefy/build                               │
│  - Parses YAML/JSON                                                  │
│  - Validates against schema                                          │
│  - Resolves _ref imports                                             │
│  - Evaluates build-time operators                                    │
│  - Generates build artifacts                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js Server (runtime)                         │
│  ┌─────────────────────┐    ┌────────────────────────────────────┐  │
│  │   @lowdefy/api      │    │         @lowdefy/client            │  │
│  │  - API routes       │    │  - React rendering                 │  │
│  │  - Request exec     │    │  - Block mounting                  │  │
│  │  - Connection mgmt  │    │  - Event handling                  │  │
│  │  - Auth context     │    │  - @lowdefy/engine (state)         │  │
│  └─────────────────────┘    │  - @lowdefy/layout (grid)          │  │
│                              └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          Browser / End User
```

## Core Packages

| Package | Role | Key Responsibility |
|---------|------|-------------------|
| [lowdefy (cli)](./packages/cli.md) | Entry point | Commands: init, dev, build, start |
| [@lowdefy/build](./packages/build.md) | Compiler | YAML → build artifacts |
| [@lowdefy/api](./packages/api.md) | Server | API routes, request execution |
| [@lowdefy/client](./packages/client.md) | Client | React rendering, page context |
| [@lowdefy/engine](./packages/engine.md) | Runtime | State management, actions |
| [@lowdefy/layout](./packages/layout.md) | Layout | Grid system, block positioning |
| [@lowdefy/operators](./packages/operators.md) | Logic | Operator parsing and evaluation |

## Plugin System

Lowdefy is extensible via npm packages. Everything the user sees or interacts with comes from plugins.

### Plugin Types

| Type | What It Does | Examples |
|------|--------------|----------|
| **Blocks** | UI components | Button, TextInput, Table, Chart |
| **Connections** | Data source configs | MongoDB, PostgreSQL, REST API |
| **Operators** | Logic functions | `_if`, `_get`, `_sum`, `_date` |
| **Actions** | Event handlers | SetState, Request, Navigate |
| **Auth Providers** | Authentication | Google, Auth0, Credentials |

### Default Plugins

These ship with Lowdefy and don't need explicit installation:
- `@lowdefy/blocks-antd` - Primary UI components (Ant Design based)
- `@lowdefy/blocks-basic` - HTML primitives
- `@lowdefy/operators-js` - Core JavaScript operators
- `@lowdefy/actions-core` - Standard actions

See [Plugin System Architecture](./architecture/plugin-system.md) for internals.

## Key Concepts

### Build vs Runtime

| Phase | When | What Happens |
|-------|------|--------------|
| **Build** | `lowdefy build` | Config parsed, validated, compiled to artifacts |
| **Runtime** | User visits page | Artifacts loaded, operators evaluated, requests executed |

This separation is why Lowdefy apps are fast - heavy YAML parsing happens once at deploy time.

### Operators

Operators are functions prefixed with `_` that make config dynamic:

```yaml
# Static value
title: Welcome

# Dynamic value using operator
title:
  _if:
    test:
      _eq:
        - _state: user.role
        - admin
    then: Admin Dashboard
    else: User Dashboard
```

Operators can run at:
- **Build time** (in `@lowdefy/build`) - for config composition
- **Runtime client** (in `@lowdefy/engine`) - for UI reactivity
- **Runtime server** (in `@lowdefy/api`) - for request logic

### State Management

Each page has isolated state managed by `@lowdefy/engine`:
- **state** - Form values and user input
- **urlQuery** - URL query parameters
- **input** - Data passed when navigating to page
- **_request** - Cached request responses
- **_global** - Shared across pages (sparingly used)

### Requests

Requests are server-side data operations:
1. Client triggers request via action
2. `@lowdefy/client` sends to API route
3. `@lowdefy/api` executes against connection
4. Response returned and cached in state

## Server Variants

| Server | Use Case |
|--------|----------|
| `server` | Production Next.js server for deployments |
| `server-dev` | Local development server with hot reload |

## File Structure

```
lowdefy/
├── packages/
│   ├── api/              # Server-side API
│   ├── build/            # Config compiler
│   ├── cli/              # CLI tool
│   ├── client/           # React client
│   ├── engine/           # State management
│   ├── layout/           # Grid layout
│   ├── operators/        # Operator framework
│   ├── plugins/          # Plugin packages
│   │   ├── actions/
│   │   ├── blocks/
│   │   ├── connections/
│   │   ├── operators/
│   │   └── plugins/
│   ├── servers/          # Server implementations
│   └── utils/            # Shared utilities
├── packages/docs/        # docs.lowdefy.com content
└── packages/website/     # lowdefy.com content
```

## Where to Go Next

### Architecture Deep Dives

- [Build Pipeline](./architecture/build-pipeline.md) - How YAML becomes a Next.js app
- [Request Lifecycle](./architecture/request-lifecycle.md) - Data flow from action to database
- [State Management](./architecture/state-management.md) - Page state and reactivity
- [Plugin System](./architecture/plugin-system.md) - How plugins are loaded and registered
- [Auth System](./architecture/auth-system.md) - Authentication integration
- [Operator System](./architecture/operator-system.md) - Operator evaluation at build/runtime

### Plugin Documentation

- [Blocks](./plugins/blocks/overview.md) - UI components (Ant Design, AG Grid, Charts)
- [Connections](./plugins/connections/overview.md) - Data sources (MongoDB, SQL, REST)
- [Operators](./plugins/operators/overview.md) - Logic functions (JS, MQL, Moment)
- [Actions](./plugins/actions/overview.md) - Event handlers (Core, PDF)
- [Plugins](./plugins/plugins/overview.md) - Auth and utilities (NextAuth, AWS, CSV)

### Servers

- [Servers Overview](./servers/overview.md) - Next.js server architecture
- [Production Server](./servers/server.md) - Deployment server
- [Development Server](./servers/server-dev.md) - Hot reload and file watching

### Utilities

- [Utils Overview](./utils/overview.md) - Shared utility packages
- [Helpers](./utils/helpers.md) - Core helper functions (get, set, type)
- [Block Utils](./utils/block-utils.md) - CSS generation, error boundaries

### Core Packages

- [CLI](./packages/cli.md) - Command line interface
- [Build](./packages/build.md) - Configuration compiler
- [API](./packages/api.md) - Server-side API
- [Client](./packages/client.md) - React rendering
- [Engine](./packages/engine.md) - State management
- [Layout](./packages/layout.md) - Grid system
- [Operators](./packages/operators.md) - Operator framework
