---
'@lowdefy/build': minor
'@lowdefy/docs': minor
---

feat(build): Add ~ignoreBuildChecks property to suppress build validation

**Build Validation Suppression (#1949, #1963)**

- New `~ignoreBuildChecks` property suppresses build-time validation errors and warnings
- Supports `true` (suppress all) or array of specific check slugs (e.g., `['state-refs', 'types']`)
- Cascades to all descendant config objects - set on a page to suppress for all child blocks
- Silent suppression - no log output when validation is skipped (visible with `--log-level debug`)

> **Renamed:** Previously `~ignoreBuildCheck` (singular) - using the old name throws a helpful migration error.

**Available Check Slugs:**
- `state-refs`, `payload-refs`, `step-refs` - Reference validation warnings
- `link-refs`, `request-refs`, `connection-refs` - Action reference validation
- `types` - All type validation (blocks, operators, actions, etc.)
- `schema` - JSON schema validation errors

**Use Cases:**
- Dynamic state references created at runtime by custom blocks
- Multi-app monorepos with conditional configurations
- Work-in-progress features during development
- Plugin development with custom types not yet registered

**Example:**
```yaml
# Suppress all checks for this page and descendants
pages:
  - id: dynamic-page
    type: Box
    ~ignoreBuildChecks: true
    blocks:
      - id: block1
        type: TextInput
        properties:
          value:
            _state: dynamicField  # No warning

# Suppress only specific checks
blocks:
  - id: custom_block
    type: CustomBlock
    ~ignoreBuildChecks:
      - state-refs
      - types
    properties:
      onClick:
        _state: dynamicState  # No warning (state-refs suppressed)
```
