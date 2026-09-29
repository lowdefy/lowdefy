# TableLight

A light table for the odd table on a page: a few columns and tens to hundreds of rows, with typed cells (numbers, dates, tags, people, links and more), sorting by header click, row links, row buttons and menus, conditional formatting and a summary row. It renders the Ant Design Table and adds no dependencies. Its config is a subset of the Table block's, so a table that outgrows it changes `type: TableLight` to `type: Table`.

## When to use TableLight

`TableLight` is for the quick table here and there: a list of recent orders on a dashboard, the line items of an invoice, a short list of team members with an Edit button. It renders every row, so keep it to tens or hundreds of rows. In development it logs a console warning above 1,000 rows.

It has no value and keeps no state an app can read. For column filters, resizing, grouping, selection, editing, saved views, virtualisation or server-side data, use [`Table`](/Table). TableLight's config is a strict subset of Table's, so switching is a change of `type`. The [Table guide](/Table) compares TableLight, Table, TableInput and AgGrid and shows each kind of table as config. A key only Table supports stops the block with an error such as `Block "TableLight" property "columns.0.filterable" is not supported. Use Table for column filters.`

## Columns

A column is an object, or just its key:

```yaml
columns:
  - name # key and field "name", title "Name"
  - key: owner_name # title "Owner name"
    field: owner.name
  - key: amount
    type: currency
    cell:
      currency: EUR
    aggregate: sum
```

- `key` is the column id and `field` the dot path of the value in the row. Each defaults to the other.
- `title` defaults to the key in sentence case, and supports html. `headerTooltip` adds a tooltip to the header.
- `type` picks the cell type (below) and `cell` holds that type's options. The option names match the AgGrid `cell` keys, so a column moves over by lifting `cell.type` to `type`.
- `align` is `start`, `center` or `end`; number, currency and percent columns default to `end`.
- `width` and `minWidth` are in pixels. `pinned: start` or `pinned: end` keeps a column in view while the table scrolls sideways.
- Text stays on one line. `wrap: true` wraps it and `ellipsis: 2` clamps it to two lines with the full text on hover. A clamp needs a column `width`.
- `children` groups columns under a shared header.
- `hidden: true` declares a column without showing it.

## Cell types

| type                            | shows                                                           | options in `cell`                                                                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`                          | the value (the default)                                         |                                                                                                                                                                                                                                   |
| `number`, `currency`, `percent` | formatted with `Intl.NumberFormat`                              | `format`, `locale`, `currency`, `decimals`, `minDecimals`, `maxDecimals`, `notation`, `useGrouping`, `negative`, `prefix`, `suffix`, `signColor`, `positiveColor`, `negativeColor`, `zeroColor`, `color`, `thresholds` + `colors` |
| `date`, `datetime`              | a dayjs format, or relative time with the date on hover         | `format`, `relative`                                                                                                                                                                                                              |
| `boolean`                       | a label or an icon                                              | `trueLabel`, `falseLabel`, `trueColor`, `falseColor`, `trueIcon`, `falseIcon`                                                                                                                                                     |
| `tag`, `tags`, `status`         | tinted tags, or a dot and a label                               | `colorMap`, `colorFrom`, `default`, `max` (tags)                                                                                                                                                                                  |
| `avatar`, `people`              | initials or an image; `people` overlaps several with a +N count | `nameField`, `srcField`, `idField`, `shape`, `link` (avatar), `max` (people)                                                                                                                                                      |
| `link`                          | a link that navigates by itself                                 | `pageId`, `href`, `urlQuery`, `newTab`, `home`, `back`, `input`, `labelField`                                                                                                                                                     |
| `email`, `phone`, `url`         | `mailto:`, `tel:` and external links                            | `label`, `labelField`, `newTab` (url)                                                                                                                                                                                             |
| `relation`                      | related records as chips, linked to their page                  | `labelField`, `pageId`, `href`, `urlQuery`, `newTab`                                                                                                                                                                              |
| `progress`, `rating`            | a bar, or stars                                                 | `max`, `suffix`, `color`, `thresholds`, `colors`, `showValue`, `nullLabel` (progress)                                                                                                                                             |
| `image`                         | a lazy thumbnail                                                | `width`, `height`, `shape`, `alt`, `altField`                                                                                                                                                                                     |
| `html`                          | a template or a field holding HTML                              | `template`                                                                                                                                                                                                                        |
| `json`                          | a one-line preview                                              |                                                                                                                                                                                                                                   |
| `buttons`                       | row buttons                                                     | `buttons`, `showOn`                                                                                                                                                                                                               |
| `menu`                          | a row menu                                                      | `items`, `icon`, `title`, `placement`                                                                                                                                                                                             |

Values in `urlQuery` and every `...Field` option are paths in the row. For `people` they are paths in each person, and for `relation` paths in the related record, where `urlQuery` defaults to `{ _id: _id }`.

A `url` value with a scheme other than http or https, such as `javascript:`, shows as text, not as a link.

### Options: labels and colours for enum values

`options` gives the labels and colours of `tag`, `tags` and `status` values. It takes a list, or a map from value to a label or `{ label, color, icon }`:

```yaml
- key: stage
  type: status
  options:
    lead: Lead
    qualified: { label: Qualified, color: processing }
    won: { label: Won, color: success }
    lost: { label: Lost, color: error }
