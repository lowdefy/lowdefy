# Table

A virtualised, keyboard-accessible data table for record lists, reports, pickers, trees and queues: typed cells, sorting, column filters, search, resizing, reordering, pinning, grouping with aggregates, row selection with bulk actions, inline editing, saved views and server-side data in blocks through `MongoDBTableQuery`. Its value is its UI state, `{ view, selected, expanded }`, so `_state: <id>.selected` is the selection and `_state: <id>.view` the current view. Every TableLight config is a valid Table config, and the AgGrid blocks remain supported alongside it.

## Choosing a table block

Lowdefy has four table blocks. Pick by what the table is for, not by how many features you might need one day: `TableLight` and `Table` share one column model, so a table that outgrows `TableLight` changes `type` and keeps its config.

| Block                       | Use it for                                                                                                                                                                 | Value                                                                | Rows                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`TableLight`](/TableLight) | The odd table on a page: recent orders on a dashboard, the lines of an invoice. Typed cells, header sort, row links, row buttons, a summary row.                           | none                                                                 | tens to hundreds; a dev warning above 1,000                                   |
| `Table`                     | Record lists, reports, pickers, trees and queues: filters, search, resize, reorder, pin, grouping, selection, bulk actions, inline editing, saved views, server-side data. | `{ view, selected, expanded }`                                       | any number (virtualised; server mode for collections too big for the browser) |
| [`TableInput`](/TableInput) | Editing a list of rows in a form: invoice lines, recipe ingredients, the steps of a plan.                                                                                  | the changes to `data`, `{ updated, added, removed, moved?, order? }` | as `Table` (client data only)                                                 |
| [`AgGrid`](/AgGrid)         | Existing AG Grid tables, and AG Grid options that `Table` does not have.                                                                                                   | `AgGrid*Input` holds the rows                                        | any number                                                                    |

The AgGrid blocks are not deprecated and nothing needs to move. Column config moves over by hand when you want it to: the `cell` option names match AgGrid's `cell` keys, so lift `cell.type` to the column's `type`.

`Table` takes every `TableLight` property with the same meaning. One difference: `pagination` is off by default on `Table`, which scrolls any number of rows, and on by default on `TableLight`, which shows a pager when there are more rows than `pageSize`.

## How Table works

`Table` is an input block whose value is its UI state, not its data:

```yaml
view: # what the user sees: columns, sort, filter, search, grouping, density
  columns: [{ key: name, width: 260, pinned: start }, { key: stage }, { key: amount }]
  sort: [{ key: amount, desc: true }]
  filter: { key: stage, op: in, value: [lead, qualified] }
  search: acme
selected: [d1, d7] # the selected row keys
expanded: [] # the expanded tree rows or detail rows
```

- `_state: deals.selected` is always the selection and `_state: deals.view` always the current view, with no `onChange` wiring.
- Setting them sets the table: `SetState: { deals.selected: [] }` clears the selection, `SetState: { deals.view.filter: { key: stage, op: eq, value: won } }` filters it, and `Reset` returns to `defaultView`.
- Rows come from `data`: a list of rows (client mode), or `{ mode: server, request }` (server mode, below).
- `rowKey` names the field that identifies a row: `_id` by default, then `id`. Selection, expansion, events and edits all use it, so give rows a key. Rows with neither field get a key per row object, which does not survive a refetch.

