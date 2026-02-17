---
description: Document cross-cutting Lowdefy architecture topics (build pipeline, request lifecycle, etc.)
argument-hint: '<topic>'
---

# Document Architecture Topic

Generate documentation for cross-cutting architectural concerns in the Lowdefy monorepo.

## Usage

```
/l-docs-architecture build-pipeline
/l-docs-architecture request-lifecycle
/l-docs-architecture state-management
/l-docs-architecture plugin-system
```

## Available Topics

### build-pipeline

How Lowdefy transforms YAML config into a running Next.js app

- Config parsing and validation
- Reference resolution (`_ref`)
- Plugin loading
- Build artifacts generation
- Next.js integration

### request-lifecycle

How data flows from user action to database and back

- Client-side request initiation
- API route handling
- Connection execution
- Response processing
- Error handling

### state-management

How Lowdefy manages page and application state

- Page state structure
- State operators (`_state`, `_global`, `_input`)
- State updates and reactivity
- Cross-page state sharing

### plugin-system

How Lowdefy's plugin architecture works

- Plugin discovery and loading
- Type registration
- Build-time vs runtime plugins
- Creating custom plugins

### auth-system

How authentication integrates with Lowdefy

- Auth.js (NextAuth) integration
- Provider configuration
- Session management
- Protected pages

### operator-system

How operators are evaluated

- Operator syntax and resolution
- Evaluation context
- Async operators
- Operator chaining

## Workflow

### 1. Research Phase

Trace the topic through relevant packages:

**For build-pipeline:**

```bash
# Start with CLI
cat packages/cli/src/commands/build.js
# Follow to build package
cat packages/build/src/build.js
# Check server output
ls packages/servers/server/
```

**For request-lifecycle:**

```bash
# Client-side
grep -r "callRequest" packages/client/src/
# API handling
cat packages/api/src/routes/request/
# Connection execution
cat packages/plugins/connections/*/src/
```

### 2. Create Flow Documentation

For each topic, document the complete flow:

````markdown
---
topic: { topic }
updated: { date }
packages: [list of involved packages]
---

# {Topic Title}

{One paragraph overview of what this covers}

## Overview

{High-level explanation - what problem does this solve?}

## The Flow

### Step 1: {First Stage}

**Package:** `@lowdefy/{package}`
**Location:** `packages/{package}/src/{file}`

{What happens at this stage}

**Key code:**

```javascript
// Simplified example showing the pattern
```
````

**Inputs:** {what comes in}
**Outputs:** {what goes out}

### Step 2: {Next Stage}

...

## Package Responsibilities

| Package        | Role in {topic} |
| -------------- | --------------- |
| @lowdefy/cli   | {role}          |
| @lowdefy/build | {role}          |

...

## Data Structures

### {Structure Name}

{When this structure is used in the flow}

```javascript
{
  // Shape of the data at this point
}
```

## Key Design Decisions

### {Decision 1}

**Question:** {What choice was made?}

**Decision:** {What was chosen}

**Rationale:** {Why - this is the most important part}

**Trade-offs:**

- Pro: {benefit}
- Con: {downside}

### {Decision 2}

...

## Common Patterns

### {Pattern Name}

{Description of a pattern used throughout this flow}

**Example:**

```javascript
// Code showing the pattern
```

## Error Handling

{How errors flow through this system}

## Extension Points

{Where/how this can be extended or customized}

## Debugging Tips

{How to debug issues in this flow}

- Check {location} for {symptom}
- Common error: {error} usually means {cause}

## Related Topics

- [{Related Topic}](./related-topic.md)

````

### 3. Cross-Reference

Ensure the doc links to:
- Relevant package docs
- Related architecture docs
- Any deep-dive docs

### 4. Update Plan

Mark completed in `code-docs/DOCUMENTATION_PLAN.md`.

## Output

Single file: `code-docs/architecture/{topic}.md`

## Example: Build Pipeline

```markdown
---
topic: build-pipeline
updated: 2024-01-08
packages: [cli, build, server]
---

# Build Pipeline

How Lowdefy transforms YAML configuration into a deployable Next.js application.

## Overview

The build pipeline takes a directory of YAML files and produces a complete
Next.js app. This happens at build time (not runtime), which is key to
Lowdefy's performance - all config parsing and validation happens once.

## The Flow

### Step 1: CLI Invocation

**Package:** `@lowdefy/cli`
**Location:** `packages/cli/src/commands/build.js`

The CLI parses arguments, locates the config directory, and initializes
the build context.

**Key code:**
```javascript
// Simplified
const context = await createBuildContext({
  configDirectory,
  outputDirectory,
});
await build(context);
````

### Step 2: Config Loading

**Package:** `@lowdefy/build`
**Location:** `packages/build/src/build/`

Loads `lowdefy.yaml` and recursively resolves all `_ref` references.

**Why `_ref` resolution at build time?**

- Allows splitting config across files for maintainability
- Validates all references exist before runtime
- Enables config preprocessing (env vars, etc.)

### Step 3: Schema Validation

**Package:** `@lowdefy/build`

Validates the complete config against JSON schemas.

### Step 4: Plugin Resolution

Identifies all plugins used in config and generates import statements.

### Step 5: Build Artifacts

Generates:

- `pages/` - Next.js page routes
- `public/` - Static assets
- `lowdefy.config.json` - Runtime config

...

```

## Focus

Architecture docs should answer:
- **What** is the overall flow?
- **Why** is it structured this way?
- **Where** does each package fit?
- **How** do the pieces connect?
- **What** are the key design decisions?
```
