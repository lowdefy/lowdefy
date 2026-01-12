---
description: Document a core Lowdefy package (api, build, cli, client, engine, layout, operators)
argument-hint: "<package-name>"
---

# Document Core Package

Generate documentation for a specific core package in the Lowdefy monorepo.

## Usage

```
/l-docs-package api
/l-docs-package build
/l-docs-package engine
```

## Valid Packages

Core packages (in `packages/`):
- `api` - Request handling, context creation, API routes
- `build` - YAML parsing, validation, build artifacts
- `cli` - Command line interface, dev server orchestration
- `client` - Browser runtime, React integration
- `engine` - State management, operator evaluation
- `layout` - Responsive layout system
- `operators` - Built-in operator implementations

## Workflow

### 1. Validate Package

```bash
ls packages/{package}/package.json
```

If not found, suggest valid packages.

### 2. Gather Information

**Package metadata:**
```bash
cat packages/{package}/package.json
```

**Source structure:**
```bash
ls -la packages/{package}/src/
find packages/{package}/src -name "*.js" -o -name "*.mjs" | head -20
```

**Main exports:**
```bash
cat packages/{package}/src/index.js 2>/dev/null || cat packages/{package}/src/index.mjs
```

**README (if exists):**
```bash
cat packages/{package}/README.md 2>/dev/null
```

**Dependencies (internal):**
Look for `@lowdefy/*` imports to understand package relationships.

### 3. Analyze Key Modules

For each major module/folder in `src/`:
- Read the main file
- Understand its purpose
- Note key exports and functions
- Identify patterns and conventions

### 4. Generate Documentation

Create `cc-docs/packages/{package}.md`:

```markdown
---
package: @lowdefy/{package}
updated: {date}
---

# @lowdefy/{package}

{One-line description from package.json}

## Purpose

{2-3 sentences explaining what this package does and why it exists}

## Architecture

{How this package fits into the overall Lowdefy system}

### Dependencies

**Internal (@lowdefy/*):**
- `@lowdefy/helpers` - {why}
- `@lowdefy/operators` - {why}

**Key External:**
- `{package}` - {why this dependency}

## Key Modules

### {module-name}

**Location:** `src/{path}/`

**Purpose:** {what it does}

**Key exports:**
- `{function}` - {description}
- `{class}` - {description}

**How it works:**
{Brief explanation of the logic/flow}

### {another-module}
...

## Patterns & Conventions

{Notable patterns used in this package}

- **{Pattern}:** {Explanation}

## Integration Points

**Used by:**
- `@lowdefy/{package}` - {how}

**Uses:**
- `@lowdefy/{package}` - {how}

## Key Design Decisions

{Why certain choices were made - this is crucial for Claude Code understanding}

- **{Decision}:** {Rationale}

## Common Tasks

### {Task name}

{How to accomplish something common with this package}

## Files Quick Reference

| File | Purpose |
|------|---------|
| `src/index.js` | Main exports |
| `src/{file}` | {purpose} |
```

### 5. Update Plan

Mark the package as completed in `cc-docs/DOCUMENTATION_PLAN.md`.

### 6. Cross-Reference Check

Verify links to related packages exist or note them as pending.

## Documentation Depth

Focus on:
- **Why** the package exists
- **How** it fits with other packages
- **What** the key modules do
- **Where** to find specific functionality

Skip:
- Line-by-line code explanation
- Full API reference (that's in the code)
- User-facing documentation (that's in packages/docs)

## Accuracy Checklist

Before finalizing documentation:
- [ ] Verify exact counts (e.g., "31 build steps" not "25+ steps")
- [ ] List all context parameters for parsers (BuildParser, ServerParser, WebParser)
- [ ] Include all output files/directories in build output sections
- [ ] Document advanced features (debounce, catchActions, request history)
- [ ] Use correct terminology (e.g., `DisplayMessage` not `Message`)

## Package-Specific Guidance

### @lowdefy/build
- List all 31 build steps by name
- Include complete output structure (keyMap.json, refMap.json, api/, etc.)

### @lowdefy/operators
- Document full payload parameters for each parser:
  - BuildParser: env, variables, refDef, path, jsMap
  - ServerParser: secrets, user, payload, urlQuery, pageId, requestId, global, input, lowdefyGlobal, apiResponses
  - WebParser: state, urlQuery, input, global, requests, event, eventLog, user, actions, lowdefyGlobal, blockId, pageId

### @lowdefy/engine
- Include debounce configuration (ms, leading, trailing)
- Document try/catch pattern for actions (catchActions)
- Note that requests store history arrays, not just latest response

### @lowdefy/actions-core
- Correct action name is `DisplayMessage` (not `Message`)

## Output

Single file: `cc-docs/packages/{package}.md`

## Example

For `l-docs-package engine`:

```markdown
---
package: @lowdefy/engine
updated: 2024-01-08
---

# @lowdefy/engine

Core runtime engine for evaluating operators and managing page state.

## Purpose

The engine is the brain of a running Lowdefy page. It:
- Manages component state (input values, visibility, loading states)
- Evaluates operators (`_state`, `_request`, `_if`, etc.)
- Handles the operator dependency graph
- Triggers re-renders when state changes

## Architecture

The engine runs in the browser as part of `@lowdefy/client`. It receives
the parsed page configuration from the build output and creates a live,
reactive page.

### Dependencies

**Internal:**
- `@lowdefy/operators` - Operator implementations
- `@lowdefy/helpers` - Utility functions

## Key Modules

### State Management

**Location:** `src/state/`

**Purpose:** Tracks all mutable state for a page

**Key concepts:**
- `pageState` - Form inputs, component values
- `requestState` - Loading, error, response data
- `urlQuery` - URL parameters

### Operator Evaluation

**Location:** `src/operators/`

**Purpose:** Recursively evaluates operators in configuration

**How it works:**
1. Walks the config tree looking for `_` prefixed keys
2. Resolves operator based on the key (e.g., `_state` → getState)
3. Passes arguments to operator function
4. Replaces operator node with result
5. Continues until no operators remain
...
```
