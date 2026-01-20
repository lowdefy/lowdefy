---
'@lowdefy/build': patch
---

Improve build error handling and test infrastructure:
- Stop build after schema validation errors to prevent cascading failures
- Convert makeId to class with reset() method for reliable test isolation
- Add parseTestYaml helper for realistic YAML-based test fixtures
- Simplify buildConnections by removing duplicate validations handled by schema
- Fix addKeys to not store undefined values in keyMap
