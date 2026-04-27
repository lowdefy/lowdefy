---
'@lowdefy/operators-js': minor
---

feat(\_string): Add `_string.format` for template-style string interpolation.

`_string.format` substitutes placeholders in a template string with values, accepting either a positional array form or a named object form. `null`/`undefined` values render as empty strings, which often makes `_if_none` unnecessary.

```yaml
# Positional placeholders
_string.format:
  - 'Updates ({0})'
  - _request: get_counts.0.update

# Named placeholders
_string.format:
  template: 'Updates ({count}) since {date}'
  on:
    count:
      _request: get_counts.0.update
    date:
      _date.format:
        - YYYY-MM-DD
        - _state: lastSync
```

Use `{{` / `}}` to include literal braces. Prefer `_string.format` over `_string.concat` for label-style interpolation, and use [`_nunjucks`](/_nunjucks) when you need conditionals, loops, or filters.