```

Colours are the antd presets (`blue`, `green`, `gold`, ...), the status names (`success`, `processing`, `warning`, `error`) or any CSS colour. The presets and status names follow the theme and dark mode. An enum column sorts in the order its options are declared. A value without an option, in a column without `options` or colour keys, gets a colour picked from the value, so the same value always has the same colour.

### HTML templates

An `html` cell renders a [nunjucks](https://mozilla.github.io/nunjucks/) template with `value` and `row`, compiled once per column:

```yaml
- key: summary
  type: html
  cell:
    template: '<b>{{ row.title }}</b> {{ value }}'
```

Values are escaped. Use `| safe` to insert HTML held in a field. The output is sanitised, and `data-event` attributes fire block events as in other HTML.

## Conditional formatting

`rules` on a column colour or style cells whose value meets a condition. `rowRules` does the same for rows:

```yaml
rowRules:
  - when: { key: overdue, op: isTrue }
    className: row-warning
columns:
  - key: score
    type: number
    rules:
      - when: { op: gte, value: 8 }
        color: success
      - when: { op: lt, value: 5 }
        color: error
```

A condition is `{ key, op, value }`, or `{ and: [...] }` / `{ or: [...] }` of conditions. In a column rule, a condition without `key` tests the column's own value. Every rule that holds applies, in order.

| operators                                                                                              | for                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `eq`, `ne`, `in`, `nin`, `empty`, `notEmpty`                                                           | every type                     |
| `contains`, `notContains`, `startsWith`, `endsWith`                                                    | text, links, tags and statuses |
| `gt`, `gte`, `lt`, `lte`, `between` (`value: [from, to]`)                                              | numbers                        |
| `before`, `after`, `between`, `within` (`value: { last: 7, unit: day }` or `{ next: 1, unit: month }`) | dates; `eq` compares by day    |
| `isTrue`, `isFalse`                                                                                    | booleans                       |
| `in` (any of), `nin` (none of), `contains` (has the value)                                             | tags and people                |

Text comparisons ignore case, and `empty` matches null, a missing value, an empty string and an empty list. To compare with the current user, use the `_user` operator in the value, for example `value: { _user: id }`.

`hidden` and `disabled` on buttons and menu items take the same conditions: `hidden: { when: { key: locked, op: isTrue } }`.

## Sorting

Clicking a header sorts ascending, then descending, then back to the data order. The column type sets the order: numbers numerically, dates by time, enums by option order and text alphabetically, ignoring case and reading numbers in text as numbers. Empty values always sort last. Set `sortable: false` on a column, or `defaultColumn: { sortable: false }` for the whole table.

## Rows, clicks and links

`rowKey` names the field that identifies a row, and defaults to `_id`, then `id`. Rows with neither get a key per row object, which does not survive a refetch.

`rowLink` makes every row a link:

```yaml
rowLink:
  pageId: order
  urlQuery:
    _id: _id
