# DiffGit

`DiffGit` renders a unified-diff YAML patch between the `before` and `after` objects, with `+` and `-` line prefixes and coloured backgrounds (green for additions, red for removals). Uses stable key-sorted YAML serialisation so the patch output is deterministic. Supports `hide` / `show` glob filtering to strip sensitive or noisy paths before serialising.

```yaml
- id: diff_git_order
  type: DiffGit
  properties:
    title: Order patch
    before:
      order:
        status: pending
        total: 10
        notes:
          - draft
    after:
      order:
        status: paid
        total: 15
        notes:
          - draft
          - sent
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `before` | object \| array \| null | - | Previous state. Rendered as stable-sorted YAML; null / undefined serialises to an empty string. |
| `after` | object \| array \| null | - | New state. Rendered as stable-sorted YAML; null / undefined serialises to an empty string. |
| `title` | string | - | Optional title rendered above the patch. Supports html. |
| `emptyText` | string | `"No changes"` | Unused by DiffGit — the renderer always emits its YAML patch output. |
| `hide` | array | - | Patterns to strip before serialising to YAML. Each entry is an exact dotted path (e.g. `user.email`), a `prefix.*` prefix match, or a `*.leaf` tail match. |
| `show` | array | - | Allowlist of paths to keep. Same pattern syntax as `hide`. Applied before `hide`. |
| `theme` | object | - | Antd Descriptions design token overrides. See [antd design tokens](https://ant.design/components/descriptions#design-token). See [Ant Design descriptions tokens](https://ant.design/components/descriptions#design-token). |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The DiffGit wrapper element. |
| `/title` | The DiffGit title. |
| `/group` | The pre element containing the unified diff output. |

No slots defined.
