---
'@lowdefy/docs': major
---

Docs app refactored for antd v6.

- Converted all block schema definitions from JSON to JS modules with structured property/event/method documentation.
- Added visual gallery pages for all 108 blocks with live rendered examples and code snippets.
- Created custom `_yaml_parse` and `_yaml_stringify` operators for YAML handling in docs examples.
- Applied antd v6 style codemods across all page templates and example configurations.
- Updated migration guide covering all breaking changes.
- Rewrote block gallery pages for 70+ blocks with real-world examples, theme token overrides, style/CSS sections with Tailwind examples, and copy-to-clipboard.
- Gallery examples use `var(--ant-*)` tokens instead of hardcoded colors for dark mode compatibility.
