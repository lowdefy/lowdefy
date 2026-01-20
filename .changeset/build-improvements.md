---
'@lowdefy/build': patch
'@lowdefy/engine': patch
---

Improve build error handling and test infrastructure:
- Stop build after schema validation errors to prevent cascading failures
- Convert makeId to class with reset() method for reliable test isolation
- Add parseTestYaml helper for realistic YAML-based test fixtures
- Simplify buildConnections by removing duplicate validations handled by schema
- Fix addKeys to not store undefined values in keyMap
- Menu link to missing page is warning in dev, error in prod
- Handle areas with no blocks gracefully - render as empty page instead of crashing
- Filter out anyOf/oneOf cascade errors in schema validation - only show the specific error
