---
'@lowdefy/blocks-native': minor
---

feat: Native link chips match app paths by `pattern`, not only a scheme

A `linkChips` entry on `Markdown`, `AgentChat` and `ActivityTimeline` can take a `pattern` in place of a `scheme`: a regular expression tested against the link's address, so record links an agent writes as app paths draw as chips.

```yaml
linkChips:
  - pattern: '^/ACME/tasks/(?<key>ACME-\d+)$'
    icon: CircleCheck
    tone: primary
```

`[ACME-647 (Fix broken menu URL)](/ACME/tasks/ACME-647)` draws as a chip with the key `ACME-647` (the `key` group, or else the first group) and the title `Fix broken menu URL`, without the brackets. A new `label` option shows `keyAndTitle` (the default), the `key` alone, or the link `text` as written. A pressed chip goes through the same handler as any link: `onLinkPress` on Markdown, `onLinkClick` or the Link action on AgentChat.