```

A plain click navigates, and a Cmd/Ctrl or middle click opens a new tab. With `onRowClick` defined as well, a plain click runs `onRowClick` (to open a drawer, say) and only a modified click follows the link.

`onRowClick` receives `{ row, rowKey, index }`, where `index` is the row's position in `data`, whatever the sort. `onCellClick` receives `{ row, rowKey, column: { key, field }, value }`. Clicks on buttons, links, menus and `data-event` elements in a cell, and a mouse drag that selects text, trigger neither.

A `link` cell navigates by itself. It also fires `onCellLink` with `{ link, row, value }`, so do not add a `Link` action to that event.

## Buttons and menus

```yaml
- key: actions
  type: buttons
  cell:
    showOn: hover
    buttons:
      - eventName: onEdit
        title: Edit
        icon: edit
      - eventName: onArchive
        title: Archive
        icon: Archive
        hideTitle: true
- key: more
  type: menu
  cell:
    items:
      - eventName: onDelete
        title: Delete
        danger: true
```

Each button or menu item fires the block event named by its `eventName`, with `{ row, rowKey, value, button: { eventName, title }, buttonIndex }` or `{ row, rowKey, value, item: { eventName, title }, itemIndex }`. The button keys are the AgGrid buttons cell keys: `title` / `titleField`, `icon` / `iconField`, `hidden` / `hiddenField`, `disabled` / `disabledField`, `type`, `variant`, `color`, `size`, `shape`, `danger`, `ghost`, `hideTitle`, `tooltip` and `iconPlacement`. An icon-only button shows its title as a tooltip.

`showOn: hover` hides the buttons until the row is hovered or has focus. Touch screens always show them.

## Summary row, pagination and layout

- A column with `aggregate` adds a summary row: `sum`, `avg`, `min`, `max`, `count`, `countDistinct`, `countEmpty`, `countNotEmpty`, `percentEmpty`, `earliest` or `latest`, calculated over every row. `summary: false` hides it.
- Pages show only when there are more rows than `pageSize` (default 50). `pagination: false` shows every row; `pagination: true` always shows the pager.
- `height` fixes the body height: rows scroll under a sticky header, and the summary row stays in view.
- `size` is `compact`, `default` or `comfortable`. `bordered`, `loading` and `emptyText` do what they say.

```yaml
- id: basic_table
  type: TableLight
  properties:
    columns:
      - name
      - key: email
        type: email
      - key: role
      - key: joined
        type: date
    data:
      - _id: 1
        name: Sarah Johnson
        email: sarah@example.com
        role: Engineer
        joined: 2023-04-12
      - _id: 2
        name: Alex Chen
        email: alex@example.com
        role: Product
        joined: 2022-11-01
      - _id: 3
        name: Maria Garcia
        email: maria@example.com
        role: Design
        joined: 2024-02-20
```

```yaml
- id: orders_table
  type: TableLight
  properties:
    rowLink:
      pageId: order
      urlQuery:
        _id: _id
    columns:
      - key: number
        title: Order
      - key: customer
        type: avatar
      - key: status
        type: tag
        options:
          pending:
            label: Pending
            color: warning
          shipped:
            label: Shipped
            color: processing
          delivered:
            label: Delivered
            color: success
          cancelled:
            label: Cancelled
            color: error
      - key: total
        type: currency
        cell:
          currency: USD
        aggregate: sum
      - key: placed
        type: date
        cell:
          relative: true
    data:
      - _id: o1
        number: ORD-1042
        customer: Sarah Johnson
        status: delivered
        total: 129.97
        placed: 2026-09-20T10:15:00
      - _id: o2
        number: ORD-1043
        customer: Alex Chen
        status: shipped
        total: 54.5
        placed: 2026-09-24T16:40:00
      - _id: o3
        number: ORD-1044
        customer: Maria Garcia
        status: pending
        total: 310
        placed: 2026-09-27T08:05:00
      - _id: o4
        number: ORD-1045
        customer: Jordan Rivera
        status: cancelled
        total: 18.99
        placed: 2026-09-27T12:30:00
