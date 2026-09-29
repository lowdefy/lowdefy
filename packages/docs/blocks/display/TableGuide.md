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

The table loads its code (TanStack Table and Virtual, about 47 kB gzipped) the first time a `Table` or `TableInput` mounts. A page without one does not load it.

## What is on by default

A `Table` with only `columns` and `data` already does what users expect of a table. Features that need your intent, a place to save something, or page chrome are one key away.

| Feature                                                                           | Default                                                                   | Turn it off or on                                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Sort by header click (Shift+click adds a level)                                   | on                                                                        | `sortable: false` on a column, or `defaultColumn: { sortable: false }` |
| Column resize by dragging a header edge                                           | on                                                                        | `resizable: false`, or `defaultColumn: { resizable: false }`           |
| Column reorder by dragging a header                                               | on                                                                        | `reorderable: false`                                                   |
| Header menu: sort, filter, group, pin, freeze, autosize, hide, Columns…           | on                                                                        | `headerMenu: false`                                                    |
| Column filters (from the header menu; the header shows an icon while one applies) | on                                                                        | `filterable: false`, or `defaultColumn: { filterable: false }`         |
| Column manager (Columns… in the header menu)                                      | on                                                                        | follows `headerMenu`                                                   |
| Sticky header                                                                     | on                                                                        | `stickyHeader: false`                                                  |
| Virtualisation                                                                    | `auto`: rows above 200, columns above 20 or wider than twice the viewport | `virtual: true` or `virtual: false`                                    |
| Keyboard navigation, focus ring, ARIA grid roles                                  | on                                                                        | `keyboard: false` (the roles stay)                                     |
| Copy with Cmd/Ctrl+C                                                              | on                                                                        | follows `keyboard`                                                     |
| Hover highlight, empty state, loading skeleton                                    | on                                                                        | `emptyText`, the `empty` slot, `loading`                               |
| Summary footer                                                                    | on when a column has an `aggregate` (or the view has `aggregates`)        | `summary: false`                                                       |
| Height                                                                            | grows with its rows up to `maxHeight` (600px), then scrolls               | `height` for a fixed height                                            |
| Toolbar                                                                           | off                                                                       | `toolbar: true` (every item) or `toolbar: { search: true, ... }`       |
| Row selection                                                                     | off                                                                       | `rowSelection: { type: checkbox }`                                     |
| Grouping                                                                          | off                                                                       | `groupable: true` on columns                                           |
| Editing                                                                           | off                                                                       | `editable: true` on columns                                            |
| Pagination                                                                        | off                                                                       | `pagination: true`                                                     |
| View persistence                                                                  | off                                                                       | `persist: { key }`                                                     |
| Saved views, server mode                                                          | off                                                                       | `views`, `data: { mode: server }`                                      |

