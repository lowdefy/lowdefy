# TiptapMentionInput

Rich-text editor with @-mention support. Same feature set as TiptapInput, plus a mention dropdown populated from a static options list or a request. Mention options can be marked as groups (roles, teams, queues) to render under their own menu section, as distinctly coloured chips, and with a hover popover listing the group's current members. See the guide below.

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

```yaml
- id: tiptap_mention_default
  type: TiptapMentionInput
  properties:
    title: Ticket note
    placeholder: Type @ to mention someone.
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
            name: Alice
        - label: Bob
          value:
            _id: user_2
            name: Bob
        - label: Carol
          value:
            _id: user_3
            name: Carol
```

```yaml
- id: tiptap_mention_default
  type: TiptapMentionInput
  properties:
    title: Ticket note
    placeholder: Type @ to mention someone.
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
            name: Alice
        - label: Bob
          value:
            _id: user_2
            name: Bob
        - label: Carol
          value:
            _id: user_3
            name: Carol
```

```yaml
tiptap_mention_default:
  _state: tiptap_mention_default
```

```yaml
- id: tiptap_mention_prepopulated
  type: TiptapMentionInput
  events:
    onMount:
      - id: tiptap_mention_prepopulated_set
        type: SetState
        params:
          tiptap_mention_prepopulated:
            html: >
              <p>Thanks <span class="tiptap-mention">@Alice</span> for the
              review. Assigning follow-up to <span
              class="tiptap-mention">@Bob</span>.</p>
  properties:
    title: Ticket summary
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
```

```yaml
- id: tiptap_mention_prepopulated
  type: TiptapMentionInput
  events:
    onMount:
      - id: tiptap_mention_prepopulated_set
        type: SetState
        params:
          tiptap_mention_prepopulated:
            html: >
              <p>Thanks <span class="tiptap-mention">@Alice</span> for the
              review. Assigning follow-up to <span
              class="tiptap-mention">@Bob</span>.</p>
  properties:
    title: Ticket summary
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
```

```yaml
tiptap_mention_prepopulated:
  _state: tiptap_mention_prepopulated
```

```yaml
- id: tiptap_mention_hashtags
  type: TiptapMentionInput
  properties:
    title: Tag the ticket
    placeholder: "Type # to add a tag."
    mentions:
      char: "#"
      allowSpaces: false
      options:
        - label: bug
          value:
            _id: tag_bug
        - label: feature
          value:
            _id: tag_feature
        - label: needs-triage
          value:
            _id: tag_triage
```

```yaml
- id: tiptap_mention_hashtags
  type: TiptapMentionInput
  properties:
    title: Tag the ticket
    placeholder: "Type # to add a tag."
    mentions:
      char: "#"
      allowSpaces: false
      options:
        - label: bug
          value:
            _id: tag_bug
        - label: feature
          value:
            _id: tag_feature
        - label: needs-triage
          value:
            _id: tag_triage
```

```yaml
tiptap_mention_hashtags:
  _state: tiptap_mention_hashtags
```

```yaml
- id: tiptap_mention_links
  type: TiptapMentionInput
  properties:
    title: Link mentions to profile pages
    placeholder: Type @ — selections render as <a>.
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
      getHref:
        _function:
          __string.concat:
            - /users/
            - __args: 0.value._id
```

```yaml
- id: tiptap_mention_links
  type: TiptapMentionInput
  properties:
    title: Link mentions to profile pages
    placeholder: Type @ — selections render as <a>.
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
      getHref:
        _function:
          __string.concat:
            - /users/
            - __args: 0.value._id
```

```yaml
tiptap_mention_links:
  _state: tiptap_mention_links
```

```yaml
- id: tiptap_mention_autosize
  type: TiptapMentionInput
  properties:
    title: Grows between 2 and 5 rows
    placeholder: Type @ to mention. Scrolls past 5 rows.
    autoSize:
      minRows: 2
      maxRows: 5
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
```

```yaml
- id: tiptap_mention_autosize
  type: TiptapMentionInput
  properties:
    title: Grows between 2 and 5 rows
    placeholder: Type @ to mention. Scrolls past 5 rows.
    autoSize:
      minRows: 2
      maxRows: 5
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
```

```yaml
tiptap_mention_autosize:
  _state: tiptap_mention_autosize
```

```yaml
- id: tiptap_mention_validation
  type: TiptapMentionInput
  required: true
  properties:
    title: Mention a teammate (required)
    placeholder: Type @ and pick someone, then click Validate.
    rows: 3
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
  validate:
    - status: error
      message: Please mention at least one teammate.
      pass:
        _gt:
          - _string.length:
              _state: tiptap_mention_validation.text
          - 0
- id: tiptap_mention_validation_button
  type: Button
  properties:
    title: Validate
  events:
    onClick:
      - id: tiptap_mention_validation_run
        type: Validate
        params:
          - tiptap_mention_validation
```