```

```yaml
- id: cell_types_table
  type: TableLight
  properties:
    columns:
      - key: company
        type: relation
        cell:
          labelField: name
      - key: owners
        type: people
      - key: stage
        type: status
        options:
          - value: lead
            label: Lead
            color: default
          - value: qualified
            label: Qualified
            color: processing
          - value: won
            label: Won
            color: success
      - key: labels
        type: tags
        cell:
          max: 2
      - key: probability
        type: percent
      - key: health
        type: progress
      - key: rating
        type: rating
      - key: active
        type: boolean
      - key: website
        type: url
      - key: phone
        type: phone
    data:
      - _id: d1
        company:
          _id: c1
          name: Acme Ltd
        owners:
          - name: Ann Lee
          - name: Bob Stone
          - name: Cy Dunn
          - name: Di Park
        stage: won
        labels:
          - enterprise
          - renewal
          - priority
        probability: 0.9
        health: 82
        rating: 4
        active: true
        website: acme.example.com
        phone: +1 555 010 2000
      - _id: d2
        company:
          _id: c2
          name: Globex
        owners:
          - name: Bob Stone
        stage: qualified
        labels:
          - smb
        probability: 0.4
        health: 35
        rating: 3
        active: false
        website: https://globex.example.com
        phone: +1 555 010 3000
```

```yaml
- id: rules_table
  type: TableLight
  properties:
    size: compact
    bordered: true
    rowRules:
      - when:
          key: overdue
          op: isTrue
        style:
          fontStyle: italic
    columns:
      - key: task
      - key: score
        type: number
        rules:
          - when:
              op: gte
              value: 8
            color: success
          - when:
              op: lt
              value: 5
            color: error
      - key: summary
        type: html
        ellipsis: 2
        width: 260
        cell:
          template: "<b>{{ row.task }}</b>: {{ value }}"
      - key: overdue
        type: boolean
        cell:
          trueLabel: Overdue
          falseLabel: On time
          trueColor: error
    data:
      - _id: t1
        task: Onboarding
        score: 9
        summary: Welcome pack sent and first call booked.
        overdue: false
      - _id: t2
        task: Renewal
        score: 4
        summary: Waiting on the signed order form from procurement.
        overdue: true
      - _id: t3
        task: Upsell
        score: 6
        summary: Demo scheduled for next week.
        overdue: false
```

```yaml
- id: actions_table
  type: TableLight
  properties:
    columns:
      - key: name
      - key: email
        type: email
      - key: actions
        type: buttons
        align: end
        cell:
          showOn: hover
          buttons:
            - eventName: onEdit
              title: Edit
              icon: edit
            - eventName: onArchive
              title: Archive
              icon: Archive
              hideTitle: true
              hidden:
                when:
                  key: archived
                  op: isTrue
      - key: more
        title: ""
        type: menu
        width: 48
        cell:
          items:
            - eventName: onDuplicate
              title: Duplicate
            - eventName: onDelete
              title: Delete
              danger: true
    data:
      - _id: u1
        name: Sarah Johnson
        email: sarah@example.com
        archived: false
      - _id: u2
        name: Alex Chen
        email: alex@example.com
        archived: true
  events:
    onEdit:
      - id: edit_message
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Edit "
              - _event: row.name
```

```yaml
- id: grouped_table
  type: TableLight
  properties:
    height: 200
    pagination: false
    columns:
      - key: region
        pinned: start
        width: 140
      - title: Q1
        children:
          - key: jan
            type: currency
            aggregate: sum
            width: 120
          - key: feb
            type: currency
            aggregate: sum
            width: 120
          - key: mar
            type: currency
            aggregate: sum
            width: 120
      - title: Q2
        children:
          - key: apr
            type: currency
            aggregate: sum
            width: 120
          - key: may
            type: currency
            aggregate: sum
            width: 120
          - key: jun
            type: currency
            aggregate: sum
            width: 120
    data:
      - _id: 1
        region: North
        jan: 12000
        feb: 13500
        mar: 14100
        apr: 12900
        may: 15200
        jun: 16000
      - _id: 2
        region: South
        jan: 9800
        feb: 10100
        mar: 9900
        apr: 11200
        may: 11800
        jun: 12500
      - _id: 3
        region: East
        jan: 15300
        feb: 14900
        mar: 16200
        apr: 17100
        may: 16800
        jun: 18200
      - _id: 4
        region: West
        jan: 8700
        feb: 9200
        mar: 9800
        apr: 10400
        may: 10900
        jun: 11300
      - _id: 5
        region: Central
        jan: 11100
        feb: 11600
        mar: 12000
        apr: 12500
        may: 13100
        jun: 13400
      - _id: 6
        region: Islands
        jan: 4300
        feb: 4100
        mar: 4600
        apr: 4900
        may: 5200
        jun: 5600
