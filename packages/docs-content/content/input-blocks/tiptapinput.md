# TiptapInput

Rich-text editor built on TipTap. Supports bold, italic, strike-through, highlights, headings, lists, tables, links, and drag/drop or paste image uploads via a configurable upload-policy request (`uploadPolicyRequestId`) — any storage provider (S3, GCS, Azure). Configure `downloadPolicyRequestId` to resolve inserted image URLs through a download request.

```yaml
- id: tiptap_default
  type: TiptapInput
  properties:
    title: Notes
    placeholder: Start typing here. Try **bold**, *italic*, or headings.
```

```yaml
tiptap_default:
  _state: tiptap_default
```

```yaml
- id: tiptap_prepopulated
  type: TiptapInput
  events:
    onMount:
      - id: tiptap_prepopulated_set
        type: SetState
        params:
          tiptap_prepopulated:
            html: >
              <h2>What's new</h2> <p>Highlights from this release:</p> <ul>
                <li>Rich-text editor built on <a href="https://tiptap.dev">TipTap</a></li>
                <li>Drag-and-drop image uploads</li>
                <li>Inline <strong>bold</strong>, <em>italic</em>, and <mark>highlights</mark></li>
              </ul> <blockquote><p>Pair it with a TextArea when you need a
              simple fallback.</p></blockquote>
  properties:
    title: Release notes
```

```yaml
tiptap_prepopulated:
  _state: tiptap_prepopulated
```

```yaml
- id: tiptap_disabled
  type: TiptapInput
  events:
    onMount:
      - id: tiptap_disabled_set
        type: SetState
        params:
          tiptap_disabled:
            html: <p>This editor is disabled and cannot be edited.</p>
  properties:
    title: Read only
    disabled: true
```

```yaml
tiptap_disabled:
  _state: tiptap_disabled
```

```yaml
- id: tiptap_borderless
  type: TiptapInput
  properties:
    title: Borderless editor
    bordered: false
    placeholder: No border, just content.
```

```yaml
tiptap_borderless:
  _state: tiptap_borderless
```

```yaml
- id: tiptap_rows_2
  type: TiptapInput
  properties:
    title: Short note
    placeholder: Exactly 2 rows tall.
    rows: 2
```

```yaml
tiptap_rows_2:
  _state: tiptap_rows_2
```

```yaml
- id: tiptap_autosize_range
  type: TiptapInput
  properties:
    title: Grows between 2 and 5 rows
    placeholder: Keep typing — scrolls past 5 rows.
    autoSize:
      minRows: 2
      maxRows: 5
```

```yaml
tiptap_autosize_range:
  _state: tiptap_autosize_range
```

```yaml
- id: tiptap_validation
  type: TiptapInput
  required: true
  properties:
    title: Release notes (required)
    placeholder: Type at least 10 characters, then click Validate.
    rows: 3
  validate:
    - status: error
      message: Release notes must be at least 10 characters.
      pass:
        _gte:
          - _string.length:
              _state: tiptap_validation.text
          - 10
- id: tiptap_validation_button
  type: Button
  properties:
    title: Validate
  events:
    onClick:
      - id: tiptap_validation_run
        type: Validate
        params:
          - tiptap_validation
```

```yaml
- id: tiptap_validation
  type: TiptapInput
  required: true
  properties:
    title: Release notes (required)
    placeholder: Type at least 10 characters, then click Validate.
    rows: 3
  validate:
    - status: error
      message: Release notes must be at least 10 characters.
      pass:
        _gte:
          - _string.length:
              _state: tiptap_validation.text
          - 10
- id: tiptap_validation_button
  type: Button
  properties:
    title: Validate
  events:
    onClick:
      - id: tiptap_validation_run
        type: Validate
        params:
          - tiptap_validation
```

```yaml
tiptap_validation:
  _state: tiptap_validation
tiptap_validation_button:
  _state: tiptap_validation_button
```

```yaml
- id: tiptap_autosize_true
  type: TiptapInput
  properties:
    title: Unconstrained
    placeholder: No height cap.
    autoSize: true
```

```yaml
tiptap_autosize_true:
  _state: tiptap_autosize_true
```

```yaml
- id: tiptap_minimal
  type: TiptapInput
  properties:
    title: Plain note
    placeholder: Bold/italic/lists only.
    image:
      disabled: true
    table:
      disabled: true
    highlight:
      disabled: true
```

```yaml
tiptap_minimal:
  _state: tiptap_minimal
```

```yaml
- id: tiptap_starterkit
  type: TiptapInput
  properties:
    title: Short-form
    placeholder: No code block or blockquote.
    starterKit:
      codeBlock: false
      blockquote: false
      horizontalRule: false
```

```yaml
tiptap_starterkit:
  _state: tiptap_starterkit
```

