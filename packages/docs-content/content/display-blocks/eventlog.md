# EventLog

A dense, virtualised log viewer for any array of records - audit trails, job runs, deploys, webhook deliveries or application events. Rows are searchable, filtered by severity and expandable to a detail pane with the actor, a rich detail body and a flattened context key-value table that can be copied as JSON.

The block does not assume a record shape: the `fields` property maps dot paths onto each record, and `eventTypeConfig` maps an event type onto its label, icon, colour and severity. Severity is explicit - it is read from the `level` field of a record, or from the `level` of its type config, and is one of `error`, `warning`, `success` or `info` (default `info`).

Large logs can be pushed straight into the block with the `setData` method using a CallMethod action, so the records never round-trip through the operator pipeline. Every string rendered by the block is set on the `text` property, so the log can be translated.

## Setting records with `setData`

Call `setData` from the block's `onMount` event, after a Request action has loaded the
records. The page `onInit` event runs before the block mounts, so the method does not exist
yet. The block falls back to `properties.data` until `setData` is called. See
[Selectors](/selectors) for the same pattern on selector blocks.

```yaml
id: audit_log
type: EventLog
properties:
  height: 480
events:
  onMount:
    - id: load_events
      type: Request
      params: get_events
    - id: fill
      type: CallMethod
      params:
        blockId: audit_log
        method: setData
        args:
          - _request: get_events
```

```yaml
- id: basic_event_log
  type: EventLog
  properties:
    height: 320
    fields:
      id: id
      time: timestamp
      message: message
    data:
      - id: "1"
        timestamp: 2026-03-04T09:12:04.000Z
        type: deploy_failed
        level: error
        message: Deploy <b>web-api</b> failed on step build.
        description: The build step exited with code 1 after 42 seconds.
        metadata:
          commit: 9f2c1ab
          branch: main
          duration_ms: 42311
          error: Module not found - ./config/runtime.js
      - id: "2"
        timestamp: 2026-03-04T09:10:44.000Z
        type: deploy_started
        level: info
        message: Deploy <b>web-api</b> started.
        metadata:
          commit: 9f2c1ab
          branch: main
      - id: "3"
        timestamp: 2026-03-04T08:58:00.000Z
        type: quota_warning
        level: warning
        message: Request quota at 82% of the monthly limit.
        metadata:
          used: 820000
          limit: 1000000
      - id: "4"
        timestamp: 2026-03-04T08:30:12.000Z
        type: deploy_succeeded
        level: success
        message: Deploy <b>web-app</b> succeeded.
        metadata:
          commit: 3ab77de
          branch: main
          duration_ms: 51200
```

```yaml
- id: typed_event_log
  type: EventLog
  properties:
    height: 280
    fields:
      id: id
      time: timestamp
      message: message
    eventTypeConfig:
      user_invited:
        title: Invited
        icon: UserPlus
        color: "#1677ff"
        level: info
      user_removed:
        title: Removed
        icon: UserMinus
        color: "#ff4d4f"
        level: error
      role_changed:
        title: Role changed
        icon: Shield
        color: "#faad14"
        level: warning
    data:
      - id: "1"
        timestamp: 2026-03-04T11:02:00.000Z
        type: user_removed
        message: Removed <b>dana@example.com</b> from the workspace.
        created:
          user:
            name: Ada Lowe
        metadata:
          reason: Offboarding
      - id: "2"
        timestamp: 2026-03-04T10:45:00.000Z
        type: role_changed
        message: Changed the role of <b>sam@example.com</b> to admin.
        created:
          user:
            name: Ada Lowe
        metadata:
          from: member
          to: admin
      - id: "3"
        timestamp: 2026-03-04T10:02:00.000Z
        type: user_invited
        message: Invited <b>sam@example.com</b>.
        metadata:
          invited_by: ada@example.com
```

