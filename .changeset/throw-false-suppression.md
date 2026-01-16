---
'@lowdefy/build': minor
'@lowdefy/docs': minor
---

feat(build): Add ~ignoreBuildCheck: true flag to suppress build validation

**Build Validation Suppression (#1949)**

- New `~ignoreBuildCheck: true` property suppresses build-time validation errors and warnings
- Enables advanced patterns where references only exist at runtime (e.g., state registered by custom blocks via `methods.registerEvent`)
- Silent suppression - no log output when validation is skipped
- Non-traversing - only affects the object with the flag, not children or parents

**Use Cases:**
- Dynamic state references created at runtime by custom blocks
- Multi-app monorepos with conditional configurations
- Work-in-progress features during development

**Documentation:**
- User-facing docs added to references-and-templates concept page
- Internal architecture docs updated with implementation details
- Comprehensive test coverage (18 new tests)

**Example:**
```yaml
blocks:
  - id: custom_block
    type: CustomBlock
    properties:
      onClick:
        _state: dynamicState  # Created by block at runtime
        ~ignoreBuildCheck: true  # Suppress build validation
```