```yaml
- id: tiptap_with_table
  type: TiptapInput
  events:
    onMount:
      - id: tiptap_with_table_set
        type: SetState
        params:
          tiptap_with_table:
            html: |
              <h3>Weekly sync</h3> <p>Schedule for today's meeting:</p> <table>
                <thead>
                  <tr><th>Time</th><th>Topic</th><th>Owner</th></tr>
                </thead>
                <tbody>
                  <tr><td>09:00</td><td>Kickoff</td><td>Alice</td></tr>
                  <tr><td>09:15</td><td>Review last week</td><td>Bob</td></tr>
                  <tr><td>09:45</td><td>This week's plan</td><td>Carol</td></tr>
                  <tr><td>10:00</td><td>Wrap-up</td><td>Alice</td></tr>
                </tbody>
              </table> <p>Notes:</p> <ul>
                <li>Bring the latest metrics</li>
                <li>Send follow-ups within 24h</li>
              </ul>
  properties:
    title: Agenda
```

```yaml
tiptap_with_table:
  _state: tiptap_with_table
```

```yaml
- id: tiptap_links
  type: TiptapInput
  events:
    onMount:
      - id: tiptap_links_set
        type: SetState
        params:
          tiptap_links:
            html: <p>Visit <a href="https://lowdefy.com">lowdefy.com</a> or type a URL and
              press space.</p>
  properties:
    title: Open links in place
    link:
      openOnClick: false
```

```yaml
tiptap_links:
  _state: tiptap_links
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowedMimeTypes` | array | - | Mime-types accepted by the drag/drop and paste file handler. Defaults to common image types (jpeg, png, gif, webp). Only used when uploadPolicyRequestId is set. |
| `autoSize` | boolean \| object | - | Either a boolean (true to auto-grow without a cap) or an object with minRows/maxRows. Ignored when `rows` is set. |
| `autoSize.minRows` | integer | - | Minimum visible rows before content overflows. |
| `autoSize.maxRows` | integer | - | Maximum visible rows; beyond this the editor scrolls vertically. |
| `bordered` | boolean | `true` | Whether the editor renders with a border. |
| `disabled` | boolean | `false` | Render the editor as read-only. |
| `highlight` | object | - | Text highlight extension settings. |
| `highlight.disabled` | boolean | `false` | Disable the Highlight extension and its bubble-menu color swatches. |
| `highlight.multicolor` | boolean | `true` | Allow highlights to carry a color value. Disable for single-color. |
| `image` | object | - | Image extension settings. |
| `image.disabled` | boolean | `false` | Disable the Image extension. |
| `image.maxWidth` | string | `"80%"` | Inline CSS max-width applied to inserted images. |
| `image.zoom` | number | `0.5` | Inline CSS zoom factor applied to inserted images. |
| `inputStyle` | object | - | Inline style applied to the editable area of the editor. |
| `label` | object | - | Label configuration forwarded to the Lowdefy Label block. |
| `link` | object | - | Link extension settings. |
| `link.disabled` | boolean | `false` | Disable the Link extension. |
| `link.autolink` | boolean | `true` | Auto-convert URLs typed in the editor to links. |
| `link.linkOnPaste` | boolean | `true` | Convert pasted URLs to links. |
| `link.openOnClick` | boolean | `true` | Open links in a new tab when clicked in view mode. |
| `link.defaultProtocol` | string | `"https"` | Protocol prefixed to URLs that omit one (e.g. "https"). |
| `placeholder` | string | - | Placeholder shown when the editor is empty. |
| `rows` | integer | - | Fix the editor height to exactly this many rows. Takes precedence over autoSize. |
| `downloadPolicyRequestId` | string | - | Id of a download request (e.g. AwsS3PresignedGetObject) used to resolve the inserted image URL after upload. Inline images persist in saved content, so the request should set public: true (and the upload request the provider public-read acl) to return a stable, non-expiring URL. When unset, a legacy unsigned object URL is constructed from the upload response (S3-shaped, deprecated). |
| `s3PostPolicyRequestId` | string | - | Deprecated — use uploadPolicyRequestId instead. |
| `uploadPolicyRequestId` | string | - | Id of an upload-policy request (e.g. AwsS3PresignedPostPolicy, GcsSignedPostPolicy, AzureBlobUploadSas). When set, images dragged or pasted into the editor are uploaded via that request and inserted as  nodes. Leave unset to disable image uploads. |
| `size` | string | - | Label size forwarded to the Label block. Enum: `small`, `middle`, `large`. |
| `starterKit` | object | - | Options forwarded to TipTap StarterKit (https://tiptap.dev/docs/editor/extensions/functionality/starterkit). Use this to disable bundled extensions (e.g. {heading: false, codeBlock: false}). |
| `table` | object | - | Table extension settings. |
| `table.disabled` | boolean | `false` | Disable the Table extension and its row/header/cell nodes. |
| `table.resizable` | boolean | `true` | Allow column resizing with a drag handle. |
| `title` | string | - | Label title shown above the editor. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | \- | Trigger action when the editor content is changed. |

No CSS keys defined.

No slots defined.