```yaml
- id: mapped_event_log
  type: EventLog
  properties:
    height: 240
    fields:
      id: request_id
      time: at
      type: kind
      level: severity
      message: summary
      detail: body
      actor: operator
      context: payload
    data:
      - request_id: req_9001
        at: 2026-03-04T12:00:00.000Z
        kind: payment
        severity: error
        summary: Charge declined for invoice INV-2201.
        body: The card issuer returned <i>insufficient funds</i>.
        operator: Billing job
        payload:
          invoice: INV-2201
          amount: 149.5
          currency: USD
      - request_id: req_9002
        at: 2026-03-04T11:59:10.000Z
        kind: payment
        severity: success
        summary: Charge captured for invoice INV-2200.
        operator: Billing job
        payload:
          invoice: INV-2200
          amount: 89
          currency: USD
```

```yaml
- id: plain_event_log
  type: EventLog
  properties:
    height: 200
    search: false
    levelFilters: false
    defaultExpanded: true
    fields:
      id: id
      time: timestamp
      message: message
    data:
      - id: "1"
        timestamp: 2026-03-04T09:12:04.000Z
        level: warning
        type: cache_miss
        message: Cache miss rate above 30%.
        metadata:
          rate: 0.34
```

```yaml
- id: translated_event_log
  type: EventLog
  properties:
    height: 240
    levelFilterOptions:
      - all
      - error
    text:
      all: Alles
      error: Foute
      context: Konteks
      copy: Kopieer JSON
      copied: Gekopieer
      systemActor: Stelsel
      searchPlaceholder: Soek gebeure…
      noData: Geen gebeure nie.
      noResults: Geen passende gebeure nie.
    fields:
      id: id
      time: timestamp
      message: message
    data:
      - id: "1"
        timestamp: 2026-03-04T09:12:04.000Z
        type: import_failed
        level: error
        message: Invoer van <b>kliente.csv</b> het misluk.
        metadata:
          rows: 2043
          error: Kolom "epos" ontbreek
```

```yaml
- id: set_data_event_log
  type: EventLog
  properties:
    height: 200
    fields:
      id: id
      time: timestamp
      message: message
  events:
    onMount:
      - id: set_event_log_data
        type: CallMethod
        params:
          blockId: set_data_event_log
          method: setData
          args:
            - - id: "1"
                timestamp: 2026-03-04T09:12:04.000Z
                type: sync_failed
                level: error
                message: Contact sync failed after 3 retries.
                metadata:
                  retries: 3
              - id: "2"
                timestamp: 2026-03-04T09:02:04.000Z
                type: sync_succeeded
                level: success
                message: Contact sync completed.
                metadata:
                  contacts: 1240
```