```yaml
- id: tiptap_mention_validation
  type: TiptapMentionInput
  required: true
  properties:
    title: Mention a teammate (required)
    placeholder: Type @ and pick someone, then click Validate.
    rows: 3
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
  validate:
    - status: error
      message: Please mention at least one teammate.
      pass:
        _gt:
          - _string.length:
              _state: tiptap_mention_validation.text
          - 0
- id: tiptap_mention_validation_button
  type: Button
  properties:
    title: Validate
  events:
    onClick:
      - id: tiptap_mention_validation_run
        type: Validate
        params:
          - tiptap_mention_validation
```

```yaml
tiptap_mention_validation:
  _state: tiptap_mention_validation
tiptap_mention_validation_button:
  _state: tiptap_mention_validation_button
```

```yaml
- id: tiptap_mention_disabled
  type: TiptapMentionInput
  events:
    onMount:
      - id: tiptap_mention_disabled_set
        type: SetState
        params:
          tiptap_mention_disabled:
            html: '<p>Mentions render inline: <span
              class="tiptap-mention">@Alice</span>.</p>'
  properties:
    title: Read only
    disabled: true
```

```yaml
tiptap_mention_disabled:
  _state: tiptap_mention_disabled
```

```yaml
- id: tiptap_mention_sectioned
  type: TiptapMentionInput
  properties:
    title: Mention people or roles
    placeholder: Type @ — options are grouped, each section capped at 3.
    mentions:
      limit: 3
      options:
        - label: Alice
          value:
            _id: user_1
          tag:
            section: People
        - label: Bob
          value:
            _id: user_2
          tag:
            section: People
        - label: Carol
          value:
            _id: user_3
          tag:
            section: People
        - label: Dave
          value:
            _id: user_4
          tag:
            section: People
        - label: Finance
          value:
            _id: role_finance
          tag:
            section: Roles
        - label: Developers
          value:
            _id: role_devs
          tag:
            section: Roles
```

```yaml
- id: tiptap_mention_sectioned
  type: TiptapMentionInput
  properties:
    title: Mention people or roles
    placeholder: Type @ — options are grouped, each section capped at 3.
    mentions:
      limit: 3
      options:
        - label: Alice
          value:
            _id: user_1
          tag:
            section: People
        - label: Bob
          value:
            _id: user_2
          tag:
            section: People
        - label: Carol
          value:
            _id: user_3
          tag:
            section: People
        - label: Dave
          value:
            _id: user_4
          tag:
            section: People
        - label: Finance
          value:
            _id: role_finance
          tag:
            section: Roles
        - label: Developers
          value:
            _id: role_devs
          tag:
            section: Roles
```

```yaml
tiptap_mention_sectioned:
  _state: tiptap_mention_sectioned
```

```yaml
- id: tiptap_mention_groups
  type: TiptapMentionInput
  properties:
    title: Mention people or groups
    placeholder: Type @ — groups render as coloured chips, people as links.
    mentions:
      groupMembers:
        finance:
          - name: Jane Doe
            email: jane@example.com
          - name: John Smith
            email: john@example.com
        devs:
          - name: Ada Lovelace
            email: ada@example.com
          - name: Alan Turing
            email: alan@example.com
      getHref:
        _function:
          __args: 0.value.href
      options:
        - label: Alice
          value:
            name: Alice
            href: /contacts?_id=user_1
          tag:
            section: People
        - label: Bob
          value:
            name: Bob
            href: /contacts?_id=user_2
          tag:
            section: People
        - label: Finance
          value:
            role: finance-admin
          tag:
            section: Roles
            group: finance
            color: "#722ed1"
        - label: Developers
          value:
            role: developer
          tag:
            section: Roles
            group: devs
            color: "#13c2c2"
```

```yaml
- id: tiptap_mention_groups
  type: TiptapMentionInput
  properties:
    title: Mention people or groups
    placeholder: Type @ — groups render as coloured chips, people as links.
    mentions:
      groupMembers:
        finance:
          - name: Jane Doe
            email: jane@example.com
          - name: John Smith
            email: john@example.com
        devs:
          - name: Ada Lovelace
            email: ada@example.com
          - name: Alan Turing
            email: alan@example.com
      getHref:
        _function:
          __args: 0.value.href
      options:
        - label: Alice
          value:
            name: Alice
            href: /contacts?_id=user_1
          tag:
            section: People
        - label: Bob
          value:
            name: Bob
            href: /contacts?_id=user_2
          tag:
            section: People
        - label: Finance
          value:
            role: finance-admin
          tag:
            section: Roles
            group: finance
            color: "#722ed1"
        - label: Developers
          value:
            role: developer
          tag:
            section: Roles
            group: devs
            color: "#13c2c2"
```