Changes a user makes with the default features (sort, widths, order, filters, hidden columns) live in the table value for the session. `Reset` and `SetState` still control them, and they outlive a page reload only with `persist`.

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
    properties:
      pipeline: # always runs first: the view can only narrow it
        - $match:
            org_id:
              _user: organization.id
            archived:
              $ne: true
        - $project:
            name: 1
            stage: 1
            owner: 1
            amount: 1
            updated: 1
      fields: # the allowlist, keyed by column key
        name:
          type: text
          search: true
        stage:
          type: status
          groupable: true
        owner:
          type: text
          path: owner.name
          search: true
          groupable: true
        amount:
          type: currency
        updated:
          type: date
      user:
        _user: true
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

  # A bulk action over the selected keys.
  - id: assign_deals
    type: MongoDBUpdateMany
    connectionId: deals
    payload:
      ids:
        _state: deals_table.selected
    properties:
      filter:
        _id:
          $in:
            _payload: ids
        org_id:
          _user: organization.id
      update:
        $set:
          owner:
            name:
              _user: name
            id:
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
          groupable: true
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
- **Row links.** A plain click opens the deal, Cmd/Ctrl+click or a middle click opens it in a new tab, and Enter on a focused row follows the link. Clicks on buttons, links, menus and editors in a cell never trigger the row.
- **Saved views.** The tabs show `views`. Selecting a tab loads its `view` (parts it leaves out come from `defaultView`) and fires `onViewSelect`. When the current view differs from the tab's, a strip offers Save, Save as and Discard; Save fires `onViewSave` with the tab's `id`, Save as asks for a title (and whether to share it) and fires `onViewSave` without an `id`. A tab's menu offers Delete, which fires `onViewDelete`. The table never stores views itself: update `views` and, for a new view, `activeView`. `locked: true` hides Save and Delete for that tab. Changing the search or collapsing groups never marks a view as changed.
- **`persist`.** Keeps the user's current view and active tab in `localStorage` under `lowdefy-table:deals`, so a returning user sees what they left. A persisted view wins over `activeView` when the page loads.
- **Bulk actions.** While rows are selected, a bar below the table shows "N selected", "Select all M matching", Clear, and the `bulkActions` slot. The blocks in it read `_state: deals_table.selected`.
- **Hover buttons.** `showOn: hover` shows the buttons only on the hovered or focused row. They mount only there, which keeps scrolling fast. The event carries `{ row, rowKey, value, button, buttonIndex }`. `applyTransaction` removes the archived row without a full refetch; in server mode a remove also refetches the visible rows.
- **Inline editing.** Double-click, Enter, F2 or typing on a stage cell opens a select of its `options`. The committed value shows at once with a saving marker while `onCellEdit` runs. If an action fails (a request error, or a `Throw`), the cell reverts and shows the error message. After success the new value shows until the row changes in `data`.

Selection in server mode: the header checkbox (and "Select all M matching") selects every row the view matches as `{ all: true, except: [...] }`, not a list of keys, because most rows are not in the browser. The request that acts on such a selection must apply the same scope and the same view filter on the server. `assign_deals` above handles key lists only; guard it, for example with `skip: { _eq: [{ _state: deals_table.selected.all }, true] }`, or resolve the view on the server.

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

With `onRowClick` defined, a plain click runs it instead of following `rowLink`. `onRowClick` receives `{ row, rowKey, index }`; `index` is the row's position in `data`, whatever the sort.

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
- "Select all M matching" in the bulk bar writes `{ all: true, except: [] }` in client mode too. A picker that reads `selected` as a list should either leave the `bulkActions` slot empty and use `onSelectionChange` `rows`, or handle both shapes.

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
- `exportCsv` exports every row in the current order, including the rows of collapsed groups.

Aggregates: `sum`, `avg`, `min`, `max`, `count`, `countDistinct`, `countEmpty`, `countNotEmpty`, `percentEmpty` (a fraction), `earliest` and `latest`. In client mode `min` and `max` follow the column's sort order, so they work on text and enum columns too; `MongoDBTableQuery` allows `sum`, `avg`, `min` and `max` on numeric fields only.

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

Load children on demand with `lazy`: a row whose `hasChildrenField` (default `hasChildren`) is true shows a chevron before its children are in `data`, and expanding it fires `onRowExpand { row, rowKey, expanded }`. The event fires on every expand, so load each parent once:

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
          _or:
            - _not:
                _event: expanded
            - _get:
                from:
                  _state: loaded_parents
                key:
                  _event: rowKey
      - id: add_children
        type: SetState
        skip:
          _not:
            _event: expanded
        params:
          folder_rows:
            _array.concat:
              - _state: folder_rows
              - _request: child_folders
          loaded_parents:
            _object.assign:
              - _if_none:
                  - _state: loaded_parents
                  - {}
              - _object.fromEntries:
                  - - _event: rowKey
                    - true
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
        - id: refetch
          type: Request
          params: get_recipe
        - id: reset
          type: CallMethod
          params:
            blockId: items
            method: resetChanges
