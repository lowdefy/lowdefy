---
'@lowdefy/docs': major
---

Docs app refactored for antd v6.

- Converted all block schema definitions from JSON to JS modules with structured property/event/method documentation.
- Added visual gallery pages for all 108 blocks with live rendered examples and code snippets.
- Created custom `_yaml_parse` and `_yaml_stringify` operators for YAML handling in docs examples.
- Applied antd v6 style codemods across all page templates and example configurations.
- Updated block documentation templates (Nunjucks) to generate gallery and schema pages from JS modules.
