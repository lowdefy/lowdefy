## When to use TableLight

`TableLight` is for the quick table here and there: a list of recent orders on a dashboard, the line items of an invoice, a short list of team members with an Edit button. It renders every row, so keep it to tens or hundreds of rows. In development it logs a console warning above 1,000 rows.

It has no value and keeps no state an app can read. For column filters, resizing, grouping, selection, editing, saved views, virtualisation or server-side data, use [`Table`](/Table). TableLight's config is a strict subset of Table's, so switching is a change of `type`. The [Table guide](/Table) compares TableLight, Table, TableInput and AgGrid and shows each kind of table as config. A key only Table supports stops the block with an error such as `Block "TableLight" property "columns.0.filterable" is not supported. Use Table for column filters.` The Table-only keys are `rowSelection`, `toolbar`, `views`, `activeView`, `defaultView`, `persist`, `virtual`, `headerMenu`, `reorderable`, `stickyHeader`, `rowHeight`, `maxHeight`, `rowDrag`, `tree`, `expandable`, `keyboard` and `rowVersionField` on the block; `filterable`, `resizable`, `groupable`, `editable`, `validate`, `required`, `default`, `searchable`, `flex` and `maxWidth` on columns; and `width` and `minWidth` on `defaultColumn`.

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