```

- Editing a cell writes `updated: { <rowKey>: { <field>: value } }`, only the changed fields; an edit back to the original value drops out. "+ Add ingredient" appends a row with each column's `default` (and a position after the last row) to `added` and opens its first editable cell. The delete button (and Delete or Backspace with `deleteRows: true`) adds the key to `removed`.
- `rowDrag.positionField` gives a dragged row one new position, the midpoint between its new neighbours, in `moved: { <rowKey>: position }`. A move is one field on one item. Only when two neighbours are closer than 1e-6 is the list renumbered in steps of 1024, which reports every changed position. Dragging is blocked while the table is sorted by anything but the position field ascending, filtered or grouped; the handle says why. Alt+Shift+Up/Down moves the focused row.
- In array mode `MongoDBTableChanges` compiles the changes to `$set` with `arrayFilters` on the changed items, `$pull` for removed ones and `$push` for new ones (new items get an ObjectId `_id`). Only the `fields` listed can be written, values are coerced to the field type, and the base `filter` scopes the document.
- After saving, refetch `data` and call `resetChanges`, which clears the changes and the undo history.

Collection mode, where every row is a document: leave out `array`. The changes compile to one `bulkWrite` of `updateOne` (the changed dot paths and the position, in one `$set`), `insertOne` and `deleteOne`, each scoped by the base `filter`. Tenant and ownership fields stay out of `fields` and are set on new rows with `insertDefaults`:

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
    insertDefaults:
      org_id:
        _user: organization.id
      created:
        _date: now
    changes:
      _payload: changes
```

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
| `validate`, `required`, `default`                              | Editing: checks before an edit commits, and a `TableInput` new row's value.                                                                                                          |
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
| `tags`                          | a list of tags with a +N count                                                                      | `colorMap`, `colorFrom`, `default`, `max`                                                                                                                                                                                                                                                                                         | text                    | multi-select from `options` |
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
- `buttons` and `menu` cells hold no data: they are left out of filters, search and exports. Each button or menu item fires the block event named by its `eventName` with `{ row, rowKey, value, button: { eventName, title }, buttonIndex }` or `{ row, rowKey, value, item: { eventName, title }, itemIndex }`. The keys match the AgGrid buttons and menu cells: `title` / `titleField`, `icon` / `iconField`, `hidden` / `hiddenField`, `disabled` / `disabledField`, `type`, `variant`, `color`, `size`, `shape`, `danger`, `ghost`, `hideTitle`, `tooltip`, `iconPlacement`, and `key` (a single-key shortcut). `hidden` and `disabled` also take `{ when: <condition> }`. An icon-only button shows its title as a tooltip. `showOn: hover` shows the buttons only on the hovered or focused row (touch screens always show them).
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

| Key               | Holds                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `columns`         | `[{ key, width, pinned, hidden }]` in display order                                                             |
| `sort`            | `[{ key, desc }]`, outermost first                                                                              |
| `filter`          | a condition, or null                                                                                            |
| `search`          | the search text: rows match when every word appears (ignoring case) in the display text of the searched columns |
| `group`           | `[{ key }]` of groupable columns, outermost first                                                               |
| `collapsedGroups` | keys of collapsed groups                                                                                        |
| `aggregates`      | `{ <columnKey>: <fn> \| null }` over the columns' own `aggregate`                                               |
| `density`         | `compact` (32px rows), `default` (40px) or `comfortable` (52px); starts from `size`                             |

- `defaultView` sets the initial view and the one `Reset` returns to. Each part missing from the value falls back to `defaultView`, then to the column defaults. `defaultView.columns` entries merge over the column config, and columns it leaves out keep their defaults.
- While the column layout equals the configured one, the derived view leaves `columns` out, so columns added to config keep appearing until the user changes the layout.
- `SetState` on any part loads it: `SetState: { deals.view.sort: [{ key: amount, desc: true }] }`. So do the methods `setFilter`, `clearFilters`, `setSearch` and `setGroup`.
- `onChange` fires after the user changes the view or the selection, with `{ value, cause }`; `cause` is `sort`, `filter`, `search`, `columns`, `select`, `group`, `aggregate`, `expand`, `density` or `view` (a saved view loaded). It does not fire for `SetState`, `Reset` or the initial value.
- To share a view in a link, `persist: { key: view, storage: url }` writes a compact encoding of the view to the `view` query parameter as it changes (with `history.replaceState`), and reads it on load.

`persist: { key, storage: local }` (the default storage) keeps the view in `localStorage` under `lowdefy-table:<key>`; a private window or blocked storage just means no persistence. The selection is never persisted. Persisted views outlive config changes (unknown keys are dropped and new columns appended hidden), which is why persistence is opt-in.