The table loads its code (TanStack Table and Virtual, about 47 kB gzipped) the first time a `Table` or `TableInput` mounts, showing its loading skeleton until then (see [Loading states](#loading-states)). A page without one does not load it.

## What is on by default

A `Table` with only `columns` and `data` already does what users expect of a table. Features that need your intent, a place to save something, or page chrome are one key away.

| Feature                                                                           | Default                                                                   | Turn it off or on                                                                             |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Sort by header click (Shift+click adds a level)                                   | on                                                                        | `sortable: false` on a column, or `defaultColumn: { sortable: false }`                        |
| Column resize by dragging a header edge                                           | on                                                                        | `resizable: false`, or `defaultColumn: { resizable: false }`                                  |
| Column reorder by dragging a header                                               | on                                                                        | `reorderable: false`                                                                          |
| Header menu: sort, filter, group, pin, freeze, autosize, hide, Columns…           | on                                                                        | `headerMenu: false`                                                                           |
| Column filters (from the header menu; the header shows an icon while one applies) | on                                                                        | `filterable: false`, or `defaultColumn: { filterable: false }`                                |
| Column manager (Columns… in the header menu)                                      | on                                                                        | follows `headerMenu`                                                                          |
| Sticky header                                                                     | on                                                                        | `stickyHeader: false`                                                                         |
| Virtualisation                                                                    | `auto`: rows above 200, columns above 20 or wider than twice the viewport | `virtual: true` or `virtual: false`                                                           |
| Keyboard navigation, focus ring, ARIA grid roles                                  | on                                                                        | `keyboard: false` (the roles stay)                                                            |
| Copy with Cmd/Ctrl+C                                                              | on                                                                        | always on, also with `keyboard: false`                                                        |
| Text wrap                                                                         | off: text stays on one line                                               | `wrap` or `ellipsis` on a column, `view.wrap`, or the toolbar Wrap toggle (`toolbar.density`) |
| Hover highlight, empty state, loading states                                      | on                                                                        | `emptyText`, the `empty` slot, `loading`, the block's `skeleton`                              |
| Summary footer                                                                    | on when a column has an `aggregate` (or the view has `aggregates`)        | `summary: false`                                                                              |
| Height                                                                            | grows with its rows up to `maxHeight` (600px), then scrolls               | `height` for a fixed height                                                                   |
| Toolbar                                                                           | off                                                                       | `toolbar: true` (every item) or `toolbar: { search: true, ... }`                              |
| Row selection                                                                     | off                                                                       | `rowSelection: { type: checkbox }`                                                            |
| Grouping                                                                          | off                                                                       | `groupable: true` on columns                                                                  |
| Editing                                                                           | off                                                                       | `editable: true` on columns                                                                   |
| Pagination                                                                        | off                                                                       | `pagination: true`                                                                            |
| View persistence                                                                  | off                                                                       | `persist: { key }`                                                                            |
| Saved views, server mode                                                          | off                                                                       | `views`, `data: { mode: server }`                                                             |

Changes a user makes with the default features (sort, widths, order, filters, hidden columns) live in the table value for the session. `Reset` and `SetState` still control them, and they outlive a page reload only with `persist`.

## Loading states

The table shows what it is doing while data loads, the same way in `Table`, `TableInput` and `TableLight`, so switching `type` looks the same. It reads one signal: `loading`. Lowdefy sets it while the block's or a parent's `onMount` actions run, and you set it with the `loading` property.

| `loading` | Rows                                   | The table shows                                                                                               |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| true      | none yet                               | **Initial:** the real header over skeleton rows that fill the body                                            |
| true      | rows on screen                         | **Refreshing:** the rows stay, and a thin progress bar runs under the header                                  |
| false     | none (`[]`, or `data` null or missing) | **Empty:** "No rows" (`emptyText`), or "No matching rows" with _Clear filters_ when a filter or search is set |
| false     | rows                                   | **Ready**                                                                                                     |

**Wire `loading` to the request.** A request that runs again makes `_request` return `null` until the new response lands (unless the `Request` action sets `holdValue: true`). The table holds its rows while `loading` is true, so a refetch never flashes empty, either way:

```yaml
- id: deals
  type: Table
  properties:
    loading:
      _request_details: deals_list.0.loading # the latest call of the request
    data:
      _request: deals_list
    columns: [name, stage, amount]
```

Set `loading` as the property rather than the block's own `loading` key. Either way the blocks in the table's slots (toolbar buttons, bulk actions, the empty state) keep only their own loading: the table's loading, including a page `onMount` that fetches its rows, never disables them, so a "New deal" or refresh button stays usable while the rows load. Without `loading`, a table whose request failed or has not run yet shows its empty state, never a skeleton that never ends. A table on a page whose `onMount` fetches its data is loading until those actions finish, so it shows the skeleton meanwhile.

- **Skeleton rows** are shaped like their cells, so nothing jumps when the rows land: text bars of varied width, short end-aligned bars for numbers, a circle and a bar for avatars and people, pills for tags and statuses, squares for booleans and checkboxes, one small square per button (none for `showOn: hover` buttons, which are hidden until hover anyway) and a thin bar for progress; square avatars (`shape: square`) load as squares. They fill the table's height (`height`, or `maxHeight` for a table that grows with its rows), at most a page when paginated, at the current density. A shimmer band in the theme's fill colour runs across them, as on the Skeleton block, and stops when the user prefers reduced motion.
- **Timing.** The skeleton shows 120 ms after loading starts, so a fast response never flashes it, and once shown it stays at least 300 ms, so it never flickers. A key, click or focus in the table during that time shows the rows at once, so a header click or an arrow key acts on the rows. The progress bar fades in after the same 120 ms.
- **View changes.** A sort, filter, search, group or view tab the user picks keeps the old rows on screen with the progress bar; if the new rows take longer than 300 ms, the old rows dim until they arrive. A background refetch or a server `refresh` never dims.
- **While the first rows load** the toolbar's search, filters, views and slot blocks stay usable; Export, the select-all checkbox and the bulk bar wait for rows, and the record count shows a placeholder until it has a count (while refreshing it keeps the count of the rows on screen). The grid is `aria-busy`, and a polite live region says "Loading rows", then "N rows loaded".
- **The table's own code.** `Table` and `TableInput` load their code on first mount. Until it arrives the block shows this same skeleton, built from the column config, so the swap to the table moves nothing.
- **Server mode.** Rows not loaded yet (a fast scroll) are skeleton rows. An expanded group shows a spinner in its chevron and skeleton rows until its rows land. A block of rows that fails to load is one row, "Couldn't load rows · Retry": Retry loads just that block again, and the rows already loaded stay. The table shows the failure itself, so the page shows no error message for it; the error is still logged.
- **Trees.** A lazy expand (`onRowExpand` with `needsChildren`) is awaited: the chevron spins and a skeleton child row shows until the children arrive. If the actions fail, the row collapses and its chevron shows the error.
- **Actions.** Cell saves, row moves and TableInput edits show their own saving and error markers. Export spins while the file builds (in server mode, while the `onExport` actions run). The filter builder, column filters, column manager, header menu and cell editor open at once, with a spinner inside them the first time their code loads.

**A different loading look.** A block's `skeleton` config replaces the whole table while the block is loading, as for any Lowdefy block (with the block's own `loading` key, or while `onMount` runs):

```yaml
- id: deals
  type: Table
  skeleton:
    type: Skeleton
    properties:
      height: 320
  properties:
    data:
      _request: deals_list
    columns: [name, stage, amount]
```

## Table types

### Embedded table

A few lines on a record page. No toolbar, no persistence; virtualisation stays off below 200 rows.

```yaml
- id: line_items
  type: Table
  properties:
    data:
      _request: get_invoice.0.lines
    size: compact
    columns:
      - key: product
      - key: qty
        type: number
        width: 90
        aggregate: sum
      - key: price
        type: currency
        cell:
          currency: EUR
      - key: total
        type: currency
        cell:
          currency: EUR
        aggregate: sum
```

This is also a valid `TableLight`. Use `TableLight` when it needs nothing more.

### Record list (CRM index view)

A list of deals from a MongoDB collection, loaded in blocks as the user scrolls, with row links, a toolbar, saved views, bulk actions, hover buttons and one editable column. The requests come first, then the table.

```yaml
id: deals
type: PageHeaderMenu
properties:
  title: Deals

requests:
  # The rows. The table fires this request with { startRow, endRow, view, groupPath }; the
  # payload reads them from the event and the properties from the payload.
  - id: deals_page
    type: MongoDBTableQuery
    connectionId: deals
    payload:
      view:
        _event: view
      startRow:
        _event: startRow
      endRow:
        _event: endRow
      groupPath:
        _event: groupPath
      timezone: # date filters compare the user's days
        _js: 'return Intl.DateTimeFormat().resolvedOptions().timeZone;'
    properties:
      pipeline: # always runs first: the view can only narrow it
        - $match:
            org_id:
              _user: organization.id
            archived:
              $ne: true
      # The allowlist, keyed by column key. The bulk request below uses the same fields, so they
      # live in one file:
      #   name: { type: text, search: true }
      #   stage: { type: status, groupable: true }
      #   owner: { type: avatar, path: owner.name, search: true, groupable: true }
      #   amount: { type: currency }
      #   updated: { type: date }
      fields:
        _ref: deals/table_fields.yaml
      # Rows return _id and the fields' paths only; add the paths cells read on their own.
      returnFields:
        - owner.avatar
      user:
        _user: true
      timezone:
        _payload: timezone
      view:
        _payload: view
      startRow:
        _payload: startRow
      endRow:
        _payload: endRow
      groupPath:
        _payload: groupPath

  # Saved views: the user's own, and the ones shared in the organization.
  - id: deal_views
    type: MongoDBAggregation
    connectionId: table_views
    properties:
      pipeline:
        - $match:
            table: deals
            org_id:
              _user: organization.id
            $or:
              - owner_id:
                  _user: id
              - shared: true
        - $sort:
            title: 1
        - $project:
            _id: 0
            id: $_id
            title: 1
            view: 1
            shared: 1
            locked: # only the owner may save over or delete a view
              $ne:
                - $owner_id
                - _user: id

  - id: save_deal_view
    type: MongoDBUpdateOne
    connectionId: table_views
    payload:
      id:
        _state: view_id
      title:
        _event: title
      shared:
        _event: shared
      view:
        _event: view
    properties:
      filter:
        _id:
          _payload: id
        owner_id:
          _user: id
      update:
        $set:
          title:
            _payload: title
          shared:
            _payload: shared
          view:
            _payload: view
        $setOnInsert:
          table: deals
          org_id:
            _user: organization.id
      options:
        upsert: true

  - id: delete_deal_view
    type: MongoDBDeleteOne
    connectionId: table_views
    payload:
      id:
        _event: id
    properties:
      filter:
        _id:
          _payload: id
        owner_id:
          _user: id

  # Inline edit of the stage column.
  - id: update_deal_stage
    type: MongoDBUpdateOne
    connectionId: deals
    payload:
      _id:
        _event: rowKey
      stage:
        _event: value
    properties:
      filter:
        _id:
          _payload: _id
        org_id:
          _user: organization.id
      update:
        $set:
          stage:
            _payload: stage
          updated:
            _date: now

  # A hover button.
  - id: archive_deal
    type: MongoDBUpdateOne
    connectionId: deals
    payload:
      _id:
        _event: rowKey
    properties:
      filter:
        _id:
          _payload: _id
        org_id:
          _user: organization.id
      update:
        $set:
          archived: true

  # A bulk action over the selection: a list of keys, or every row matching the view.
  - id: assign_deals
    type: MongoDBTableChanges
    connectionId: deals
    payload:
      selected:
        _state: deals_table.selected
      timezone:
        _js: 'return Intl.DateTimeFormat().resolvedOptions().timeZone;'
    properties:
      filter:
        org_id:
          _user: organization.id
      fields: # what the bulk write may set, keyed by field path
        owner.name:
          type: text
        owner.id:
          type: text
      queryFields: # the table's MongoDBTableQuery fields, to read an all-matching selection
        _ref: deals/table_fields.yaml
      user:
        _user: true
      timezone:
        _payload: timezone
      selection:
        _payload: selected
      set:
        owner.name:
          _user: name
        owner.id:
          _user: id

events:
  onMount:
    - id: fetch_views
      type: Request
      params: deal_views

blocks:
  - id: deals_table
    type: Table
    properties:
      height: calc(100vh - 220px)
      data:
        mode: server
        request: deals_page
      rowLink:
        pageId: deal
        urlQuery:
          _id: _id
      rowSelection:
        type: checkbox
      views:
        _request: deal_views
      activeView:
        _state: active_view
      persist:
        key: deals
      toolbar:
        views: true
        search: true
        quickFilters: [stage]
        filter: true
        sort: true
        group: true
        columns: true
        density: true
      defaultView:
        sort:
          - key: updated
            desc: true
      columns:
        - key: name
          title: Deal
          width: 260
          pinned: start
        - key: stage
          type: status
          groupable: true
          editable: true
          options:
            lead: Lead
            qualified:
              label: Qualified
              color: processing
            won:
              label: Won
              color: success
            lost:
              label: Lost
              color: error
        - key: owner
          field: owner.name
          type: avatar
          groupable: true
          cell:
            srcField: owner.avatar # returned through returnFields
        - key: amount
          type: currency
          aggregate: sum
        - key: updated
          type: date
          cell:
            relative: true
        - key: actions
          type: buttons
          title: ''
          width: 56
          pinned: end
          sortable: false
          filterable: false
          cell:
            showOn: hover
            buttons:
              - eventName: onArchive
                title: Archive
                icon: Archive
                hideTitle: true
    slots:
      toolbarStart:
        blocks:
          - id: new_deal
            type: Button
            properties:
              title: New deal
              icon: add
              size: small
            events:
              onClick:
                - id: go_new
                  type: Link
                  params:
                    pageId: new-deal
      bulkActions:
        blocks:
          - id: assign_to_me
            type: Button
            properties:
              title: Assign to me
              size: small
            events:
              onClick:
                - id: assign
                  type: Request
                  params: assign_deals
                - id: refresh
                  type: CallMethod
                  params:
                    blockId: deals_table
                    method: refresh
                - id: clear
                  type: CallMethod
                  params:
                    blockId: deals_table
                    method: clearSelection
    events:
      onCellEdit:
        - id: save_stage
          type: Request
          params: update_deal_stage
      onArchive:
        - id: archive
          type: Request
          params: archive_deal
        - id: drop_row
          type: CallMethod
          params:
            blockId: deals_table
            method: applyTransaction
            args:
              - remove:
                  - _event: rowKey
      onViewSelect:
        - id: remember_view
          type: SetState
          params:
            active_view:
              _event: id
      onViewSave:
        # Save passes the active view's id; Save as passes none, so it gets a new one.
        - id: view_id
          type: SetState
          params:
            view_id:
              _if_none:
                - _event: id
                - _uuid: true
        - id: save_view
          type: Request
          params: save_deal_view
        - id: refetch_views
          type: Request
          params: deal_views
        - id: select_saved
          type: SetState
          params:
            active_view:
              _state: view_id
      onViewDelete:
        - id: delete_view
          type: Request
          params: delete_deal_view
        - id: refetch_after_delete
          type: Request
          params: deal_views
```

The connections are `MongoDBCollection` connections to the `deals` and `table_views` collections with `write: true`.

What each part does:

- **Server mode.** The table fetches rows 0 to 200 on mount, then each block of `blockSize` rows (default 200) as it scrolls into view, keeping at most `maxBlocks` blocks (default 20). A sort, filter, search or grouping change fetches from the top, and the old rows stay on screen, dimmed, until the new ones land. See [MongoDBTableQuery](/MongoDB) for the request, and Security below.
- **Row links.** A plain click opens the deal, Cmd/Ctrl+click or a middle click opens it in a new tab, and Enter on a focused row follows the link. Clicks on buttons, links, menus and editors in a cell never trigger the row. A click on a block in one of the table's slots, such as "Assign to me", runs that block's event and not the table's (the innermost block with actions handles a click, unless an event sets `bubble: true`), and the table still fires its own events for the methods that button calls, such as `onSelectionChange` after `clearSelection`.
- **Saved views.** The tabs show `views`. A view `id` is a string, a number or a MongoDB ObjectId (`{ _oid }`, matched by its hex, so `id: $_id` works too); this example uses string ids so that Save as can pick one before the request runs. Selecting a tab loads its `view` (parts it leaves out come from `defaultView`) and fires `onViewSelect`. When the current view differs from the tab's, a strip offers Save, Save as and Discard; Save fires `onViewSave` with the tab's `id`, Save as asks for a title (and whether to share it) and fires `onViewSave` without an `id`. A tab's menu offers Delete, which fires `onViewDelete`. The table never stores views itself: update `views` and, for a new view, `activeView`. `locked: true` hides Save and Delete for that tab. Changing the search or collapsing groups never marks a view as changed.
- **`persist`.** Keeps the user's current view and active tab in `localStorage` under `lowdefy-table:deals`, so a returning user sees what they left. A persisted view wins over `activeView` when the page loads.
- **Bulk actions.** While rows are selected, a bar below the table shows "N selected", "Select all M matching", Clear, and the `bulkActions` slot. Blocks in the toolbar and bulk action slots sit side by side at their content width, like the table's own buttons (set `gap` on the slot, or `layout.flex` on a block, to change that). The blocks in it read `_state: deals_table.selected`, and "Assign to me" sends it to `assign_deals`, one `updateMany` (see below).
- **Hover buttons.** `showOn: hover` shows the buttons only on the hovered row, or the row focused with the keyboard. They mount only there, which keeps scrolling fast. The event carries `{ row, rowKey, value, button, buttonIndex }`. `applyTransaction` removes the archived row without a full refetch; in server mode a remove also refetches the visible rows.
- **Inline editing.** Double-click, Enter, F2 or typing on a stage cell opens a select of its `options`. The committed value shows at once with a saving marker while `onCellEdit` runs. If an action fails (a request error, or a `Throw`), the cell reverts and shows the error message. After success the new value shows until the row changes in `data`.

**Bulk assign to every matching row.** In server mode most rows are not in the browser, so the header checkbox, and "Select all M matching" in the bulk bar, select every row the view matches as `{ all: true, except, filter, search }`: the view's filter and search, and the keys the user unticked since. Changing the filter or search clears such a selection, so it always describes the rows the user sees. `MongoDBTableChanges` with `selection` (bulk mode) resolves either shape on the server: a key list becomes `{ _id: { $in: [...] } }`, and an all-matching selection is validated and compiled against `queryFields` exactly as `MongoDBTableQuery` compiles the view, with `{ _id: { $nin: except } }`. The base `filter` is one clause of the `updateMany` filter, so a crafted selection can only narrow it, and `set` / `unset` can write only `fields`, never a scope field. The response is `{ matchedCount, modifiedCount }`.

`fields` and `queryFields` are different key spaces: `queryFields` are the `MongoDBTableQuery` fields keyed by column key (`owner`, with `path: owner.name`), `fields` are keyed by the field path written (`owner.name`). Keep the query fields in one file and `_ref` it from both requests.

To edit more columns, give each one its own request and pick it with the column key: `params: { _string.concat: [update_deal_, { _event: column.key }] }`. Do not build the `$set` field name from the event: the browser could then write any field. Alternatively, save the edit with [MongoDBTableChanges](/MongoDB), which checks the field against its `fields` allowlist and coerces the value to the field type.

### Peek drawer

A click opens the row in a drawer; Cmd/Ctrl+click still follows `rowLink`.

```yaml
- id: deals_table
  type: Table
  properties:
    data:
      _request: deals
    rowLink:
      pageId: deal
      urlQuery:
        _id: _id
    columns:
      - key: name
        title: Deal
      - key: stage
        type: tag
      - key: amount
        type: currency
  events:
    onRowClick:
      - id: set_peek
        type: SetState
        params:
          peek:
            _event: row
      - id: open_peek
        type: CallMethod
        params:
          blockId: peek_drawer
          method: setOpen
          args:
            - open: true
- id: peek_drawer
  type: Drawer
  properties:
    title:
      _state: peek.name
  blocks:
    - id: peek_amount
      type: Statistic
      properties:
        title: Amount
        value:
          _state: peek.amount
```

With `onRowClick` defined, a plain click runs it instead of following `rowLink`. `onRowClick` receives `{ row, rowKey, index }`; `index` is the row's position in `data`, whatever the sort (with `tree.childrenField`, in the depth-first list of every row). In server mode it is the row's index in the rows the request matches (inside a group, in the group), and it is `null` for a row that is not in `data`, such as one added with `applyTransaction`.

### Picker

Choose rows and read the selection from state. No events needed.

```yaml
- id: pick_contacts
  type: Table
  properties:
    data:
      _request: contacts
    height: 360
    rowSelection:
      type: checkbox
      preserve: true # keep keys of selected rows that a filter or search hides
    toolbar:
      search: true
    columns:
      - key: name
        type: avatar
        cell:
          nameField: name
      - key: email
        type: email
- id: add_to_campaign
  type: Button
  properties:
    title:
      _string.concat:
        - 'Add '
        - _array.length:
            _if_none:
              - _state: pick_contacts.selected
              - []
        - ' contacts'
  events:
    onClick:
      - id: add
        type: Request
        params: add_contacts # payload: { ids: { _state: pick_contacts.selected } }
```

- `type: radio` picks one row; `selected` is then a list of at most one key.
- Space on a focused row toggles it, and Cmd/Ctrl+C copies the selected rows as tab-separated text.
- `onSelectionChange` fires with `{ selected, rows }` when the selection changes; `rows` are the selected row objects.
- "Select all M matching" in the bulk bar writes `{ all: true, except: [], filter, search }` in client mode too: every row matching the view's filter and search, except the unticked keys. Rows that arrive later and match are selected too, and a filter or search change clears the selection. A picker that needs a list of keys can read the selected row objects from `onSelectionChange` `rows`, or handle both shapes.

### Grouped report with totals

```yaml
- id: sales_report
  type: Table
  properties:
    data:
      _request: sales
    toolbar:
      group: true
      columns: true
      export: true
    defaultView:
      group:
        - key: region
        - key: rep
      aggregates:
        deals: count
    columns:
      - key: region
        groupable: true
      - key: rep
        groupable: true
      - key: deals
        field: name
        title: Deal
      - key: revenue
        type: currency
        aggregate: sum
      - key: margin
        type: percent
        aggregate: avg
      - key: closed
        type: date
        aggregate: latest
```

- Only columns with `groupable: true` group. The Group toolbar button, the header menu ("Group by this column") and the `setGroup` method set `view.group`.
- Groups follow the sort on their column, else the column's `options` order, else first appearance. Empty values group as "(Empty)", last.
- Each group header shows its count and, under their columns, the aggregates in effect: the view's `aggregates` over each column's own `aggregate` (`null` in the view turns a column's default off). The summary footer shows the same aggregates over every filtered row.
- The current group header sticks to the top while its rows scroll.
- Collapsed groups are `view.collapsedGroups`, the JSON of the group's value path: `'["EMEA"]'`, `'["EMEA","Ada"]'`, with `null` for empty values. The `expandAllGroups` and `collapseAllGroups` methods open and close every group.
- A group's checkbox (with `rowSelection`) selects its rows. Space on a group header does the same.
- `exportCsv` exports every row in the current order, including the rows of collapsed groups. A cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return gets a leading `'`, so a spreadsheet opens it as text rather than running it as a formula (CSV injection); plain numbers such as `-12.5` stay numbers.

Aggregates: `sum`, `avg`, `min`, `max`, `count`, `countDistinct`, `countEmpty`, `countNotEmpty`, `percentEmpty` (a fraction), `earliest` and `latest`. In client mode `min` and `max` follow the column's sort order, so they work on text and enum columns too. `MongoDBTableQuery` allows `sum` and `avg` on numeric fields, `min` and `max` on numeric and text fields (text compared by code point unless `options.collation` sets a locale), `earliest` and `latest` on dates, and `countDistinct` only on fields with `groupable: true`.

Server mode groups the same way through `MongoDBTableQuery`: the first request returns the groups with their counts and aggregates, and a group's rows load when it is opened. Server groups start collapsed, open one at a time, and have no group checkbox.

### Tree

Rows nested under a parent, with a chevron in the first column.

```yaml
- id: accounts
  type: Table
  properties:
    data:
      _request: accounts # flat rows with a parent_id
    tree:
      parentField: parent_id # or childrenField: children for nested rows
    rowSelection:
      type: checkbox
      cascade: true # selecting a row selects its descendants
    defaultView:
      sort:
        - key: name
    columns:
      - key: name
        width: 260
      - key: balance
        type: currency
```

- Give exactly one of `childrenField` (nested rows) or `parentField` (flat rows that name their parent's key). Rows whose parent is not in `data`, and rows in a cycle, are roots.
- Right expands a row and Left collapses it (or moves to its parent). The expanded row keys are the `expanded` part of the value, so `SetState: { accounts.expanded: [assets] }` opens a row.
- A sort sorts within each level. A filter or search keeps the ancestors of matching rows.
- Trees are client mode only, and are never grouped. Rows in a tree cannot be dragged.

Load children on demand with `lazy`: a row whose `hasChildrenField` (default `hasChildren`) is true shows a chevron before its children are in `data`, and expanding it fires `onRowExpand { row, rowKey, expanded, needsChildren }`. `needsChildren` is true only when that row is expanded and none of its children are in `data` yet, so skip the load on every other expand and collapse. A row whose request returns no children asks again on its next expand.

```yaml
- id: folders
  type: Table
  properties:
    data:
      _state: folder_rows
    tree:
      parentField: parent
      lazy: true
    columns:
      - key: name
  events:
    onRowExpand:
      - id: load_children
        type: Request
        params: child_folders # payload: { parent: { _event: rowKey } }
        skip:
          _not:
            _event: needsChildren
      - id: add_children
        type: SetState
        skip:
          _not:
            _event: needsChildren
        params:
          folder_rows:
            _array.concat:
              - _state: folder_rows
              - _request: child_folders
```

### Queue

A triage list: status tabs with counts, single-key actions, and focus that moves on to the next row after each one.

```yaml
- id: tickets_queue
  type: Table
  properties:
    data:
      _request: tickets
    height: 520
    keyboard:
      next: true
    toolbar:
      views: true
      search: true
    views:
      - id: open
        title: Open
        locked: true
        count:
          _request: ticket_counts.0.open
        view:
          filter:
            key: status
            op: eq
            value: open
      - id: mine
        title: Assigned to me
        locked: true
        count:
          _request: ticket_counts.0.mine
        view:
          filter:
            and:
              - key: status
                op: eq
                value: open
              - key: assignee
                op: eq
                value:
                  $user: id
    user:
      _user: true
    columns:
      - key: subject
        width: 320
      - key: assignee
        field: assignee.id
        hidden: true
      - key: priority
        type: tag
        options: [urgent, high, normal]
      - key: created
        type: datetime
        cell:
          relative: true
      - key: actions
        type: buttons
        title: ''
        width: 190
        sortable: false
        cell:
          buttons:
            - eventName: onAssign
              title: Take (a)
              key: a
            - eventName: onClose
              title: Close (c)
              key: c
  events:
    onAssign:
      - id: assign
        type: Request
        params: assign_ticket # payload: { _id: { _event: rowKey } }
      - id: refetch
        type: Request
        params: [tickets, ticket_counts]
    onClose:
      - id: close
        type: Request
        params: close_ticket
      - id: refetch_closed
        type: Request
        params: [tickets, ticket_counts]
```

- A button or menu item with `key: a` fires when `a` is pressed on its focused row: the first shown and enabled one with that key, with the same payload as a click. Keys are case-sensitive, and only a bare key counts (no Cmd, Ctrl or Alt). On an editable cell typing opens the editor instead.
- With `keyboard.next`, focus moves to the row that followed once the event's actions finish, even when the action removed the row from the list. A failed action keeps focus where it was.
- `count` on a view shows on its tab. The table does not count rows itself: `ticket_counts` is any request that returns the counts.
- `{ $user: id }` in a filter reads the table's `user` property, set to `{ _user: true }`. In server mode the request resolves `$user` on the server instead (see Security).

### Editable list in a form

`TableInput` edits rows that belong to a form. Its value is never the rows, only the changes made to them, so a long list keeps a small state and saves with one request. See [TableInput](/TableInput) for the full value and every editing key.

The ingredients of a recipe, stored as an array in the recipe document and ordered by a `position` field:

```yaml
id: recipe
type: PageHeaderMenu
requests:
  - id: get_recipe
    type: MongoDBAggregation
    connectionId: recipes
    payload:
      recipe_id:
        _url_query: id
    properties:
      pipeline:
        - $match:
            _id:
              _payload: recipe_id
            org_id:
              _user: organization.id
        - $project:
            title: 1
            items:
              $sortArray:
                input: $items
                sortBy:
                  position: 1
  - id: save_items
    type: MongoDBTableChanges
    connectionId: recipes
    payload:
      recipe_id:
        _url_query: id
      changes:
        _state: items
    properties:
      array:
        documentId:
          _payload: recipe_id
        path: items
      filter:
        org_id:
          _user: organization.id
      positionField: position
      fields:
        ingredient:
          type: text
        qty:
          type: number
        unit:
          type: tag
      changes:
        _payload: changes
events:
  onMount:
    - id: fetch
      type: Request
      params: get_recipe
blocks:
  - id: items
    type: TableInput
    properties:
      data:
        _request: get_recipe.0.items
      addRow: true
      addRowText: Add ingredient
      rowDrag:
        positionField: position
      rowActions:
        delete: true
      defaultView:
        sort:
          - key: position
      columns:
        - key: ingredient
          width: 260
          editable: true
          validate:
            - pass:
                op: notEmpty
              message: Name the ingredient.
        - key: qty
          type: number
          width: 110
          editable: true
          default: 1
        - key: unit
          type: tag
          editable: true
          default: g
          options: [g, ml, pcs]
  - id: save
    type: Button
    properties:
      title: Save
    events:
      onClick:
        - id: save_items
          type: Request
          params: save_items
        # Rows the save named but did not find (another user deleted them, or they are outside
        # the filter) are in unmatchedKeys: nothing was written for them.
        - id: check_saved
          type: Throw
          params:
            throw:
              _gt:
                - _array.length:
                    _if_none:
                      - _request: save_items.unmatchedKeys
                      - []
                - 0
            message: Some ingredients were changed or removed by someone else. Reload the recipe and try again.
        - id: refetch
          type: Request
          params: get_recipe
        - id: reset
          type: CallMethod
          params:
            blockId: items
            method: resetChanges
```

- Editing a cell writes `updated: { <rowKey>: { <field>: value } }`, only the changed fields; an edit back to the original value drops out. "+ Add ingredient" appends a row with each column's `default` (and a position after the last row) to `added` and opens its first editable cell. Its `rowKey` is always a new temporary key: a `default` on the key column is ignored, so added rows never share a key. The delete button (and Delete or Backspace with `deleteRows: true`) adds the key to `removed`.
- `rowDrag.positionField` gives a dragged row one new position (with `pagination`, positions and indices count across every page), the midpoint between its new neighbours, in `moved: { <rowKey>: position }`. A move is one field on one item. Only when two neighbours are closer than 1e-6 is the list renumbered in steps of 1024, which reports every changed position. Dragging is blocked while the table is sorted by anything but the position field ascending, filtered or grouped; the handle says why. Alt+Shift+Up/Down moves the focused row.
- In array mode `MongoDBTableChanges` compiles the changes to `$set` with `arrayFilters` on the changed items, `$pull` for removed ones and `$push` for new ones (new items get an ObjectId `_id`). Only the `fields` listed can be written, values are coerced to the field type, and the base `filter` scopes the document.
- Treat a non-empty `unmatchedKeys` in the response as a failed save: those rows matched nothing, so nothing was written for them (the rest of the save was). The `Throw` stops the actions and shows the message; the changes stay in the table.
- After saving, refetch `data` and call `resetChanges`, which clears the changes and the undo history.

Collection mode, where every row is a document: leave out `array`. The changes compile to one `bulkWrite` of `updateOne` (the changed dot paths and the position, in one `$set`), `insertOne` and `deleteOne`, each scoped by the base `filter`. The `filter` and `insertDefaults` fields are the rows' scope, and the table can never write them: `fields` that name them are refused, new rows are stamped with the `filter`'s equality conditions (here `org_id`), and a row value can never override an `insertDefaults` value:

```yaml
- id: save_contacts
  type: MongoDBTableChanges
  connectionId: contacts
  payload:
    changes:
      _state: contacts_input
  properties:
    filter:
      org_id:
        _user: organization.id
    fields:
      name:
        type: text
      email:
        type: email
      role:
        type: tag
    insertDefaults: # org_id comes from the filter
      created:
        _date: now
      created_by:
        _user: id
    changes:
      _payload: changes
```

The `fields` keys are the `TableInput` column `field` paths, the keys of the changes, not the column keys `MongoDBTableQuery` uses. Numeric row keys match in both forms (a key `5` arrives as `"5"` in `updated` and matches a document `_id` of `5` or `"5"`); set `rowKeyType` if a collection holds both as different rows.

Without a `positionField`, `rowDrag: true` records the full key `order` after a move instead. Array mode applies it by reordering the items on the server; collection mode needs a `positionField` to save an order. The response's `insertedKeys` maps each added row's temporary key to the key it got. See [MongoDBTableChanges](/MongoDB) for the response, row key types and limits.

## Columns

A column is an object, or just its key:

```yaml
columns:
  - name # key and field "name", title "Name"
  - key: owner_name
    field: owner.name # a dot path into the row
    title: Owner
  - key: amount
    type: currency
    cell:
      currency: EUR
    width: 140
    aggregate: sum
```

| Key                                                            | Meaning                                                                                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `key`                                                          | The column id, unique in the table, used in the view, filters, events and `MongoDBTableQuery` `fields`. Defaults to `field`. Two columns showing the same field need their own keys. |
| `field`                                                        | Dot path of the value in each row. Defaults to `key`. `TableInput` records edits under it, and `MongoDBTableChanges` `fields` are keyed by it.                                       |
| `title`, `headerTooltip`                                       | Header text and a header tooltip; both support html. The title defaults to the key in sentence case.                                                                                 |
| `type`, `cell`                                                 | The cell type (below) and its options.                                                                                                                                               |
| `width`, `minWidth`, `maxWidth`, `flex`                        | Pixels (default width 160, minimum 48). `flex` grows the column into spare width by that weight.                                                                                     |
| `align`                                                        | `start`, `center` or `end`; number, currency and percent default to `end`.                                                                                                           |
| `pinned`                                                       | `start` or `end`: stays in view while the table scrolls sideways.                                                                                                                    |
| `wrap`, `ellipsis`                                             | Text stays on one line by default. `wrap: true` wraps it, `ellipsis: 2` clamps it to two lines with the full text on hover; both make rows as tall as their content.                 |
| `hidden`                                                       | Declared but hidden: users can show it from the column manager.                                                                                                                      |
| `sortable`, `filterable`, `resizable`, `groupable`, `editable` | Per-column switches, defaulting to `defaultColumn` (sortable, filterable and resizable on; groupable and editable off). `editable` also takes `{ when: <condition> }`.               |
| `searchable`                                                   | Include the column in the search. When any column sets it, search reads only those; otherwise every visible column.                                                                  |
| `aggregate`                                                    | The column's default aggregate for group headers and the summary footer.                                                                                                             |
| `options`                                                      | Labels and colours for enum values (below).                                                                                                                                          |
| `tooltip`                                                      | A plain-text hover tooltip: a nunjucks template with `value` and `row`, `{ template }` or `{ field }`.                                                                               |
| `rules`                                                        | Conditional formatting (below).                                                                                                                                                      |
| `validate`, `required`, `default`                              | Editing: checks before an edit commits, and a `TableInput` new row's value (ignored on the key column, which always gets a new temporary key).                                       |
| `children`                                                     | Columns grouped under a shared header (the group needs a `title`).                                                                                                                   |

`columns` is data, so it can come from a request: `columns: { _request: deal_fields }`. Columns added to config later appear in stored views as hidden, and unknown keys in a stored view are dropped.

### Cell types

The type decides how a value renders, sorts, filters, aggregates, exports and edits.

| `type`                          | Shows                                                                                               | `cell` options                                                                                                                                                                                                                                                                                                                    | Sorts as                | Editor                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------- |
| `text`                          | the value (the default)                                                                             |                                                                                                                                                                                                                                                                                                                                   | text                    | text input                  |
| `number`, `currency`, `percent` | `Intl.NumberFormat` text; `percent` shows 0.25 as 25%                                               | `format` (`number`, `currency`, `percent`, `compact`), `locale`, `currency` (default `USD`), `currencyDisplay`, `decimals`, `minDecimals`, `maxDecimals`, `notation`, `useGrouping`, `negative` (`parentheses`), `prefix`, `suffix`, `signColor`, `positiveColor`, `negativeColor`, `zeroColor`, `color`, `thresholds` + `colors` | number                  | number input                |
| `date`, `datetime`              | a dayjs format (default `YYYY-MM-DD` / `YYYY-MM-DD HH:mm`), or relative time with the date on hover | `format`, `relative`                                                                                                                                                                                                                                                                                                              | time                    | date picker                 |
| `boolean`                       | a label or an icon                                                                                  | `trueLabel`, `falseLabel`, `trueColor`, `falseColor`, `trueIcon`, `falseIcon`                                                                                                                                                                                                                                                     | false before true       | switch                      |
| `tag`, `status`                 | a tinted tag, or a dot and a label                                                                  | `colorMap`, `colorFrom`, `default`                                                                                                                                                                                                                                                                                                | option order, else text | select from `options`       |
| `tags`                          | a list of tags: the ones that fit the column whole, then a +N count (`max` caps how many show)      | `colorMap`, `colorFrom`, `default`, `max`                                                                                                                                                                                                                                                                                         | text                    | multi-select from `options` |
| `avatar`                        | initials or an image, and the name                                                                  | `nameField`, `srcField`, `idField`, `shape`, `link`                                                                                                                                                                                                                                                                               | text                    | none                        |
| `people`                        | overlapping avatars with a +N count                                                                 | `nameField`, `srcField`, `idField`, `shape`, `max` (default 3)                                                                                                                                                                                                                                                                    | text                    | none                        |
| `link`                          | a link that navigates by itself                                                                     | `pageId`, `href`, `urlQuery`, `newTab`, `home`, `back`, `input`, `labelField`                                                                                                                                                                                                                                                     | text                    | none                        |
| `email`, `phone`, `url`         | `mailto:`, `tel:` and external links                                                                | `label`, `labelField`, `newTab` (url)                                                                                                                                                                                                                                                                                             | text                    | text input                  |
| `relation`                      | related records as chips linking to their page                                                      | `labelField`, `pageId`, `href`, `urlQuery`, `newTab`                                                                                                                                                                                                                                                                              | text                    | none                        |
| `progress`                      | a bar                                                                                               | `max` (default 100), `suffix`, `color`, `thresholds`, `colors`, `showValue`, `nullLabel`                                                                                                                                                                                                                                          | number                  | none                        |
| `rating`                        | stars                                                                                               | `max`, `color`                                                                                                                                                                                                                                                                                                                    | number                  | stars                       |
| `image`                         | a lazy thumbnail                                                                                    | `width`, `height`, `shape`, `alt`, `altField`                                                                                                                                                                                                                                                                                     | text                    | none                        |
| `html`                          | a nunjucks template, or a field holding HTML                                                        | `template`                                                                                                                                                                                                                                                                                                                        | text                    | none                        |
| `json`                          | a one-line preview                                                                                  |                                                                                                                                                                                                                                                                                                                                   | its JSON text           | none                        |
| `buttons`                       | row buttons                                                                                         | `buttons`, `showOn`                                                                                                                                                                                                                                                                                                               | not sortable            | none                        |
| `menu`                          | a row menu                                                                                          | `items`, `icon`, `title`, `placement`                                                                                                                                                                                                                                                                                             | not sortable            | none                        |

- Values in `urlQuery` and every `...Field` option are paths in the row. For `people` they are paths in each person, and for `relation` paths in each related record, where `urlQuery` defaults to `{ _id: _id }`.
- A `url` value with a scheme other than http or https, such as `javascript:`, shows as text.
- An `html` cell's template gets `value` and `row` and is compiled once per column. Values are escaped: use `| safe` to insert HTML held in a field. The output is sanitised, and `data-event` attributes fire block events.
- `buttons` and `menu` cells hold no data: they are left out of filters, search and exports. Each button or menu item fires the block event named by its `eventName` with `{ row, rowKey, value, button: { eventName, title }, buttonIndex }` or `{ row, rowKey, value, item: { eventName, title }, itemIndex }`. The keys match the AgGrid buttons and menu cells: `title` / `titleField`, `icon` / `iconField`, `hidden` / `hiddenField`, `disabled` / `disabledField`, `type`, `variant`, `color`, `size`, `shape`, `danger`, `ghost`, `hideTitle`, `tooltip`, `iconPlacement`, and `key` (a single-key shortcut). `hidden` and `disabled` also take `{ when: <condition> }`. An icon-only button shows its title as a tooltip. `showOn: hover` shows the buttons only on the hovered row or the row focused with the keyboard (touch screens always show them).
- A `link` cell navigates by itself and also fires `onCellLink { link, row, value }`; do not add a `Link` action to that event.

### Options: labels and colours for enum values

`options` gives the labels and colours of `tag`, `tags` and `status` values, the choices of their filters and editors, and the labels of their group headers and exports. It takes a list of values or `{ value, label, color, icon }`, or a map from value to a label or `{ label, color, icon }`:

```yaml
- key: stage
  type: status
  options:
    lead: Lead
    qualified: { label: Qualified, color: processing }
    won: { label: Won, color: success }
    lost: { label: Lost, color: error }
```

Colours are the antd presets (`blue`, `green`, `gold`, ...), the status names (`success`, `processing`, `warning`, `error`) or any CSS colour; the presets and status names follow the theme and dark mode. Enum columns sort and group in option order. A value without an option, in a column without `options` or colour keys, gets a colour picked from the value, so the same value always has the same colour. `options` can come from a global: `options: { _global: enums.deal_stages }`.

## Conditions

One condition language serves filters (`view.filter`, the filter builder, quick filters), `rules`, `rowRules`, `editable.when`, `expandable.rowExpandable.when`, button and menu `hidden` / `disabled`, and `validate`. A condition is a leaf `{ key, op, value }`, or a group `{ and: [...] }` / `{ or: [...] }` of conditions, nested to any depth (the filter builder edits three levels).

```yaml
filter:
  and:
    - { key: stage, op: in, value: [lead, qualified] }
    - or:
        - { key: owner, op: eq, value: { $user: id } }
        - { key: amount, op: gte, value: 10000 }
    - { key: created, op: within, value: { last: 30, unit: day } }
```

`key` names a column (its type picks the comparison), or, when no column has that key, a field path in the row. In a column's `rules`, `validate` and `editable.when`, a leaf without `key` tests the column's own value.

| Operators                                                                      | For                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `eq`, `ne`, `in`, `nin`, `empty`, `notEmpty`                                   | every type                                                         |
| `contains`, `notContains`, `startsWith`, `endsWith`                            | text, email, phone, url, link, html, relation, tag, status, avatar |
| `gt`, `gte`, `lt`, `lte`, `between` (`value: [from, to]`)                      | number, currency, percent, progress, rating                        |
| `before`, `after`, `between`, `within`                                         | date, datetime                                                     |
| `isTrue`, `isFalse`                                                            | boolean                                                            |
| `in` (has any of), `nin` (has none of), `contains` (has the value), `eq`, `ne` | tags, people                                                       |

- Text comparisons ignore case. `empty` matches null, a missing value, `''` and `[]`.
- Numbers compare as numbers, so numeric strings work.
- A `date` column compares whole days: `eq: 2026-03-01` is that day, and `lte: 2026-03-01` includes all of it. A `datetime` column compares the exact instant for `before`, `after` and `between`; `eq` compares the day for both.
- `within` takes `{ last: n, unit }` or `{ next: n, unit }` with unit `day`, `week`, `month` or `year`: from the start of the day n units ago to the end of today, or from the start of today to the end of the day n units ahead.
- `isFalse` matches every value that is not `true`, including empty values.
- Records in a list (`people`, `relation`) compare by `_id`, then `id`, `value`, `name` or `label`, and text operators read their label.
- `{ $user: path }` as a value reads the table's `user` property, which blocks need because they do not see the session: set `user: { _user: true }`. A shared saved view with `{ $user: id }` then means "mine" for every user. In server mode the filter goes to the request, which resolves `$user` on the server from its own `user` property.

### Conditional formatting

```yaml
rowRules:
  - when: { key: overdue, op: isTrue }
    className: row-overdue
columns:
  - key: score
    type: number
    rules:
      - when: { op: gte, value: 8 }
        color: success
      - when: { op: lt, value: 5 }
        color: error
        style: { fontWeight: 600 }
```

Every rule whose `when` holds applies, in order: class names add up, and a later rule's `color` and `style` win. `color` is a text colour (the status names follow the theme). A rule without `when` always applies. Relative dates in rules are resolved when the column config compiles, not re-evaluated as time passes.

## The view

The view is one serialisable object, the `view` part of the value:

| Key               | Holds                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `columns`         | `[{ key, width, pinned, hidden }]` in display order                                                                                                                                                          |
| `sort`            | `[{ key, desc }]`, outermost first                                                                                                                                                                           |
| `filter`          | a condition, or null                                                                                                                                                                                         |
| `search`          | the search text: rows match when every word appears (ignoring case) in the display text of the searched columns                                                                                              |
| `group`           | `[{ key }]` of groupable columns, outermost first                                                                                                                                                            |
| `collapsedGroups` | keys of collapsed groups                                                                                                                                                                                     |
| `aggregates`      | `{ <columnKey>: <fn> \| null }` over the columns' own `aggregate`                                                                                                                                            |
| `density`         | `compact` (32px rows), `default` (40px) or `comfortable` (52px); starts from `size`                                                                                                                          |
| `wrap`            | `true` wraps the text of text-like columns (text, email, phone, url, link, html, relation) without their own `wrap` or `ellipsis`; rows grow to their content. The toolbar density control has a Wrap toggle |
| `pageSize`        | rows per page with `pagination`; defaults to the `pageSize` property                                                                                                                                         |

- `defaultView` sets the initial view and the one `Reset` returns to. Each part missing from the value falls back to `defaultView`, then to the column defaults. `defaultView.columns` entries merge over the column config, and columns it leaves out keep their defaults.
- While the column layout equals the configured one, the derived view leaves `columns` out, so columns added to config keep appearing until the user changes the layout.
- `SetState` on any part loads it: `SetState: { deals.view.sort: [{ key: amount, desc: true }] }`. So do the methods `setFilter`, `clearFilters`, `setSearch` and `setGroup`.
- `onChange` fires after the user changes the view or the selection, with `{ value, cause }`; `cause` is `sort`, `filter`, `search`, `columns`, `select`, `group`, `aggregate`, `expand`, `density`, `wrap` (the toolbar Wrap toggle) or `view` (a saved view loaded). It does not fire for `SetState`, `Reset` or the initial value.
- To share a view in a link, `persist: { key: view, storage: url }` writes a compact encoding of the view to the `view` query parameter as it changes (with `history.replaceState`), and reads it on load.

`persist: { key, storage: local }` (the default storage) keeps the view in `localStorage` under `lowdefy-table:<key>`; a private window or blocked storage just means no persistence. The selection is never persisted. Persisted views outlive config changes (unknown keys are dropped and new columns appended hidden), which is why persistence is opt-in.

A saved view can carry `wrap` and `pageSize` like any other part: `defaultView: { pageSize: 25 }` or a view tab with `wrap: true`. There is no page size picker; set `view.pageSize` with `SetState` to change it.

## Keyboard

Click a cell, or Tab into the table, and the focused cell shows a ring.

| Key                                    | Does                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arrow keys                             | Move between cells (Up from the first row reaches the header)                                                                                                 |
| Home / End                             | First / last cell of the row                                                                                                                                  |
| Cmd/Ctrl+Home / End                    | First / last cell of the table                                                                                                                                |
| PageUp / PageDown                      | Up or down by a screen of rows                                                                                                                                |
| Enter                                  | On a header: sort (Shift+Enter adds a level). On a row: follow `rowLink` or fire `onRowClick`. On an editable cell: edit. On a group header: open or close it |
| Space                                  | Toggle the row's checkbox (or a group's rows, on a group header)                                                                                              |
| Right / Left                           | In a tree or on a group header: expand / collapse                                                                                                             |
| Enter, F2, or typing                   | Open the cell editor (typing starts with that character)                                                                                                      |
| Enter, Tab, Shift+Tab                  | In an editor: commit (Tab moves to the next editable cell and opens it)                                                                                       |
| Esc                                    | In an editor: cancel. In a control inside a cell: back to the cell                                                                                            |
| Alt+Shift+Up / Down                    | Move the focused row (`rowDrag`)                                                                                                                              |
| Alt+Down, Shift+F10, context menu key  | Open the focused header's menu                                                                                                                                |
| Cmd/Ctrl+C                             | Copy the selected rows, or the focused cell, as tab-separated displayed text. A text selection copies as usual                                                |
| Cmd/Ctrl+F                             | Focus the toolbar search (with `toolbar.search`)                                                                                                              |
| A letter                               | Fire the row button or menu item with that `key`                                                                                                              |
| Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z or Ctrl+Y | `TableInput`: undo / redo                                                                                                                                     |
| Delete or Backspace                    | `TableInput` with `deleteRows`: delete the focused row                                                                                                        |
| Cmd/Ctrl+V                             | `TableInput`: paste tab-separated text over the cells from the focused one                                                                                    |

Skeleton rows (loading rows, and server rows not loaded yet) are not cells you can focus: an arrow key onto one moves focus to that row once it loads.

In the column manager, Alt+Up / Down on a column's handle moves it. `keyboard: false` turns off cell navigation (arrows, Home/End, PageUp/PageDown, Enter and Space on cells), tree Right/Left and `TableInput` paste. Copy, Cmd/Ctrl+F, the header menu keys, the keys of a focused group header, single-key row actions and the editing keys keep working, and the grid roles stay for screen readers.

## Performance

- **Virtualisation.** With `virtual: auto` the table renders only the rows in view once there are more than 200 display rows (groups count), and only the columns in view once there are more than 20 scrolling columns or the table is wider than twice its viewport. Pinned columns always render. Scrolling never re-renders the engine or touches Lowdefy state.
- **Fixed heights are fastest.** Rows are one fixed height from the density (32, 40 or 52px) or `rowHeight`. A column with `wrap: true` or `ellipsis` above 1 makes rows as tall as their content: heights are measured as rows render, and column virtualisation turns off, since a row's height then depends on every cell in it. Expandable detail rows are measured too.
- **Rich cells.** Hover buttons mount only on the hovered row or the row focused with the keyboard. During a fast scroll, avatar, tag, button and other rich cells show their text and upgrade when the scroll settles. Templates compile once per column, and the template compiler (about 36 kB gzipped) loads only for a table with an `html` template, a template tooltip or `expandable`.
- **Data updates.** Rows are compared by key, so a refetch re-renders only rows whose content changed. `rowVersionField`, a dot path such as `updated.timestamp`, compares rows by key and that field instead of by content; a row without the field is compared by content. `applyTransaction` adds, updates or removes rows without replacing `data`.
- **Big client data.** Sort, filter and group of 100k rows stay under the 60fps budget in the benchmark (text sort keys and the first search are built in time slices, without blocking). Keep `data` a plain request result: an `_js` or `_function` in it runs on every page update.
- **Server mode** is for data the browser should not hold. `blockSize` (default 200) sets the rows per request and `maxBlocks` (default 20) the blocks kept; loads wait for a fast scroll to settle.
- **TableLight renders every row** with antd's Table: keep it to hundreds of rows. It logs a development warning above 1,000.

## Server mode security

In server mode the browser sends the view, and the view is user input. `MongoDBTableQuery` is built so that it can only narrow what the base query allows:

- **The allowlist.** Only keys in `fields` can be sorted, filtered, searched, grouped or aggregated, only with the operators and aggregates their `type` allows, and only with values of that type. Anything else is refused before the query runs. Regex input is escaped, and the view can not send `$where`, `$expr` or pipeline stages.
- **The base pipeline runs first.** Put tenant, ownership and permission scoping in `pipeline`, evaluated on the server with `_user`, never in the payload. On a tenant connection the tenant scope comes before it.
- **Only allowed fields leave the server.** With `project: true` (the default) each row returns only `_id`, the `fields` paths and the `returnFields` paths, even when the documents hold more. List in `returnFields` the paths cells read without a field of their own: an avatar `srcField`, a link or relation `labelField`, a `rowKey` other than `_id`. `project: false` returns what the base pipeline leaves, for a pipeline that ends in its own `$project`.
- **`user: { _user: true }`** on the request resolves `{ $user: path }` filter values on the server from the session. A browser-sent user value is never used, and a missing one throws instead of matching empty fields.
- **Bounded requests.** One view may have at most 200 filter conditions and groups (nested at most 8 deep), 1000 filter values in all (500 per `in` / `nin`), strings of at most 200 characters, 10 sort keys and 5 group levels, and a request returns at most `maxRows` (default 1000) rows or groups. The aggregation stops after `options.maxTimeMS`, 10 seconds by default. A request over a limit throws before it runs.
- **Selections.** An all-matching selection `{ all: true, except, filter, search }` is not a list of keys. `MongoDBTableChanges` with `selection` recomputes the set on the server: its filter and search are validated against `queryFields` like a view, and the base `filter` is ANDed in, so a crafted selection can not widen a bulk action beyond what the user can read.
- **Saves.** `MongoDBTableChanges` writes only the `fields` listed, at their paths, with coerced values, scoped by its base `filter`; row keys and values that are operator objects are refused. Fields that overlap a `filter` or `insertDefaults` field are refused, so a save can not move a row out of scope, and new rows are stamped with the `filter`'s equalities.

Every column the user can sort or filter must be in `fields`, or the request fails when they try. Set `sortable: false` and `filterable: false` on columns the request does not allow, and give `toolbar.search` only to tables whose request has `search: true` fields. Server search matches the raw field values, not the display labels a client-side search reads.

**Time zones and indexes.** The browser compares date filters by the user's local days, the server by the days of the request's `timezone` (UTC by default): pass the user's time zone, as `deals_page` does. The request sorts before it pages, so an index on the base match, filter and sort fields (for example `{ org_id: 1, updated: -1, _id: 1 }`) serves each block; without one, MongoDB sorts every matching document for every block. Add indexes for the sorts a large table offers.

## Enrichment tables

Enrichment tables compute columns from other columns, per row: an `enrichment` column calls a provider (an API endpoint of the app), an `ai` column runs a prompt, a `formula` column fills a template in the browser, and an `extract` column reads a value out of another column's result. Users add columns and rows at runtime, run a column, a row or a selection, and open a cell to see its raw result. The run queue lives in the rows, in MongoDB: see [MongoDB enrichment run queue](/MongoDB) for the three requests and the worker endpoint.

```yaml
- id: leads_table
  type: Table
  properties:
    providers: # the catalogue the add-column picker offers; each maps to enrich_<id>
      _ref: leads/providers.yaml
    addColumn: true # the "+" header and its picker
    addRow: true # "+ New row"
    importCsv: true # the toolbar's Import button: CSV files of at most 50 MB and 100,000 rows
    inputFieldPrefix: values # user input columns keep their values at values.<key>
    columns:
      _request: get_columns # declared and user-defined columns, merged on the server
    data:
      _request: leads
```

The enrichment feature loads in its own chunk, only for tables that use it (an enrichment, ai, extract, `status` or user-defined column, `providers`, `addColumn`, `addRow` or `importCsv`). Formula columns alone do not load it.

**Column kinds.** An `ai` column takes `prompt`, `inputs` (every column the prompt uses), `provider` (default `ai`, the app's `enrich_ai` endpoint) and `output: { type, options? }`: the answer is `text`, `number`, `boolean`, `tag` or `tags`, and `tag` and `tags` take `options`, the answers allowed, each its text or `{ value, color }` (the picker shows the options as chips in one field, each starting on a distinct tone, with a colour button of preset tones and a remove button; a user-defined column's option colours are tone names, never CSS values, since they are painted in every viewer's browser). A user-defined column's options without a colour (plain strings written through an API, or a column saved before options had colours) get the tones the picker would give them, in option order, so they look like a picker-made column; a declared column's options without a colour stay neutral, as the config author wrote them. An `enrichment` column takes a `provider` from `providers`, `inputs` mapped to columns or literal values, and `output`, the path of its value in the provider result. A catalogue provider with id `ai` is the AI kind's provider: the picker shows it once, as the AI entry.

**Inputs read stored values.** An enrichment or ai column's inputs (and an AI prompt's placeholders) read input and data columns (fields the server can read) or other enrichment and ai columns (their result, once done). Formula and extract columns compute in the browser and are never stored, so the server can not send them to a provider: the picker does not offer them, and a column that reads one is refused (a declared column is a config error, a user-defined one an error column). To send a combined value to a provider, map each part as an input; to read a nested result, map the enrichment column itself and pick the path in your provider endpoint. A formula template can read any column.

**Templates are placeholders.** Formula templates and AI prompts only take `{{ column }}` placeholders (a column key or a dot path), filled in as plain text. They are user content shared between users, and a template engine would run them as code, so the Table refuses tags (`{% %}`), comments (`{# #}`) and expressions (`{{ name | upper }}`), and so should the endpoint that saves a column. Fill prompts on the server with plain string replacement, never `_nunjucks`. A placeholder is `{{ key }}` or `{{ key.path }}` (a dot path into that column's or input's value), optionally with whitespace control (`{{- key -}}`); a key starts with a letter, `_` or `$` and may hold `-`, but not end with one. The server that fills prompts must accept exactly the placeholders the Table does, with the same pattern, so no placeholder the Table accepts is left unfilled (the reference app's `check_column` and `enrich_ai` use it).

**User-defined columns.** Columns with `userDefined: true` get Rename, Edit, Duplicate, Insert and Delete in their header menu (each shown when the table has the event it fires). A user-defined column whose config is invalid (an unknown provider or answer type, an input column that was deleted) renders as an error column instead of breaking the table: its cells show "Invalid column: <reason>", its header is marked, and its menu offers Edit column and Delete column. A declared column with an invalid config is a config error.

A user-defined column is one user's content rendered in every viewer's browser, so the Table only takes text-safe config from it: its type must be one of `text`, `email`, `phone`, `url`, `number`, `currency`, `percent`, `progress`, `rating`, `date`, `datetime`, `boolean`, `tag`, `tags`, `status` or `json` (an `html`, `image`, `avatar`, `people`, `link`, `relation` or action type makes it an error column; with no type it is `text`, whatever `defaultColumn` sets), and its `cell`, `rules`, `validate` and template tooltips are ignored (a `{ field }` tooltip is kept). The add-column picker offers only these types. Check stored columns against the same list on the server, as the reference app's column check does.

**CSV import.** The Import button parses the file in the browser and suggests a column for each header: one whose key or title matches it (ignoring case, spaces and punctuation), then a common synonym ("Website" or "URL" for a domain column, "Employer" or "Organisation" for a company, "Role" for a job title, "Full name" for a name, "E-mail" for email), then a close spelling. Suggestions that are not a column's own name are marked until the user picks another column, and headers without a match become new text columns.

**Values at field paths.** `onRowAdd` `values` and `onImport` `rows` carry every value at its column's `field` path. New input columns from the picker or a CSV import carry their `field` too, under `inputFieldPrefix` (`values.notes` with `inputFieldPrefix: values`), so the endpoint that stores them only has to accept the paths of its `fields` allowlist. Build that allowlist on the server, with the user input columns added:

```yaml
fields:
  _js:
    fn: |
      const fields = { ...args.declared };
      args.columns
        .filter((column) => column.userDefined === true && column.kind === 'input')
        .forEach((column) => {
          fields[column.key] = { type: column.type ?? 'text', path: `values.${column.key}` };
        });
      return fields;
    args:
      declared:
        _ref: leads/fields.yaml
      columns:
        _step: load_columns
```

**Read columns on the server.** Endpoints that enqueue runs or run the worker read the table's columns themselves (declared columns plus the stored user columns), never from the event payload: a browser can send any column config. Check every user column when it is saved (its key, provider, inputs, prompt and template), as the enrichment reference app's column check does.

**Errors users can read.** A cell's `error` is shown to every user of the table: in the cell's tooltip ("Failed after 3 attempts" and the message, shortened) and whole in the details panel. Store messages a user can act on, not the error a connection threw, which names the app's connection and carries the service's response (`company_api: Server returned error 500...`). In the worker's `:catch` and in provider endpoints, map a thrown error to its status (`Provider error (500)`, `Rate limited by the provider (429)`, `The provider did not respond`) and leave the full error to the server log, as the reference app's `run_cell` and `enrich_company_lookup` do.

**Loading.** Wire `loading` to the rows request (`_request_details: leads.0.loading`) and reload columns and rows with `holdValue: true` after a column or row change, so the table keeps its rows and columns on screen while they reload; the first load shows the table's skeleton rows. The picker, details panel and import dialog open at once, with a spinner while their code loads.

**Live results.** Push cell updates to the table with `applyTransaction({ update })` from a websocket (`MongoDBChangeStream` on the rows) that sends each changed row's `fullDocument` (projected to the fields the table shows, `_enrich` whole). The default shallow merge replaces each top-level field, so a cell whose rerun found nothing loses its old `value`, `raw` and `inputHash`, as the server unset them. Keep `merge: 'deep'` for partial patches you build yourself: a deep merge never removes a key, so a formula, an extract column or the stale marker would keep reading what the server removed.

## Moving from TableLight or AgGrid

- **From TableLight:** change `type: TableLight` to `type: Table`. Every property keeps its meaning; set `pagination: true` if you relied on TableLight's automatic pager.
- **From AgGrid:** move column config by hand. `field` stays `field`, `headerName` becomes `title`, `cell.type` becomes the column's `type` and the rest of `cell` stays. Row events carry `{ row, rowKey, index }`, and button and menu events the same payloads as AgGrid's button and menu cells. `AgGridInput*` holds the rows as its value; `TableInput` holds the changes, saved with `MongoDBTableChanges`.

```yaml
- id: deals_basic
  type: Table
  properties:
    columns:
      - key: name
        title: Deal
        width: 220
      - key: stage
      - key: owner
      - key: amount
        type: number
    data:
      - _id: d1
        name: Acme renewal
        stage: proposal
        owner: Ada
        amount: 12000
      - _id: d2
        name: Globex expansion
        stage: qualified
        owner: Grace
        amount: 48000
      - _id: d3
        name: Initech pilot
        stage: lead
        owner: Alan
        amount: 3500
```

```yaml
- id: deals_typed
  type: Table
  properties:
    columns:
      - key: name
        title: Deal
        width: 200
        pinned: start
      - key: stage
        type: status
        options:
          lead: Lead
          qualified:
            label: Qualified
            color: processing
          won:
            label: Won
            color: success
          lost:
            label: Lost
            color: error
      - key: owner
        type: avatar
        cell:
          nameField: owner
      - key: amount
        type: currency
        cell:
          currency: EUR
          decimals: 0
      - key: probability
        type: progress
        width: 140
      - key: labels
        type: tags
        options:
          - value: renewal
            color: blue
          - value: strategic
            color: purple
          - value: at-risk
            label: At risk
            color: red
      - key: updated
        type: date
        cell:
          format: D MMM YYYY
      - key: website
        type: url
        cell:
          label: Visit
    data:
      - _id: d1
        name: Acme renewal
        stage: won
        owner: Ada Lovelace
        amount: 12000
        probability: 100
        labels:
          - renewal
        updated: 2026-09-21
        website: https://example.com
      - _id: d2
        name: Globex expansion
        stage: qualified
        owner: Grace Hopper
        amount: 48000
        probability: 60
        labels:
          - strategic
        updated: 2026-09-02
        website: https://example.org
      - _id: d3
        name: Initech pilot
        stage: lead
        owner: Alan Turing
        amount: 3500
        probability: 20
        labels:
          - at-risk
          - renewal
        updated: 2026-08-15
      - _id: d4
        name: Umbrella upsell
        stage: lost
        owner: Ada Lovelace
        amount: 9000
        probability: 0
        labels: []
        updated: 2026-07-30
```

```yaml
- id: deals_selection
  type: Table
  properties:
    rowSelection:
      type: checkbox
    defaultView:
      sort:
        - key: amount
          desc: true
      density: compact
    columns:
      - key: name
        title: Deal
        width: 220
        pinned: start
      - key: stage
      - key: owner
      - key: amount
        type: number
    data:
      - _id: d1
        name: Acme renewal
        stage: proposal
        owner: Ada
        amount: 12000
      - _id: d2
        name: Globex expansion
        stage: qualified
        owner: Grace
        amount: 48000
      - _id: d3
        name: Initech pilot
        stage: lead
        owner: Alan
        amount: 3500
- id: deals_selected
  type: Span
  properties:
    content:
      _string.concat:
        - "Selected: "
        - _json.stringify:
            - _state: deals_selection.selected
            - space: 0
```

```yaml
- id: contacts_toolbar
  type: Table
  properties:
    toolbar:
      search: true
      quickFilters:
        - status
      filter: true
      sort: true
      columns: true
      density: true
      export: true
    columns:
      - key: name
        width: 180
      - key: email
        type: email
        width: 220
      - key: company
      - key: status
        type: tag
        options:
          - value: active
            label: Active
            color: green
          - value: churned
            label: Churned
            color: red
          - value: trial
            label: Trial
            color: gold
      - key: signed_up
        type: date
        cell:
          relative: true
    data:
      - _id: c1
        name: Ada Lovelace
        email: ada@example.com
        company: Acme
        status: active
        signed_up: 2026-01-12
      - _id: c2
        name: Grace Hopper
        email: grace@example.com
        company: Globex
        status: trial
        signed_up: 2026-09-20
      - _id: c3
        name: Alan Turing
        email: alan@example.com
        company: Initech
        status: churned
        signed_up: 2025-06-01
      - _id: c4
        name: Katherine Johnson
        email: katherine@example.com
        company: Acme
        status: active
        signed_up: 2026-04-03
  slots:
    toolbarStart:
      blocks:
        - id: contacts_toolbar_new
          type: Button
          properties:
            title: New contact
            icon: add
            size: small
```

```yaml
- id: notes_paged
  type: Table
  properties:
    pagination: true
    defaultView:
      pageSize: 2
      wrap: true
    columns:
      - key: title
        width: 160
      - key: note
        width: 260
    data:
      - _id: n1
        title: Kick-off
        note: Agree the scope, the owners of each workstream and the first review date.
      - _id: n2
        title: Design review
        note: Walk through the flows with support and sales before the build starts.
      - _id: n3
        title: Launch
        note: Announce in the changelog and email every customer on the beta list.
```

```yaml
- id: deals_links
  type: Table
  properties:
    rowLink:
      pageId: deal
      urlQuery:
        _id: _id
    columns:
      - key: name
        title: Deal
      - key: owner
    data:
      - _id: d1
        name: Acme renewal
        owner: Ada
      - _id: d2
        name: Globex expansion
        owner: Grace
```

```yaml
- id: tickets_bulk
  type: Table
  properties:
    rowSelection:
      type: checkbox
    columns:
      - key: subject
        width: 260
      - key: requester
      - key: priority
        type: tag
        options:
          - value: high
            label: High
            color: red
          - value: normal
            label: Normal
            color: blue
      - key: actions
        type: buttons
        title: ""
        width: 96
        pinned: end
        sortable: false
        cell:
          showOn: hover
          buttons:
            - eventName: onReply
              title: Reply
              icon: mail
              hideTitle: true
            - eventName: onClose
              title: Close
              icon: check
              hideTitle: true
    data:
      - _id: t1
        subject: Cannot export the monthly invoice
        requester: Ada
        priority: high
      - _id: t2
        subject: How do I add a second address?
        requester: Grace
        priority: normal
      - _id: t3
        subject: Login link expired
        requester: Alan
        priority: normal
  slots:
    bulkActions:
      blocks:
        - id: tickets_bulk_close
          type: Button
          properties:
            title: Close selected
            size: small
          events:
            onClick:
              - id: tickets_bulk_record
                type: SetState
                params:
                  tickets_bulk_closed:
                    _state: tickets_bulk.selected
  events:
    onReply:
      - id: tickets_bulk_reply
        type: SetState
        params:
          tickets_bulk_last:
            _string.concat:
              - "Reply to "
              - _event: row.requester
    onClose:
      - id: tickets_bulk_close_one
        type: SetState
        params:
          tickets_bulk_last:
            _string.concat:
              - "Close "
              - _event: rowKey
- id: tickets_bulk_status
  type: Span
  properties:
    content:
      _string.concat:
        - "Last action: "
        - _if_none:
            - _state: tickets_bulk_last
            - none
        - " · Closed: "
        - _json.stringify:
            - _if_none:
                - _state: tickets_bulk_closed
                - []
            - space: 0
```

```yaml
- id: deals_grouped
  type: Table
  properties:
    defaultView:
      group:
        - key: region
        - key: owner
    columns:
      - key: name
        title: Deal
        width: 220
      - key: region
        groupable: true
      - key: owner
        groupable: true
      - key: amount
        type: number
        aggregate: sum
      - key: probability
        type: percent
        aggregate: avg
    data:
      - _id: d1
        name: Acme renewal
        region: EMEA
        owner: Ada
        amount: 12000
        probability: 0.9
      - _id: d2
        name: Globex expansion
        region: EMEA
        owner: Grace
        amount: 48000
        probability: 0.6
      - _id: d3
        name: Initech pilot
        region: AMER
        owner: Alan
        amount: 3500
        probability: 0.2
      - _id: d4
        name: Umbrella upsell
        region: EMEA
        owner: Ada
        amount: 9000
        probability: 0.4
```

```yaml
- id: accounts_tree
  type: Table
  properties:
    tree:
      parentField: parent
    rowSelection:
      type: checkbox
      cascade: true
    defaultView:
      sort:
        - key: name
    columns:
      - key: name
        title: Account
        width: 220
      - key: balance
        type: currency
    data:
      - _id: assets
        name: Assets
        balance: 128000
      - _id: cash
        name: Cash
        balance: 28000
        parent: assets
      - _id: receivables
        name: Receivables
        balance: 100000
        parent: assets
      - _id: liabilities
        name: Liabilities
        balance: 42000
      - _id: payables
        name: Payables
        balance: 42000
        parent: liabilities
- id: accounts_tree_value
  type: Span
  properties:
    content:
      _string.concat:
        - "Expanded: "
        - _json.stringify:
            - _state: accounts_tree.expanded
            - space: 0
```

```yaml
- id: folders_lazy
  type: Table
  properties:
    tree:
      parentField: parent
      lazy: true
    columns:
      - key: name
        title: Folder
        width: 260
    data:
      _if_none:
        - _state: folders_lazy_rows
        - []
  events:
    onMount:
      - id: folders_lazy_init
        type: SetState
        params:
          folders_lazy_rows:
            - _id: invoices
              name: Invoices
              hasChildren: true
            - _id: recipes
              name: Recipes
              hasChildren: true
    onRowExpand:
      - id: folders_lazy_load
        type: SetState
        skip:
          _not:
            _event: needsChildren
        params:
          folders_lazy_rows:
            _array.concat:
              - _state: folders_lazy_rows
              - - _id:
                    _string.concat:
                      - _event: rowKey
                      - "-2025"
                  name: "2025"
                  parent:
                    _event: rowKey
                - _id:
                    _string.concat:
                      - _event: rowKey
                      - "-2026"
                  name: "2026"
                  parent:
                    _event: rowKey
```

```yaml
- id: recipes_expandable
  type: Table
  properties:
    expandable:
      template: |
        <div style="padding: 8px 0">
          <strong>{{ row.name }}</strong>: {{ row.method }}
        </div>
      rowExpandable:
        when:
          key: method
          op: notEmpty
    columns:
      - key: name
        title: Recipe
        width: 200
      - key: minutes
        type: number
    data:
      - _id: r1
        name: Sourdough loaf
        minutes: 1440
        method: Mix, rest overnight, shape and bake at 250°C.
      - _id: r2
        name: Pancakes
        minutes: 20
        method: Whisk the batter and fry in a hot pan.
      - _id: r3
        name: Toast
        minutes: 3
```

```yaml
- id: deals_editing
  type: Table
  properties:
    columns:
      - key: name
        title: Deal
        width: 220
        editable: true
        validate:
          - pass:
              op: notEmpty
            message: A deal needs a name.
      - key: stage
        type: status
        editable: true
        options:
          lead: Lead
          won:
            label: Won
            color: success
          lost:
            label: Lost
            color: error
      - key: amount
        type: currency
        editable:
          when:
            key: stage
            op: ne
            value: won
      - key: close_date
        type: date
        editable: true
    data:
      - _id: d1
        name: Acme renewal
        stage: won
        amount: 12000
        close_date: 2026-10-01
      - _id: d2
        name: Globex expansion
        stage: lead
        amount: 48000
        close_date: 2026-11-15
  events:
    onCellEdit:
      - id: deals_editing_wait
        type: Wait
        params:
          ms: 600
      - id: deals_editing_record
        type: SetState
        params:
          deals_editing_last:
            _string.concat:
              - _event: rowKey
              - " "
              - _event: column.key
              - " = "
              - _json.stringify:
                  - _event: value
- id: deals_editing_value
  type: Span
  properties:
    content:
      _string.concat:
        - "Last edit: "
        - _if_none:
            - _state: deals_editing_last
            - none
```

```yaml
- id: steps_drag
  type: Table
  properties:
    rowDrag:
      positionField: position
    defaultView:
      sort:
        - key: position
    columns:
      - key: title
        title: Step
      - key: position
        type: number
        width: 110
    data:
      - _id: s1
        title: Plan
        position: 1024
      - _id: s2
        title: Build
        position: 2048
      - _id: s3
        title: Ship
        position: 3072
  events:
    onRowMove:
      - id: steps_drag_record
        type: SetState
        params:
          steps_drag_last:
            rowKey:
              _event: rowKey
            position:
              _event: position
- id: steps_drag_value
  type: Span
  properties:
    content:
      _string.concat:
        - "Last move: "
        - _json.stringify:
            - _if_none:
                - _state: steps_drag_last
                - none
            - space: 0
```

```yaml
- id: tickets_queue
  type: Table
  properties:
    toolbar:
      views: true
    keyboard:
      next: true
    views:
      - id: open
        title: Open
        count: 2
        locked: true
        view:
          filter:
            key: status
            op: eq
            value: open
      - id: waiting
        title: Waiting
        count: 1
        locked: true
        view:
          filter:
            key: status
            op: eq
            value: waiting
    columns:
      - key: subject
        width: 260
      - key: status
        type: tag
        options:
          - open
          - waiting
      - key: actions
        type: buttons
        title: ""
        width: 200
        sortable: false
        cell:
          buttons:
            - eventName: onAssign
              title: Assign (a)
              key: a
            - eventName: onSnooze
              title: Snooze (s)
              key: s
    data:
      - _id: t1
        subject: Refund for a double charge
        status: open
      - _id: t2
        subject: Change the billing email
        status: open
      - _id: t3
        subject: Waiting for a screenshot
        status: waiting
  events:
    onAssign:
      - id: tickets_queue_assign
        type: SetState
        params:
          tickets_queue_last:
            _string.concat:
              - "Assigned "
              - _event: rowKey
    onSnooze:
      - id: tickets_queue_snooze
        type: SetState
        params:
          tickets_queue_last:
            _string.concat:
              - "Snoozed "
              - _event: rowKey
- id: tickets_queue_value
  type: Span
  properties:
    content:
      _string.concat:
        - "Focus a row and press a or s. Last: "
        - _if_none:
            - _state: tickets_queue_last
            - none
```

```yaml
- id: invoices_rules
  type: Table
  properties:
    rowRules:
      - when:
          key: overdue
          op: isTrue
        style:
          fontWeight: 600
    columns:
      - key: number
        title: Invoice
      - key: total
        type: currency
        rules:
          - when:
              op: gte
              value: 10000
            color: success
      - key: due
        type: date
        rules:
          - when:
              key: overdue
              op: isTrue
            color: error
      - key: overdue
        type: boolean
        hidden: true
    data:
      - _id: i1
        number: INV-1001
        total: 12500
        due: 2026-08-01
        overdue: true
      - _id: i2
        number: INV-1002
        total: 800
        due: 2026-10-30
        overdue: false
```

```yaml
- id: leads_enrichment
  type: Table
  properties:
    addColumn: true
    addRow: true
    importCsv: true
    rowSelection:
      type: checkbox
    providers:
      - id: findEmail
        title: Find email
        description: A work email from a name and a domain.
        inputs:
          - key: domain
            title: Domain
            required: true
          - key: name
            title: Name
        outputs:
          - path: email
            title: Email
            type: email
    columns:
      - key: name
        kind: input
        editable: true
        width: 150
      - key: domain
        kind: input
        editable: true
        width: 140
      - key: email
        kind: enrichment
        type: email
        provider: findEmail
        inputs:
          domain:
            column: domain
          name:
            column: name
        output: email
        width: 200
      - key: segment
        kind: ai
        type: tag
        prompt: Which market segment is {{ domain }} in?
        inputs:
          domain:
            column: domain
        output:
          type: tag
          options:
            - smb
            - mid-market
            - enterprise
        userDefined: true
        width: 140
      - key: linkedin
        kind: extract
        source: email
        path: profile.linkedin
        userDefined: true
      - key: greeting
        kind: formula
        template: Hi {{ name }}, about {{ domain }}
        userDefined: true
        width: 220
    data:
      - _id: l1
        name: Ada
        domain: acme.com
        _enrich:
          email:
            status: ok
            value: ada@acme.com
            inputHash: 1d27590e6f1c9b
            raw:
              email: ada@acme.com
              profile:
                linkedin: in/ada
          segment:
            status: ok
            value: enterprise
      - _id: l2
        name: Grace
        domain: globex.com
        _enrich:
          email:
            status: running
          segment:
            status: queued
      - _id: l3
        name: Alan
        domain: initech.com
        _enrich:
          email:
            status: queued
      - _id: l4
        name: Linus
        domain: umbrella.com
        _enrich:
          email:
            status: error
            error: The provider timed out.
      - _id: l5
        name: Margaret
        _enrich:
          email:
            status: empty
            error: "Missing input: domain"
      - _id: l6
        name: Ivan
        domain: hooli.com
        _enrich:
          email:
            status: ok
            value: ivan@old-domain.com
            inputHash: 0
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | array \| null | - | The columns, in default order. |
| `defaultColumn` | object | - | Defaults applied to every column. |
| `defaultColumn.sortable` | boolean | `true` | Sort by clicking the header (Shift+click adds to a multi-sort). Defaults to `defaultColumn.sortable` (true). |
| `defaultColumn.filterable` | boolean | `true` | Offer the column in filters: the header menu "Filter…" item and the filter builder. |
| `defaultColumn.resizable` | boolean | `true` | Resize the column by dragging the right edge of its header. |
| `defaultColumn.groupable` | boolean | `false` | Allow grouping rows by this column (view `group`, the `setGroup` method, the header menu). Default false. |
| `defaultColumn.editable` | boolean \| object | `false` | Edit cells of this column: `true`, or `{ when: Condition }` to allow it per row. The editor comes from the type: text, email, phone and url edit as text; number, currency and percent as a number; date and datetime with a date picker; boolean with a switch; tag and status select from `options`; tags select several; rating with stars. Enter, F2, double-click or typing opens it; Enter, Tab or leaving commits; Esc cancels. Table fires onCellEdit; TableInput writes its value. |
| `defaultColumn.editable.when` | object | - | Condition tested against the row (and the cell value, for leaves without `key`) that decides whether the cell is editable. |
| `defaultColumn.width` | number | - | Column width in pixels. Default 160. |
| `defaultColumn.minWidth` | number | - | Minimum width in pixels when resizing. Default 48. |
| `defaultColumn.maxWidth` | number | - | Maximum width in pixels when resizing. |
| `defaultColumn.ellipsis` | integer \| boolean | - | Clamp the text to this many lines (`true` is one) with an ellipsis; the full text shows on hover. More than one line makes rows as tall as their content. |
| `defaultColumn.wrap` | boolean | `false` | Wrap long text; rows grow to fit (measured row heights, which turn column virtualisation off). Text stays on one line by default. |
| `data` | array \| object \| null | - | The rows, or `{ mode: server, request, blockSize }` to load rows from a request in blocks as the table scrolls. In server mode the table fires the request with the event `{ startRow, endRow, view: { sort, filter, search, group, aggregates }, groupPath, selected }` (read it in the request `payload` with `_event`) and expects `{ rows, total, groups?, aggregates? }`, the contract of `MongoDBTableQuery`. Sorting, filtering and grouping then run on the server. Rows need a `rowKey`. |
| `data.mode` | string | - | Load rows from `request`. Enum: `server`. |
| `data.request` | string | - | Id of the request on the page that returns `{ rows, total }`. |
| `data.blockSize` | integer | `200` | Rows per request. Blocks load as they scroll into view. |
| `data.maxBlocks` | integer | `20` | Blocks kept in the cache; the least recently used are dropped (and refetched when they come back into view). |
| `rowKey` | string | - | The row field that identifies each row. Defaults to `_id`, then `id`. Rows with neither get a key per row object, which does not survive a refetch. |
| `rowVersionField` | string | - | Dot path to a field that changes whenever a row changes (for example `updated.timestamp`). When set, rows are compared by key and this field instead of by content; a row without it is compared by content. |
| `user` | object | - | The user object for `$user` values in filters, `rules`, `rowRules` and button `hidden`/`disabled` conditions, usually `{ _user: true }`. Blocks do not see the session, so conditions read `$user` from this property. |
| `defaultView` | object | - | The initial and reset view. Parts missing from the table value fall back to this, then to the column defaults. |
| `defaultView.columns` | array | - | Column order, widths, pinning and visibility. |
| `defaultView.columns.$.key` | string | - |  |
| `defaultView.columns.$.width` | number | - |  |
| `defaultView.columns.$.pinned` | string | - | Pin the column to the start or end, where it stays visible while scrolling. Enum: `start`, `end`. |
| `defaultView.columns.$.hidden` | boolean | - |  |
| `defaultView.sort` | array | - | Sort order: `[{ key, desc }]`. |
| `defaultView.sort.$.key` | string | - |  |
| `defaultView.sort.$.desc` | boolean | - |  |
| `defaultView.filter` | object \| null | - | Filter condition: `{ and: [...] }` / `{ or: [...] }` groups of `{ key, op, value }` leaves. Operators depend on the column type; `{ $user: path }` values read the `user` property. |
| `defaultView.search` | string \| null | - | Search text: rows match when every word appears (case-insensitive) in the display text of the searched columns. |
| `defaultView.group` | array | - | Group rows by these columns, outermost first: `[{ key }]`. Only columns with `groupable: true` group; groups follow the sort on their column, else option order, else first appearance, and empty values group as "(Empty)" last. |
| `defaultView.group.$.key` | string | - |  |
| `defaultView.collapsedGroups` | array | - | Keys of collapsed groups: the JSON of the group value path, for example `["lead"]` or `["EMEA","Ada"]` (empty values are `null`). |
| `defaultView.aggregates` | object | - | Aggregates by column key, for example `{ amount: sum, deals: count }`, over the columns' own `aggregate`. `null` turns a column default off. Group headers show them under their columns. |
| `defaultView.density` | string | - | Row density: compact 32px, default 40px, comfortable 52px rows. Defaults to `size`. Enum: `compact`, `default`, `comfortable`. |
| `defaultView.wrap` | boolean | - | Wrap the text of text-like columns (text, email, phone, url, link, html, relation) that set no `wrap` or `ellipsis` of their own; rows grow to their content. The toolbar density control has a Wrap toggle. |
| `defaultView.pageSize` | integer | - | Rows per page when pagination is on. Defaults to the `pageSize` property. |
| `rowSelection` | object | - | Turn on row selection. The selection is the `selected` part of the table value. |
| `rowSelection.type` | string | `"checkbox"` | Multiple (checkbox) or single (radio) selection. Enum: `checkbox`, `radio`. |
| `rowSelection.preserve` | boolean | `false` | Keep selected keys of rows that leave `data`. Always on in server mode. |
| `rowSelection.cascade` | boolean | `false` | In a tree, selecting or clearing a row also selects or clears all its descendants. |
| `tree` | object | - | Show rows as a tree (client data only): rows are indented under their parent with an expand chevron in the first column, Right and Left expand and collapse, sorting sorts within each level and a filter keeps the ancestors of matching rows. The expanded row keys are the `expanded` part of the table value. Give exactly one of `childrenField` or `parentField`. |
| `tree.childrenField` | string | - | Dot path to each row's child rows (nested data). |
| `tree.parentField` | string | - | Dot path to the row key of each row's parent (flat data). Rows whose parent is not in `data` are roots. |
| `tree.lazy` | boolean | `false` | Load children on demand: rows whose `hasChildrenField` is true show a chevron before their children are loaded, expanding a row fires `onRowExpand` with `needsChildren: true` until its children are in `data`, and the app adds them (for example a request whose result is merged into the data with `parentField` set). |
| `tree.hasChildrenField` | string | `"hasChildren"` | With `lazy`, the field that marks rows with children that are not loaded yet. |
| `tree.indent` | number | `20` | Indent per level in pixels. |
| `expandable` | object | - | Expandable rows: a chevron in the first column opens a detail row below the row, as high as its content. The expanded row keys are the `expanded` part of the table value. |
| `expandable.template` | string | - | Nunjucks HTML for the detail row, rendered with `row` and `rowKey`. Output is escaped: use `\| safe` to insert HTML from a field. The HTML is sanitised. |
| `expandable.rowExpandable` | object | - | Which rows can expand. |
| `expandable.rowExpandable.when` | object | - | A condition (`{ key, op, value }`, or `and` / `or` lists) tested against the row. |
| `rowLink` | object | - | Make rows links. A plain click navigates, Cmd/Ctrl or middle click opens a new tab, and Enter on a focused row follows it. Values in `urlQuery` are row paths. |
| `rowLink.pageId` | string | - | The page to open. |
| `rowLink.href` | string | - | A URL to open instead of a page. |
| `rowLink.urlQuery` | object | - | Query parameters; each value is a path in the row, like `{ _id: _id }`. |
| `rowLink.input` | object | - | Input for the page. |
| `rowLink.newTab` | boolean | - | Always open in a new tab. |
| `rowRules` | array | - | Conditional row formatting: `[{ when, className, style, color }]`, where `when` conditions name columns by `key`. |
| `size` | string | `"default"` | Row density: compact 32px, default 40px, comfortable 52px rows. The view starts at this density (`view.density` overrides it). Enum: `compact`, `default`, `comfortable`. |
| `bordered` | boolean | `false` | Draw borders between cells. |
| `height` | number \| string | - | A fixed table height (px number or CSS size); the rows scroll under a sticky header and the summary row stays in view. Without it the table grows with its rows up to `maxHeight`. |
| `maxHeight` | number \| string | `600` | Maximum height when `height` is not set. |
| `rowHeight` | number | - | Row height in pixels. Overrides the density height. |
| `virtual` | - | `"auto"` | Virtualise rows and columns. `auto` virtualises rows above 200 and columns above 20 or when the table is wider than twice its viewport. Enum: `auto`, `true`, `false`. |
| `stickyHeader` | boolean | `true` | Keep the header visible while the table scrolls. |
| `rowDrag` | boolean \| object | - | Reorder rows by dragging a handle in a leading column, or with Alt+Shift+ArrowUp/Down on a focused row. Not available while the table is sorted (except ascending by the position field), filtered or grouped, in a tree or in server mode; the handle is disabled with a tooltip saying why. Table fires onRowMove; TableInput records the move in its value. `true`, or `{ positionField }` for fractional positions. |
| `rowDrag.positionField` | string | - | Dot path of a numeric position field the rows are ordered by. A move gives only the moved row a new position: the midpoint of its new neighbours (a neighbour ∓ 1024 at the ends), renumbering the list in steps of 1024 only when there is no room left. |
| `headerMenu` | boolean | `true` | Show the column menu button in each header (on hover or focus): sort, filter, pin, freeze, autosize, hide and the column manager. |
| `reorderable` | boolean | `true` | Reorder columns by dragging their headers. |
| `keyboard` | boolean \| object | `true` | Keyboard navigation between cells. Grid roles stay on when off, and so do Ctrl/Cmd+C copy and the keys of a focused group header. An object turns it on with options. |
| `keyboard.next` | boolean | `false` | After a row button, menu item or single-key action completes, move focus to the next row (queue and triage lists). |
| `toolbar` | boolean \| object | `false` | The toolbar above the table. `true` turns on every item; an object turns on the listed items. |
| `toolbar.views` | boolean | `false` | Saved view tabs (needs `views`), with the unsaved changes strip. |
| `toolbar.search` | boolean | `false` | A search box that writes `view.search` (Cmd/Ctrl+F focuses it while the table has focus). |
| `toolbar.quickFilters` | array | - | Column keys to show as quick filter chips. Columns with `options` get a checkbox list (an `in` condition); others open the column filter. |
| `toolbar.filter` | boolean | `false` | A Filter button that edits the whole `view.filter`. |
| `toolbar.sort` | boolean | `false` | A Sort button to add, remove, reorder and flip sort levels. |
| `toolbar.group` | boolean | `false` | A Group button to pick and order group levels (groupable columns). |
| `toolbar.columns` | boolean | `false` | A Columns button that opens the column manager. |
| `toolbar.density` | boolean | `false` | A compact / default / comfortable density toggle, with a Wrap toggle for `view.wrap`. |
| `toolbar.export` | boolean | `false` | An Export button that downloads the view as CSV. |
| `views` | array \| null | - | Saved views, from any source (often a request). Selecting a tab loads its view; changes show an unsaved changes strip with Save, Save as and Discard. |
| `activeView` | string \| number \| object \| null | - | The id of the active saved view (an ObjectId id matches by its hex). Defaults to the first view. Changing it selects that view. |
| `persist` | object | - | Keep the user's view between visits. Off by default. The selection is never persisted. |
| `persist.key` | string | - | Storage key (localStorage) or query parameter name (url). |
| `persist.storage` | string | `"local"` | `local` keeps the view in localStorage (none in a private window or with blocked storage); `url` writes a compact encoding to the query string, replacing history. Enum: `local`, `url`. |
| `emptyText` | string | `"No rows"` | What to show when there are no rows - supports html. |
| `loading` | boolean | `false` | Show the loading state: skeleton rows without data, a progress bar with it. |
| `pagination` | boolean | `false` | Show the rows in pages of `pageSize` with a pager below the table. Off by default, unlike TableLight: the Table scrolls any number of rows virtually. `true` means what it means on TableLight: pages, with the pager always shown. |
| `pageSize` | integer | `50` | Rows per page when `pagination` is on (`view.pageSize` overrides it). |
| `providers` | array | - | The enrichment providers columns can call (`kind: enrichment`), the catalogue the add-column picker offers. Each maps, on the server, to the app's `enrich_<id>` endpoint, so a column only calls what the app exposes. |
| `providers.$.id` | string | - | The provider id, the column `provider`. |
| `providers.$.title` | string | - | The name in the picker. |
| `providers.$.description` | string | - | A line under the name in the picker. |
| `providers.$.icon` | - | - | An icon for the provider. |
| `providers.$.inputs` | array | - | The inputs, `[{ key, title, type, required }]`, mapped to columns or literals in the picker. |
| `providers.$.outputs` | array | - | Paths in the result a column can show, `[{ path, title, type }]`; the picker sets the column type from it. |
| `providers.$.cost` | number | - | The cost of one call, for the app to show. |
| `addColumn` | boolean \| object | - | Show a "+" at the end of the header that opens the add-column picker (onColumnAdd). `true` offers every kind; `{ kinds: [...] }` only those (`input`, `formula`, `enrichment`, `ai`, `extract`). |
| `addColumn.kinds` | array | - | The column kinds the picker offers. |
| `addRow` | boolean | `false` | Show a "+ New row" row under the table that opens an inline editor for the input columns; Enter adds the row through onRowAdd. |
| `addRowText` | string | `"New row"` | Text of the new-row row. |
| `inputFieldPrefix` | string | - | Where user-defined input columns added in the picker or by a CSV import keep their values: under this path, then the column key (with `values`, a `notes` column stores at `values.notes`, so a column can never name another field of the row). The column is sent with that `field`, and onRowAdd / onImport values sit at it. Without it, at the key. |
| `importCsv` | boolean | `false` | Show an Import button in the toolbar: a CSV file (at most 50 MB and 100,000 rows) is parsed in the browser, in slices so the page stays responsive, its headers mapped to input columns (or new text columns), and the rows sent through onImport in batches of 500. |
| `summary` | boolean | `true` | Show the summary footer when any aggregate is in effect: a column `aggregate`, or one the view sets in `view.aggregates`. `false` hides it. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value, cause }` | Trigger when the table value changes through the table: a sort, a filter or search, a column change (resize, reorder, pin, hide, column manager), or a selection. |
| `onSelectionChange` | `{ selected, rows }` | Trigger when the row selection changes. "Select all matching" in the bulk bar (and, in server mode, the header checkbox) selects every row the view matches as `{ all: true, except, filter, search }`: every row matching that filter and search except the `except` keys, so a request can resolve it from the value alone. Changing the filter or search clears such a selection. |
| `onRowExpand` | `{ row, rowKey, expanded, needsChildren }` | Trigger when a tree row or an expandable row is expanded or collapsed. With `tree.lazy`, load the row's children here when `needsChildren` is true (skip the load action otherwise) and add them to `data`. |
| `onExport` | `{ view, filename, formatted }` | Server mode: trigger when `exportCsv` is called. The browser only holds the loaded blocks, so produce the file from the view, for example with a request and a download action. |
| `onRowClick` | `{ row, rowKey, index }` | Trigger when a row is clicked, or activated with Enter. Clicks on buttons, links, menus and `data-event` elements in a cell, and clicks that end a text selection, do not trigger it. With `rowLink`, a plain click runs onRowClick instead of following the link. |
| `onRowDoubleClick` | `{ row, rowKey, index }` | Trigger when a row is double clicked. |
| `onCellClick` | `{ row, rowKey, column, value }` | Trigger actions when a cell is clicked. Clicks on controls in the cell do not trigger it. |
| `onViewSelect` | `{ id }` | Trigger when a saved view tab is selected, after its view loads. |
| `onViewSave` | `{ view, id, title, shared }` | Trigger when the user saves the current view: Save (with the active view `id`) or Save as (no `id`, a new view). The app stores views; update `views` (and `activeView`) with the result. |
| `onViewDelete` | `{ id }` | Trigger when the user deletes a saved view from its tab menu. |
| `onCellEdit` | `{ row, rowKey, column, value, previous }` | Trigger when an edited cell commits. The cell shows the new value with a saving indicator while the event runs. When the actions fail (a Request error or a Throw), the cell reverts and shows the error message. After success the new value shows until the row changes in `data`. Without this event, edits only show in the table. |
| `onRowMove` | `{ row, rowKey, fromIndex, toIndex, beforeKey, afterKey, position, positions }` | Trigger when a row is dropped at a new place (`rowDrag`): a drag of its handle, or Alt+Shift+ArrowUp/Down. The rows reorder at once with a saving indicator on the handle while the event runs; when the actions fail the order reverts and the handle shows the error message. After success the new order shows until `data` changes. With `rowDrag.positionField`, save `position` on the moved row (`positions` holds every row whose position changed: normally just this one, all rows when the list had to be renumbered). Without it, save the order from `beforeKey` / `afterKey`. |
| `onColumnAdd` | `{ column, position }` | Trigger when a column is added: the add-column picker (`addColumn`), Duplicate or Insert left / right in a user-defined column's header menu, or "Add as column" in the cell details panel. The picker stays open, pending, while the event runs, and shows the error when the actions fail. Store the column and add it to `columns`. |
| `onColumnUpdate` | `{ column, previous }` | Trigger when a user-defined column is renamed (inline in its header) or edited (the picker). The rename or picker shows it pending while the event runs and the error when it fails. |
| `onColumnDelete` | `{ column }` | Trigger when a user-defined column is deleted from its header menu, after the confirmation. The dialog stays open, pending, while the event runs. |
| `onColumnRun` | `{ column, mode, selection }` | Trigger to run an enrichment or ai column: Run in its header menu (all rows, empty cells, errors or stale cells) or "Run selected" in the bulk bar. Enqueue the cells, for example with MongoDBEnrichmentEnqueue; their states then show in the cells. |
| `onRowRun` | `{ row, rowKey, columns }` | Trigger when a row's run button is clicked (the trailing column, shown on hover): run every enrichment and ai column of the row. |
| `onCellRun` | `{ row, rowKey, column }` | Trigger when one cell is rerun: Rerun in the cell details panel, or the rerun button of a stale cell. |
| `onRowAdd` | `{ values }` | Trigger when a row is added with "+ New row" (`addRow`). The row shows at the end of the table, marked saving, while the event runs; after it the row comes from `data` (add it there, for example by refetching). When the actions fail, the row goes and the editor shows the error with the values kept. |
| `onImport` | `{ rows, newColumns, batchIndex, batchCount, total }` | Trigger for each batch of rows a CSV import sends (`importCsv`), 500 rows at a time, each awaited before the next; a failed batch stops the import and shows its error. Insert the rows, for example with MongoDBInsertMany, and create `newColumns` once. |
| `onCellLink` | `{ link, row, value }` | Triggered when a link, avatar link or relation cell is clicked. The link navigates by itself; this event is for anything else to do. |
| `onCellButton` | `{ row, rowKey, value, button, buttonIndex }` | Documentation reference - the event fired is the `eventName` of each button in a `buttons` cell. Define any number of named events on the block, such as `onEdit`. |
| `onCellMenuItem` | `{ row, rowKey, value, item, itemIndex }` | Documentation reference - the event fired is the `eventName` of each item in a `menu` cell. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The table root element. |
| `/header` | The header row group. |
| `/row` | Every body row. |

| Slot | Description |
| --- | --- |
| `toolbarStart` | Blocks at the start of the toolbar, for example a "New deal" button. Blocks sit side by side at their content width (8px gap, wrapping); the slot's `gap`, `align` and `justify` and a block's `layout.flex` still apply. |
| `toolbarEnd` | Blocks at the end of the toolbar, side by side like `toolbarStart`. |
| `bulkActions` | Blocks in the bulk action bar, shown while rows are selected, side by side at the end of the bar like `toolbarStart`. |
| `empty` | Blocks shown instead of the empty state when there are no rows. |
