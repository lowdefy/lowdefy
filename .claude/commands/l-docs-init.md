---
description: Initialize documentation for the Lowdefy monorepo - discover structure, create plan
argument-hint: ""
---

# Initialize Lowdefy Monorepo Documentation

Bootstrap documentation for the Lowdefy framework monorepo. Creates a mind map for Claude Code to understand the project architecture, code patterns, and design decisions.

## Purpose

These docs are **for Claude Code** to:
- Understand how the framework works internally
- Know why certain architectural decisions were made
- Navigate the monorepo efficiently
- Provide accurate answers about Lowdefy internals

## Output Location

All documentation goes to `cc-docs/`:
```
cc-docs/
├── Overview.md              # High-level architecture
├── Philosophy.md            # Design principles & decisions
├── DOCUMENTATION_PLAN.md    # Progress tracking
├── packages/                # Core package docs
│   ├── api.md
│   ├── build.md
│   ├── cli.md
│   ├── client.md
│   ├── engine.md
│   ├── layout.md
│   └── operators.md
├── plugins/                 # Plugin package docs
│   ├── blocks/
│   ├── connections/
│   ├── operators/
│   ├── actions/
│   └── plugins/
├── architecture/            # Cross-cutting concerns
│   ├── build-pipeline.md
│   ├── request-lifecycle.md
│   ├── state-management.md
│   └── plugin-system.md
└── .metadata/
    └── monorepo-structure.json
```

## Workflow

### Phase 1: Deep Discovery

Run comprehensive analysis of the monorepo:

**Core Packages:**
```bash
ls packages/*.json 2>/dev/null || ls -d packages/*/
```

**Plugin Packages:**
```bash
ls -d packages/plugins/*/
ls -d packages/plugins/*/*/
```

**Servers:**
```bash
ls -d packages/servers/*/
```

**Utils:**
```bash
ls -d packages/utils/*/
```

**Build Configuration:**
```bash
cat turbo.json
cat pnpm-workspace.yaml
```

**For each package, gather:**
- `package.json` - name, description, dependencies
- `src/` structure - main modules and exports
- `README.md` if exists
- Test files for understanding behavior

### Phase 2: Present Discovery

Summarize findings:

```markdown
## Monorepo Discovery Results

### Core Packages ({count})
| Package | Description | Key Dependencies |
|---------|-------------|------------------|
| @lowdefy/api | ... | ... |
| @lowdefy/build | ... | ... |

### Plugin Categories ({count} total)
- **Blocks:** {count} packages (antd, basic, aggrid, etc.)
- **Connections:** {count} packages (mongodb, axios-http, etc.)
- **Operators:** {count} packages (js, mql, moment, etc.)
- **Actions:** {count} packages (core, pdf-make)
- **Plugins:** {count} packages (next-auth, aws, etc.)

### Servers ({count})
- server, server-dev, server-community, server-enterprise

### Utils ({count})
- helpers, node-utils, ajv, etc.
```

### Phase 3: Generate DOCUMENTATION_PLAN.md

Create tracking plan at `cc-docs/DOCUMENTATION_PLAN.md`:

```markdown
# Lowdefy Monorepo Documentation Plan

## Progress Overview
- [ ] Phase 1: Foundation
- [ ] Phase 2: Core Packages
- [ ] Phase 3: Plugin System
- [ ] Phase 4: Architecture Docs
- [ ] Phase 5: Validation

## Phase 1: Foundation
- [ ] cc-docs/Overview.md
- [ ] cc-docs/Philosophy.md
- [ ] cc-docs/.metadata/monorepo-structure.json

## Phase 2: Core Packages
### packages/api
- [ ] cc-docs/packages/api.md

### packages/build
- [ ] cc-docs/packages/build.md

### packages/cli
- [ ] cc-docs/packages/cli.md

### packages/client
- [ ] cc-docs/packages/client.md

### packages/engine
- [ ] cc-docs/packages/engine.md

### packages/layout
- [ ] cc-docs/packages/layout.md

### packages/operators
- [ ] cc-docs/packages/operators.md

## Phase 3: Plugin System

### Blocks
- [ ] cc-docs/plugins/blocks/overview.md
- [ ] cc-docs/plugins/blocks/antd.md
- [ ] cc-docs/plugins/blocks/basic.md
...

### Connections
- [ ] cc-docs/plugins/connections/overview.md
- [ ] cc-docs/plugins/connections/mongodb.md
...

### Operators
- [ ] cc-docs/plugins/operators/overview.md
...

### Actions
- [ ] cc-docs/plugins/actions/overview.md
...

## Phase 4: Architecture
- [ ] cc-docs/architecture/build-pipeline.md
- [ ] cc-docs/architecture/request-lifecycle.md
- [ ] cc-docs/architecture/state-management.md
- [ ] cc-docs/architecture/plugin-system.md

## Phase 5: Validation
- [ ] Verify all internal links work
- [ ] Check cross-references between docs
```

### Phase 4: Generate Metadata

Create `cc-docs/.metadata/monorepo-structure.json`:

```json
{
  "generated": "2024-01-08T00:00:00Z",
  "packages": {
    "core": ["api", "build", "cli", "client", "engine", "layout", "operators"],
    "plugins": {
      "blocks": ["blocks-antd", "blocks-basic", ...],
      "connections": ["connection-mongodb", ...],
      "operators": ["operators-js", ...],
      "actions": ["actions-core", ...],
      "plugins": ["plugin-next-auth", ...]
    },
    "servers": ["server", "server-dev", "server-community", "server-enterprise"],
    "utils": ["helpers", "node-utils", ...]
  },
  "workspaces": "packages/*, packages/plugins/**, packages/servers/*, packages/utils/*"
}
```

### Phase 5: User Review

Present the plan:

```
Generated cc-docs/DOCUMENTATION_PLAN.md with:
- {X} core packages to document
- {Y} plugin packages across {Z} categories
- {N} architecture topics
- {M} server variants

Review the plan and edit if needed.

Ready to proceed with Phase 1 (Foundation)?
```

### Phase 6: Foundation Docs

If user confirms, create:

1. **cc-docs/Overview.md** - High-level architecture:
   - What is Lowdefy (from user perspective)
   - Monorepo structure overview
   - How packages relate to each other
   - Key concepts (blocks, operators, connections, etc.)

2. **cc-docs/Philosophy.md** - Design principles:
   - Configuration over code
   - Plugin extensibility
   - Why YAML configuration
   - State management approach
   - Why certain architectural choices

## Related Commands

- `lf:docs-package` - Document a specific core package
- `lf:docs-plugin` - Document a plugin package
- `lf:docs-architecture` - Document cross-cutting architecture
- `lf:docs-update` - Update docs based on changes

## Key Principles

- **For Claude Code**: Focus on understanding, not user documentation
- **Why over what**: Explain design decisions and trade-offs
- **Cross-references**: Link related packages and concepts
- **Practical context**: Include examples of how things work together
- **Keep current**: Docs should reflect actual code state
