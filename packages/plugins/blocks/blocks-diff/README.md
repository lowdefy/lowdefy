# Lowdefy Diff Blocks

Lowdefy blocks for rendering human-readable diffs between a `before` and an `after` object.

Four blocks, one per visual mode:

- `DiffList` — changes grouped by top-level key in a tabular layout.
- `DiffSideBySide` — before / after columns.
- `DiffTimeline` — a vertical audit-trail timeline.
- `DiffGit` — unified YAML patch with `+` / `-` line markers.

All four share a common diff engine built on [microdiff](https://www.npmjs.com/package/microdiff) and render via Ant Design primitives (requires `antd >= 6`).

## Example

```yaml
name: my-app
lowdefy: 3.12.3
pages:
  - id: audit
    type: PageHeaderMenu
    blocks:
      - id: profile_diff
        type: DiffList
        properties:
          title: Profile updated
          before:
            name: Sarah Johnson
            role: member
          after:
            name: Sarah Johnson
            role: admin
```

## More Lowdefy resources

- Getting started with Lowdefy — https://docs.lowdefy.com/tutorial-start
- Lowdefy docs — https://docs.lowdefy.com
- Lowdefy website — https://lowdefy.com
- Community forum — https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests — https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