```yaml
- id: event_log_with_events
  type: EventLog
  properties:
    height: 200
    fields:
      id: id
      time: timestamp
      message: message
    data:
      - id: "1"
        timestamp: 2026-03-04T09:12:04.000Z
        type: job_failed
        level: error
        message: Nightly export failed.
        metadata:
          job: nightly_export
      - id: "2"
        timestamp: 2026-03-04T08:12:04.000Z
        type: job_succeeded
        level: success
        message: Nightly import succeeded.
        metadata:
          job: nightly_import
  events:
    onRowClick:
      - id: set_selected_event
        type: SetState
        params:
          selected_event:
            _event: row
- id: selected_event_display
  type: Markdown
  properties:
    content:
      _nunjucks:
        template: '**Selected:** {{ selected_event.message | default("none") }}'
        on:
          _state: true
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | array | `[]` | Array of records, in the order they should be listed (usually newest first). Each record is read using the `fields` paths, so any record shape works. |
| `fields` | object | - | Dot paths used to read each record. Set only the paths that differ from the defaults. |
| `fields.id` | string | `"_id"` | Path to a unique row id, used as the list key, to track expanded rows and matched by the search. Ids that are not strings, such as MongoDB ObjectIds, are serialized. Falls back to the row index when the path is empty or the id repeats an earlier row. |
| `fields.time` | string | `"created.timestamp"` | Path to the row timestamp. Any value the JavaScript Date constructor accepts, such as an ISO string or a date. |
| `fields.type` | string | `"type"` | Path to the event type, used as the key into `eventTypeConfig`. |
| `fields.level` | string | `"level"` | Path to the severity of the row. One of "error", "warning", "success" or "info". When the path is empty, the level on the matching `eventTypeConfig` entry is used, otherwise the row is "info". |
| `fields.message` | string | `"title"` | Path to the message shown on the row. Rendered as html, sanitized before it is inserted. |
| `fields.detail` | string | `"description"` | Path to the detail shown when the row is expanded. Rendered as html, sanitized before it is inserted. |
| `fields.actor` | string | `"created.user"` | Path to the actor of the row. A string is used as the actor name, an object is read using `actorName` and `actorPicture`. |
| `fields.actorName` | string | `"name"` | Path to the actor name, relative to the actor object. |
| `fields.actorPicture` | string | `"picture"` | Path to the actor avatar image url, relative to the actor object. The actor initials are shown when it is empty. |
| `fields.context` | string | `"metadata"` | Path to the context object shown as a flattened key-value table when the row is expanded. |
| `eventTypeConfig` | object | `{}` | Map of event type to display config: `{ color, title, icon, level }`. `title` labels the type column, `icon` names an icon shown before the label, `color` colors the label and icon, and `level` sets the severity for every row of that type. |
| `reverse` | boolean | `false` | Reverse the order of the records before they are listed. |
| `search` | object \| boolean | - | Client-side search over the id, type, title, message, detail and context of every record. The search input is shown by default: omit the property or set it to true for the defaults, set an object to tune it, or set false to hide it. |
| `search.placeholder` | string | - | Placeholder text in the search input. Defaults to `text.searchPlaceholder`. |
| `search.debounce` | number | `150` | Milliseconds to wait after the last keystroke before filtering. |
| `search.minLength` | number | `0` | Skip filtering until the query is at least this many characters. |
| `levelFilters` | boolean | `true` | Show the severity filter pills in the toolbar. |
| `levelFilterOptions` | array | - | The filter pills to show, in order. Defaults to "all" plus every level with at least one record. |
| `defaultExpanded` | boolean | `false` | Expand every row. Rows added later are expanded when they first appear, and rows the user collapsed stay collapsed. |
| `height` | number \| string | - | Pixel height (number) or css height string of the scroll container. When omitted, the log grows with its content and scrolls with the page. |
| `overscan` | number | `400` | Pixels of off-screen rows to render above and below the viewport. Increase for smoother fast-scroll, decrease to reduce DOM cost. |
| `text` | object | - | All the text rendered by the block, so it can be changed or translated. |
| `text.all` | string | `"All"` | Label of the filter pill that shows every record. |
| `text.error` | string | `"Errors"` | Label of the error level filter pill. |
| `text.warning` | string | `"Warnings"` | Label of the warning level filter pill. |
| `text.success` | string | `"Successes"` | Label of the success level filter pill. |
| `text.info` | string | `"Info"` | Label of the info level filter pill. |
| `text.searchPlaceholder` | string | `"Search events, context, ids…"` | Placeholder text in the search input. |
| `text.clearSearch` | string | `"Clear search"` | Accessible label of the button that clears the search input. |
| `text.context` | string | `"Context"` | Heading of the context table in an expanded row. |
| `text.copy` | string | `"Copy JSON"` | Label of the button that copies the context object to the clipboard. |
| `text.copied` | string | `"Copied"` | Label shown on the copy button after the context was copied. |
| `text.systemActor` | string | `"System"` | Actor name shown when a record has no actor. |
| `text.noData` | string | `"No events."` | Text shown when there are no records. |
| `text.noResults` | string | `"No matching events."` | Text shown when the search and filters match no records. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onRowClick` | `{ row }` | Triggered when a row is clicked. |
| `onExpand` | `{ row, expanded }` | Triggered when a row is expanded or collapsed. |
| `onSearch` | `{ value, resultCount }` | Triggered when the debounced search query changes, including when the search is cleared. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The outer log container. |
| `/toolbar` | The sticky toolbar row holding the search input and the level filters. |
| `/search` | The search input wrapper. |
| `/filters` | The level filter pill group. |
| `/list` | The virtualised list container. |
| `/row` | Each log row. |
| `/detail` | The expanded detail area of a row. |
| `/context` | The context key-value table in an expanded row. |
| `/noData` | The placeholder shown when there are no records. |
| `/noResults` | The placeholder shown when the search and level filter match no records. |

No slots defined.
