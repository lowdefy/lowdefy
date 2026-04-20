---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add `DataDiff` block for rendering user-friendly diffs.

`DataDiff` compares two objects (`before` / `after`) and renders the differences using antd primitives (`Descriptions`, `Collapse`, `Tag`, `Empty`). v1 ships a polished `list` mode: grouped by top-level key, with `+N` / `−N` / `~N` summary chips per group, icon- and color-coded change rows, and a collapsed-JSON fallback for entirely-new nested objects. All colors come from antd semantic tokens (`colorSuccess`, `colorError`, `colorWarning`) so the block respects dark mode and `theme` overrides automatically.

Per-path value formatters — `date`, `datetime`, `boolean` (Yes/No tag), `currency` (Intl.NumberFormat), `json` (pretty inside a subtle collapse), `code`, and `enum` (value → `{ label, color }` map) — turn raw field values into something end-users can read. `labels` maps dotted paths to display names; `hide` / `show` accept exact paths, `prefix.*`, or `*.leaf` patterns. Built on `microdiff` (~1 kB, zero deps).

```yaml
- id: order_audit
  type: DataDiff
  properties:
    before: _state.original
    after: _state.current
    labels:
      status: Order status
      total: Total
    format:
      total: { type: currency, currency: USD }
      status:
        type: enum
        map:
          pending: { label: Pending, color: warning }
          paid: { label: Paid, color: success }
    hide:
      - 'internal.*'
```
