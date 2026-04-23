---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Expose `selector` cssKey on Select-based blocks.

`Selector`, `MultipleSelector`, and `AutoComplete` now expose a `selector` cssKey that targets the inner tag/value container (antd v6's `content` semantic slot, rendered as `.ant-select-content` in the DOM). Use it to cap the tag container height and enable internal scroll on multi-select blocks:

```yaml
style:
  .selector:
    maxHeight: 96px
    overflowY: auto
```

Before this change, users had to reach for Tailwind arbitrary variants or global CSS (e.g. `[&_.ant-select-selector]:max-h-24`) to style the inner container, which leaked antd internals into app YAML and was brittle across antd upgrades.
