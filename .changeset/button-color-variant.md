---
'@lowdefy/blocks-antd': major
---

Replace Button `type`/`danger` properties with `color`/`variant` to match antd v6 API.

**Migration:**

| Old             | New                                |
| --------------- | ---------------------------------- |
| `type: primary` | `color: primary`, `variant: solid` |
| `type: dashed`  | `variant: dashed`                  |
| `type: text`    | `variant: text`                    |
| `type: link`    | `variant: link`                    |
| `danger: true`  | `color: danger`                    |
