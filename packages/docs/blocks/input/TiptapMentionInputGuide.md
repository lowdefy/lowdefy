## Group mentions

Beyond the flat mention list, `TiptapMentionInput` can treat some mention options as **groups** — an app-defined kind such as a role, a team, a queue, or a saved segment. A group mention:

- sits under its own heading in the suggestion menu (`tag.section`),
- renders as a distinctly coloured chip (`tag.color`), and
- shows the group's current members in a hover popover in the live editor (`mentions.groupMembers`).

The block hardcodes no group. Your app decides which groups exist, what they are called, how they are coloured, and who belongs to them — the block only reflects that data onto the chip and the menu.

### Presentation lives on `tag`, storage lives on `value`

Each mention option is an object of the form `{ label, value, tag }`:

- `label` — the text matched against what the author types (unchanged).
- `value` — the **opaque payload** stored on the mention node and emitted in the block's `mentions` value. Its shape is entirely yours; the block never reads it for presentation.
- `tag` — the presentation fields the block reads to render the chip and menu.

All group behaviour is driven from `tag`, never from `value`. This keeps `value` free to hold whatever your app needs to expand the mention later (a role slug, a queue id, a segment query), while the block stays a pure presentation layer.

The `tag` fields are not listed in the properties table above, because `options` has no per-item schema. They are:

| Field         | Purpose                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tag.title`   | Chip text — `@Finance` renders from `tag.title: Finance`. Falls back to `label`.                                    |
| `tag.section` | Menu heading this option sits under. Options without a section render flat, with no heading.                        |
| `tag.group`   | Marks this option a **group** chip. An opaque, app-defined string — it becomes the chip class, the `data-mention-group` attribute, and the hover lookup key. |
| `tag.color`   | Chip colour for this option (any CSS colour). Inlined on the chip, so it travels with the saved HTML.                |

An individual-person option simply omits `section`, `group`, and `color`, and renders exactly as before.

Sections and groups are **orthogonal**: a section is a menu heading, a group is a chip identity. You may put several group options under one "Roles" section, give each group its own section, or use sections purely to group people with no group chips at all.

### `mentions.limit`

`limit` (integer, default `5`) caps how many suggestions the menu shows. When at least one visible option declares a `tag.section`, the cap is applied **per section**, so a large "People" section can't crowd every "Roles" option out of the list. When no option declares a section, the same limit caps the flat list, matching the pre-group behaviour.

### Group chip colour

A group chip's colour comes from `tag.color` on the option — any CSS colour string:

```yaml
options:
  - label: Finance
    value: { role: finance-admin }
    tag: { section: Roles, group: finance, color: '#722ed1' }
  - label: Developers
    value: { role: developer }
    tag: { section: Roles, group: devs, color: '#13c2c2' }
```

The colour is written as an inline `style` on the chip, so it travels with the saved HTML — a group chip looks right anywhere the stored content is rendered, with no per-app stylesheet. Because `tag.color` rides on the selected option, it is always current even when options load from a request. If you prefer to control colour from CSS instead, omit `tag.color` and target `.tiptap-mention-group[data-mention-group="finance"]` in your own stylesheet.

### `mentions.groupMembers` — may be async

`groupMembers` is a `{ '<group>': [{ name, email }] }` map. Hovering a group chip in the **live editor** shows a popover listing that group's current members:

```yaml
mentions:
  groupMembers:
    finance:
      - { name: Jane Doe, email: jane@example.com }
    devs:
      - { name: Ada Lovelace, email: ada@example.com }
```

`groupMembers` **may be loaded from a request** — it is read live, at hover time, so it does not need to be present when the block mounts. (This is the one piece of group data read on each hover rather than captured up front.)

Hover is scoped to the live editor only. If the group has no entry in `groupMembers`, no popover shows.

### `getHref` — nullish renders a `<span>`

`getHref` is an optional `_function` that receives the selected option and returns an href. Its **return value** decides the element:

- a non-nullish return renders the mention as an `<a>`;
- a nullish return (`null`/`undefined`) renders a plain `<span>`.

Return `null` for group options — a group has no profile page — and a URL for people.

> Return `null` or `undefined`, **not** an empty string. `''` is not nullish, so `getHref` returning `''` still renders `<a href="">`.

### Emitted chip markup

A group chip renders as:

```html
<span class="tiptap-mention tiptap-mention-group" data-mention-group="finance" style="color: #722ed1">@Finance</span>
```

(or an `<a>` with the same classes and attributes when `getHref` returns a link). The colour is inlined via `style`, and the group key is exposed as `data-mention-group`. An app that renders saved comment HTML elsewhere — a comment timeline, a notification email — can style these chips or attach its own hover behaviour by targeting the `data-mention-group` attribute. The block's own hover popover is live-editor-only, so any hover on saved content is the app's to build against the same attribute.

### Worked example

A mixed `options` array — people alongside group options carrying `tag.section`, `tag.group`, and `tag.color` — a `groupMembers` map, and a `getHref` that returns a link for people and nothing for groups:

```yaml
- id: comment
  type: TiptapMentionInput
  properties:
    mentions:
      char: '@'
      limit: 8 # per-section result cap
      # people carry value.href → <a>; groups omit it → nullish → <span>
      getHref:
        _function:
          __args: 0.value.href
      options:
        - label: Jane Doe # person — no tag.group, links to a profile
          value:
            contact_id: c_001
            href: '/contacts?_id=c_001'
          tag:
            section: People
        - label: Ada Lovelace
          value:
            contact_id: c_002
            href: '/contacts?_id=c_002'
          tag:
            section: People
        - label: Finance # group — no href, coloured chip, hover members
          value:
            type: role
            role: finance-admin
          tag:
            section: Roles
            group: finance
            color: '#722ed1'
        - label: Developers
          value:
            type: role
            role: developers
          tag:
            section: Roles
            group: devs
            color: '#13c2c2'
      groupMembers: # shown on chip hover in the live editor; may come from a request
        finance:
          - { name: Jane Doe, email: jane@example.com }
        devs:
          - { name: Ada Lovelace, email: ada@example.com }
```

`options` and `groupMembers` are typically populated from requests (`_request: mention_options`, `_request: group_members`). How that data is built, and how the stored `value` is later expanded to notification recipients, are entirely app-side — the block only records the mention. If a group's colour is itself dynamic, it rides safely on `tag.color` because that value is stored on the selected option.
