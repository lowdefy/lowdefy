# ClickableHtml

Render raw HTML content safely, and fire a named event when an element carrying a `data-event` attribute is clicked: `data-event="onEditClick"` fires the block's `onEditClick` event, so every clickable target in one block of markup gets its own action chain without a block per button. The event object holds the element's other `data-*` attributes with snake_case keys (`data-record-id` becomes `record_id`).

```yaml
- id: buttons_basic
  type: ClickableHtml
  properties:
    html: '<p>Pick a size: <button data-event="onSmallClick">Small</button> <button
      data-event="onLargeClick">Large</button></p>'
  events:
    onSmallClick:
      - id: set_small
        type: SetState
        params:
          buttons_basic_selected: small
    onLargeClick:
      - id: set_large
        type: SetState
        params:
          buttons_basic_selected: large
- id: buttons_basic_result
  type: Html
  properties:
    html:
      _string.concat:
        - "<p>State: <code>"
        - _state:
            key: buttons_basic_selected
            default: nothing yet
        - </code></p>
```

```yaml
- id: list_rows
  type: ClickableHtml
  properties:
    html: '<ul style="list-style: none; padding: 0; margin: 0;"><li
      data-event="onRowClick" data-record-id="rec_1" style="padding: 8px;
      cursor: pointer; border-bottom: 1px solid var(--ant-color-border);">First
      record</li><li data-event="onRowClick" data-record-id="rec_2"
      style="padding: 8px; cursor: pointer; border-bottom: 1px solid
      var(--ant-color-border);">Second record</li><li data-event="onRowClick"
      data-record-id="rec_3" style="padding: 8px; cursor: pointer;">Third
      record</li></ul>'
  events:
    onRowClick:
      - id: set_clicked
        type: SetState
        params:
          list_rows_clicked:
            _event: true
- id: list_rows_result
  type: Html
  properties:
    html:
      _string.concat:
        - "<p>Last event: <code>"
        - _json.stringify:
            _state:
              key: list_rows_clicked
              default: {}
        - </code></p>
```

```yaml
- id: mixed_content
  type: ClickableHtml
  properties:
    html: <p>This <a href="https://lowdefy.com" target="_blank">link</a> navigates
      normally, but <a href="#" data-event="onCommentClick"
      data-thread-id="t_9">this one</a> fires onCommentClick instead.</p>
  events:
    onCommentClick:
      - id: set_mixed
        type: SetState
        params:
          mixed_content_thread:
            _event: thread_id
- id: mixed_content_result
  type: Html
  properties:
    html:
      _string.concat:
        - "<p>Thread: <code>"
        - _state:
            key: mixed_content_thread
            default: none
        - </code></p>
```

```yaml
- id: style_card
  type: ClickableHtml
  style:
    .element:
      padding: 16
      borderRadius: 8
      border: 1px solid var(--ant-color-border)
      background: var(--ant-color-bg-container)
  properties:
    html: '<h4 style="margin: 0 0 8px 0;">Card</h4><p style="margin: 0 0 8px 0;
      color: var(--ant-color-text-secondary);">Yours to change or remove until
      tomorrow.</p><button data-event="onEditClick">Edit</button> <button
      data-event="onRemoveClick">Remove</button>'
  events:
    onEditClick:
      - id: set_card_edit
        type: SetState
        params:
          style_card_action: edit
    onRemoveClick:
      - id: set_card_remove
        type: SetState
        params:
          style_card_action: remove
```

```yaml
- id: row_actions
  type: ClickableHtml
  properties:
    html: '<p>Invoice INV-042 <i data-icon="edit" data-event="onEdit" data-id="42"
      data-tooltip="Edit" style="cursor: pointer"></i> <span data-popover="more"
      style="cursor: pointer"><i data-icon="more-vertical"></i></span></p><div
      data-popover-content="more" hidden><p data-event="onDuplicate"
      data-id="42" style="cursor: pointer; margin: 0 0 8px"><i
      data-icon="copy"></i> Duplicate</p><p data-event="onDelete" data-id="42"
      style="cursor: pointer; margin: 0; color: var(--ant-color-error)"><i
      data-icon="delete"></i> Delete</p></div>'
  events:
    onEdit:
      - id: set_edit
        type: SetState
        params:
          row_actions_last:
            _string.concat:
              - "edit "
              - _event: id
    onDuplicate:
      - id: set_duplicate
        type: SetState
        params:
          row_actions_last:
            _string.concat:
              - "duplicate "
              - _event: id
    onDelete:
      - id: set_delete
        type: SetState
        params:
          row_actions_last:
            _string.concat:
              - "delete "
              - _event: id
- id: row_actions_result
  type: Html
  properties:
    html:
      _string.concat:
        - "<p>Last action: <code>"
        - _state:
            key: row_actions_last
            default: none yet
        - </code></p>
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `html` | string | - | Content to be rendered as Html. An element with a data-event attribute fires the event it names when clicked (data-event="onEditClick" fires events.onEditClick), and its default browser action is prevented. The event object holds the element's other data-* attributes with snake_case keys, so data-event="onEditClick" data-record-id="42" gives { record_id: "42" }. Targets that are not links or buttons become keyboard focusable, and Enter or Space clicks them. A data-event inside popover content fires too, then closes the popover. A link with data-event fires the event and does not navigate. All Html block attributes work too: data-icon, data-tooltip, data-popover, data-page-id links, data-new-tab, data-tag, data-status, data-time, data-format, data-avatar and data-copy. See the HTML attributes docs page. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onTextSelection` | \- | Trigger action when text is selected and pass selected text to the event object. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Html element. |

No slots defined.
