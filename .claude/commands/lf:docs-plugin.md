---
description: Document a Lowdefy plugin package (blocks, connections, operators, actions)
argument-hint: "<category>/<plugin-name> or <category>"
---

# Document Plugin Package

Generate documentation for plugin packages in the Lowdefy monorepo.

## Usage

```
# Document specific plugin
/lf:docs-plugin blocks/antd
/lf:docs-plugin connections/mongodb
/lf:docs-plugin operators/js

# Document plugin category overview
/lf:docs-plugin blocks
/lf:docs-plugin connections
```

## Plugin Categories

Located in `packages/plugins/`:

### blocks/
UI components that render in the browser
- `blocks-antd` - Ant Design components (primary UI library)
- `blocks-basic` - HTML elements, containers
- `blocks-aggrid` - AG Grid data tables
- `blocks-echarts` - ECharts visualizations
- `blocks-markdown` - Markdown rendering
- `blocks-google-maps` - Google Maps integration
- `blocks-algolia` - Algolia search
- `blocks-color-selectors` - Color pickers
- `blocks-loaders` - Loading spinners
- `blocks-qr` - QR code generation

### connections/
Data source integrations (server-side)
- `connection-mongodb` - MongoDB database
- `connection-axios-http` - HTTP/REST APIs
- `connection-knex` - SQL databases
- `connection-elasticsearch` - Elasticsearch
- `connection-google-sheets` - Google Sheets
- `connection-redis` - Redis cache
- `connection-sendgrid` - SendGrid email
- `connection-stripe` - Stripe payments

### operators/
Data transformation functions
- `operators-js` - JavaScript evaluation
- `operators-mql` - MongoDB Query Language
- `operators-moment` - Date manipulation
- `operators-nunjucks` - Template strings
- `operators-change-case` - String case conversion
- `operators-diff` - Object diffing
- `operators-uuid` - UUID generation
- `operators-yaml` - YAML parsing
- `operators-jsonata` - JSONata queries

### actions/
Event handlers (onClick, onEnter, etc.)
- `actions-core` - Built-in actions (SetState, Request, Link, etc.)
- `actions-pdf-make` - PDF generation

### plugins/
Composite plugins (multiple types)
- `plugin-next-auth` - Authentication providers
- `plugin-aws` - AWS services (S3, SES, etc.)
- `plugin-csv` - CSV parsing/generation
- `plugin-auth0` - Auth0 integration

## Workflow

### For Category Overview

1. List all plugins in category:
   ```bash
   ls -d packages/plugins/{category}/*/
   ```

2. For each plugin, read `package.json` description

3. Create `cc-docs/plugins/{category}/overview.md`:

```markdown
---
category: {category}
updated: {date}
---

# {Category} Plugins

{What this category provides}

## How {Category} Work

{Brief explanation of the plugin type's role in Lowdefy}

## Available Plugins

| Plugin | Description | Key Types |
|--------|-------------|-----------|
| {name} | {desc} | {types} |

## Plugin Structure

All {category} plugins follow this structure:
```
{category}-{name}/
├── package.json
├── src/
│   ├── {type}/        # Individual implementations
│   └── types.js       # Type definitions
└── README.md
```

## Common Patterns

{Patterns shared across plugins in this category}

## Adding New {Category}

{How to create a new plugin of this type}
```

### For Specific Plugin

1. Read package metadata:
   ```bash
   cat packages/plugins/{category}/{plugin}/package.json
   ```

2. List source structure:
   ```bash
   ls -la packages/plugins/{category}/{plugin}/src/
   ```

3. Read type definitions (blocks/connections have these):
   ```bash
   cat packages/plugins/{category}/{plugin}/src/types.js 2>/dev/null
   ```

4. Sample a few implementations to understand patterns

5. Create `cc-docs/plugins/{category}/{plugin-name}.md`:

```markdown
---
plugin: @lowdefy/{plugin}
category: {category}
updated: {date}
---

# @lowdefy/{plugin}

{Description from package.json}

## Purpose

{Why this plugin exists and when to use it}

## Provided Types

| Type | Description |
|------|-------------|
| {TypeName} | {what it does} |

## Architecture

{How this plugin integrates with Lowdefy}

### For Blocks:
- Rendering approach (controlled vs uncontrolled)
- State binding patterns
- Event handling

### For Connections:
- Authentication method
- Request/response patterns
- Error handling

### For Operators:
- Input/output types
- When to use vs alternatives

## Key Implementations

### {TypeName}

**Location:** `src/{type}/`

**Purpose:** {what it does}

**Props/Options:**
- `{prop}` - {description}

**Example usage context:**
```yaml
# How this appears in Lowdefy config
{example}
```

## Patterns & Conventions

{Notable patterns in this plugin}

## Dependencies

**Key external:**
- `{package}` - {why}

## Design Decisions

{Why certain implementation choices were made}
```

### 4. Update Plan

Mark completed in `cc-docs/DOCUMENTATION_PLAN.md`.

## Output Locations

- Category overview: `cc-docs/plugins/{category}/overview.md`
- Specific plugin: `cc-docs/plugins/{category}/{plugin-name}.md`

## Documentation Focus

**Include:**
- What types/components the plugin provides
- How it fits into the Lowdefy ecosystem
- Key implementation patterns
- Why certain approaches were taken

**Skip:**
- Full prop documentation (that's in packages/docs)
- Every component variation
- CSS/styling details
