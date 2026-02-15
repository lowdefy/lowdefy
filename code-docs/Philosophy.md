# Documentation Philosophy

This documentation exists to help Claude Code understand the Lowdefy monorepo - not just **what** the code does, but **why** it's structured this way.

## Purpose

These docs are a **mind map** for AI assistants:

- Navigate the monorepo efficiently
- Understand architectural decisions
- Know where to find specific functionality
- Provide accurate answers about Lowdefy internals

## Writing Style

### Focus on "Why"

Bad:

> The build function takes a config object and returns artifacts.

Good:

> The build happens at deploy time (not runtime) so all YAML parsing and validation occurs once. This is why Lowdefy apps are fast despite heavy configuration.

### Be Concise

- One sentence per concept
- Bullet points over paragraphs
- Tables for comparisons
- Code snippets for patterns

### Link Liberally

Cross-reference related docs:

- `[engine](./packages/engine.md)` for state details
- `[build pipeline](./architecture/build-pipeline.md)` for how config becomes code

### Include Context

When documenting a decision:

1. What was the question/problem?
2. What options were considered?
3. What was chosen and why?
4. What are the trade-offs?

## Structure

```
code-docs/
├── Overview.md              # Start here - high-level map
├── Philosophy.md            # This file - how to read/write docs
├── packages/                # One doc per core package
├── plugins/                 # Plugin category + individual docs
├── architecture/            # Cross-cutting flows
└── .metadata/               # Generated metadata
```

## What to Document

### Include

- Package purpose and role in the system
- How packages depend on each other
- Key modules and what they do
- Design decisions and rationale
- Patterns and conventions
- Integration points
- Common debugging approaches

### Skip

- Line-by-line code explanation
- Full API reference (read the code)
- User-facing docs (that's packages/docs)
- Test coverage details
- Git history

## Keeping Docs Current

Use `/lf:docs-update` after significant changes to:

- Add new modules to package docs
- Update architecture flows
- Note new patterns or decisions

Don't update for:

- Test-only changes
- Dependency bumps
- Formatting fixes
- Internal refactors

## For Future Claude Sessions

When you read these docs:

1. Start with `Overview.md` for the big picture
2. Dive into specific package/architecture docs as needed
3. Check `.metadata/monorepo-structure.json` for current structure
4. The `updated:` date in frontmatter shows freshness

When you update these docs:

1. Preserve existing content unless explicitly removing
2. Add new sections rather than rewriting
3. Update the `updated:` date
4. Cross-reference related docs