```yaml
tiptap_mention_groups:
  _state: tiptap_mention_groups
```

```yaml
- id: tiptap_mention_minimal
  type: TiptapMentionInput
  properties:
    title: Chat-style
    placeholder: Type @ to mention.
    image:
      disabled: true
    table:
      disabled: true
    highlight:
      disabled: true
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
```

```yaml
- id: tiptap_mention_minimal
  type: TiptapMentionInput
  properties:
    title: Chat-style
    placeholder: Type @ to mention.
    image:
      disabled: true
    table:
      disabled: true
    highlight:
      disabled: true
    mentions:
      options:
        - label: Alice
          value:
            _id: user_1
        - label: Bob
          value:
            _id: user_2
```

```yaml
tiptap_mention_minimal:
  _state: tiptap_mention_minimal
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowedMimeTypes` | array | - | Mime-types accepted by the drag/drop and paste file handler. Defaults to common image types. Only used when uploadPolicyRequestId is set. |
| `autoSize` | boolean \| object | - | Either a boolean (true to auto-grow without a cap) or an object with minRows/maxRows. Ignored when `rows` is set. |
| `autoSize.minRows` | integer | - |  |
| `autoSize.maxRows` | integer | - |  |
| `bordered` | boolean | `true` | Whether the editor renders with a border. |
| `disabled` | boolean | `false` | Render the editor as read-only. |
| `highlight` | object | - | Text highlight extension settings. |
| `highlight.disabled` | boolean | `false` |  |
| `highlight.multicolor` | boolean | `true` |  |
| `image` | object | - | Image extension settings. |
| `image.disabled` | boolean | `false` |  |
| `image.maxWidth` | string | `"80%"` |  |
| `image.zoom` | number | `0.6` |  |
| `inputStyle` | object | - | Inline style applied to the editable area of the editor. |
| `label` | object | - | Label configuration forwarded to the Lowdefy Label block. |
| `link` | object | - | Link extension settings. |
| `link.disabled` | boolean | `false` |  |
| `link.autolink` | boolean | `true` |  |
| `link.linkOnPaste` | boolean | `true` |  |
| `link.openOnClick` | boolean | `true` |  |
| `link.defaultProtocol` | string | `"https"` |  |
| `mentions` | object | - | Configure the set of mention targets and how they render. |
| `mentions.char` | string | `"@"` | Trigger character that opens the mention dropdown. Change to "#" for hashtags, etc. |
| `mentions.allowSpaces` | boolean | `true` | Allow spaces inside a mention query before it is committed. |
| `mentions.options` | array | - | Array of mention items. Each item may be a string, or an object with a "label" (matched against user input) and a "value" (stored on the node). |
| `mentions.getHref` | object | - | Optional _function that receives the selected mention option and returns an href. A non-nullish return renders the mention as an ; a nullish return renders a plain  (use this for options with no link, e.g. group mentions). |
| `mentions.limit` | integer | `5` | Maximum suggestions shown — per section when options declare sections, otherwise across the flat list. |
| `mentions.groupMembers` | object | - | Map of group key → array of { name, email } shown in a hover popover on that group's chips (live editor only). |
| `mentionsRequestId` | string | - | Id of a request used to populate mention options. When set, the block registers a __getTipTapMentions event that calls that request. |
| `placeholder` | string | - | Placeholder shown when the editor is empty. |
| `rows` | integer | - | Fix the editor height to exactly this many rows. Takes precedence over autoSize. |
| `downloadPolicyRequestId` | string | - | Id of a download request (e.g. AwsS3PresignedGetObject) used to resolve the inserted image URL after upload. Inline images persist in saved content, so the request should set public: true (and the upload request the provider public-read acl) to return a stable, non-expiring URL. When unset, a legacy unsigned object URL is constructed from the upload response (S3-shaped, deprecated). |
| `s3PostPolicyRequestId` | string | - | Deprecated — use uploadPolicyRequestId instead. |
| `uploadPolicyRequestId` | string | - | Id of an upload-policy request (e.g. AwsS3PresignedPostPolicy, GcsSignedPostPolicy, AzureBlobUploadSas). When set, images dragged or pasted into the editor are uploaded via that request. |
| `size` | string | - | Label size forwarded to the Label block. Enum: `small`, `middle`, `large`. |
| `starterKit` | object | - | Options forwarded to TipTap StarterKit. Use to disable bundled extensions (e.g. {heading: false}). |
| `table` | object | - | Table extension settings. |
| `table.disabled` | boolean | `false` |  |
| `table.resizable` | boolean | `true` |  |
| `title` | string | - | Label title shown above the editor. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | \- | Trigger action when the editor content is changed. |

No CSS keys defined.

No slots defined.