```

```yaml
- id: empty_table
  type: TableLight
  properties:
    emptyText: No orders yet.
    columns:
      - number
      - key: total
        type: currency
    data: []
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | array \| null | - | The rows to show. |
| `rowKey` | string | - | The row field that identifies each row. Defaults to `_id`, then `id`. Rows with neither get a key per row object, which does not survive a refetch. |
| `columns` | array \| null | - | The columns, in order. |
| `defaultColumn` | object | - | Defaults applied to every column. |
| `defaultColumn.sortable` | boolean | `true` | Sort by clicking a header. |
| `defaultColumn.wrap` | boolean | `false` | Wrap long text. |
| `defaultColumn.ellipsis` | integer | - | Clamp text to this many lines. |
| `user` | object | - | The user object for `$user` values in `rules`, `rowRules` and button `hidden`/`disabled` conditions, usually `{ _user: true }`. Blocks do not see the session, so conditions read `$user` from this property. |
| `rowLink` | object | - | Make rows links. A plain click navigates, Cmd/Ctrl or middle click opens a new tab. Values in `urlQuery` are row paths. |
| `rowLink.pageId` | string | - | The page to open. |
| `rowLink.href` | string | - | A URL to open instead of a page. |
| `rowLink.urlQuery` | object | - | Query parameters; each value is a path in the row, like `{ _id: _id }`. |
| `rowLink.input` | object | - | Input for the page. |
| `rowLink.newTab` | boolean | - | Always open in a new tab. |
| `rowRules` | array | - | Conditional row formatting: `[{ when, className, style, color }]`, where `when` conditions name columns by `key`. |
| `size` | string | `"default"` | Row density. Enum: `compact`, `default`, `comfortable`. |
| `bordered` | boolean | `false` | Draw borders around cells. |
| `height` | number \| string | - | A fixed body height; the rows scroll under a sticky header and the summary row stays in view. |
| `emptyText` | string | - | What to show when there are no rows - supports html. |
| `loading` | boolean | `false` | Show a loading spinner over the table. |
| `pagination` | boolean | - | Pages are shown only when there are more rows than `pageSize`. `false` shows every row on one page; `true` always shows the pager. |
| `pageSize` | integer | `50` | Rows per page. |
| `summary` | boolean | `true` | Show the summary row when a column declares an `aggregate`. `false` hides it. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onRowClick` | `{ row, rowKey, index }` | Trigger actions when a row is clicked. Clicks on buttons, links, menus and `data-event` elements in a cell, and clicks that end a text selection, do not trigger it. With `rowLink`, a plain click runs onRowClick instead of following the link. |
| `onCellClick` | `{ row, rowKey, column, value }` | Trigger actions when a cell is clicked. Clicks on controls in the cell do not trigger it. |
| `onCellLink` | `{ link, row, value }` | Triggered when a link, avatar link or relation cell is clicked. The link navigates by itself; this event is for anything else to do. |
| `onCellButton` | `{ row, rowKey, value, button, buttonIndex }` | Documentation reference - the event fired is the `eventName` of each button in a `buttons` cell. Define any number of named events on the block, such as `onEdit`. |
| `onCellMenuItem` | `{ row, rowKey, value, item, itemIndex }` | Documentation reference - the event fired is the `eventName` of each item in a `menu` cell. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The TableLight element. |

No slots defined.