`view.wrap` and `view.pageSize` are accepted but have no effect yet: use the column `wrap` and the `pageSize` property.

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

In the column manager, Alt+Up / Down on a column's handle moves it. `keyboard: false` turns navigation, copying and single-key actions off; the grid roles stay for screen readers.

## Performance

- **Virtualisation.** With `virtual: auto` the table renders only the rows in view once there are more than 200 display rows (groups count), and only the columns in view once there are more than 20 scrolling columns or the table is wider than twice its viewport. Pinned columns always render. Scrolling never re-renders the engine or touches Lowdefy state.
- **Fixed heights are fastest.** Rows are one fixed height from the density (32, 40 or 52px) or `rowHeight`. A column with `wrap: true` or `ellipsis` above 1 makes rows as tall as their content: heights are measured as rows render, and column virtualisation turns off, since a row's height then depends on every cell in it. Expandable detail rows are measured too.
- **Rich cells.** Hover buttons mount only on the hovered or focused row. During a fast scroll, avatar, tag, button and other rich cells show their text and upgrade when the scroll settles. Templates compile once per column.
- **Data updates.** Rows are compared by key, so a refetch re-renders only rows whose content changed. `rowVersionField` (for example `updated`) compares rows by that field instead of by content. `applyTransaction` adds, updates or removes rows without replacing `data`.
- **Big client data.** Sort, filter and group of 100k rows stay under the 60fps budget in the benchmark (text sort keys and the first search are built in time slices, without blocking). Keep `data` a plain request result: an `_js` or `_function` in it runs on every page update.
- **Server mode** is for data the browser should not hold. `blockSize` (default 200) sets the rows per request and `maxBlocks` (default 20) the blocks kept; loads wait for a fast scroll to settle.
- **TableLight renders every row** with antd's Table: keep it to hundreds of rows. It logs a development warning above 1,000.

## Server mode security

In server mode the browser sends the view, and the view is user input. `MongoDBTableQuery` is built so that it can only narrow what the base query allows:

- **The allowlist.** Only keys in `fields` can be sorted, filtered, searched, grouped or aggregated, only with the operators and aggregates their `type` allows, and only with values of that type. Anything else is refused before the query runs. Regex input is escaped, and the view can not send `$where`, `$expr` or pipeline stages.
- **The base pipeline runs first.** Put tenant, ownership and permission scoping in `pipeline`, evaluated on the server with `_user`, never in the payload. On a tenant connection the tenant scope comes before it.
- **Project what the table may see.** The rows are whatever the base pipeline returns, hidden columns included, so end it with a `$project` of the fields the table shows.
- **`user: { _user: true }`** on the request resolves `{ $user: path }` filter values on the server from the session. A browser-sent user value is never used, and a missing one throws instead of matching empty fields.
- **Bounded requests.** `maxRows` (default 1000) caps the rows or groups one request returns.
- **Selections.** A `{ all: true, except }` selection is not a list of keys: a request that acts on it must recompute the set on the server under the same scope, so a crafted view can not widen a bulk action beyond what the user can read.
- **Saves.** `MongoDBTableChanges` writes only the `fields` listed, at their paths, with coerced values, scoped by its base `filter`; row keys and values that are operator objects are refused.

Every column the user can sort or filter must be in `fields`, or the request fails when they try. Set `sortable: false` and `filterable: false` on columns the request does not allow, and give `toolbar.search` only to tables whose request has `search: true` fields. Server search matches the raw field values, not the display labels a client-side search reads.

## Moving from TableLight or AgGrid

- **From TableLight:** change `type: TableLight` to `type: Table`. Every property keeps its meaning; set `pagination: true` if you relied on TableLight's automatic pager.
- **From AgGrid:** move column config by hand. `field` stays `field`, `headerName` becomes `title`, `cell.type` becomes the column's `type` and the rest of `cell` stays. Row events carry `{ row, rowKey, index }`, and button and menu events the same payloads as AgGrid's button and menu cells. `AgGridInput*` holds the rows as its value; `TableInput` holds the changes, saved with `MongoDBTableChanges`.
