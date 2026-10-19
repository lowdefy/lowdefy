# Migration: Keep nested events that depend on each other

## Context

From Lowdefy v7, a browser event runs only the innermost block event that handles it. When a
block with actions for an event fires, the blocks around it skip that same browser event:

- A `Button` with `onClick` inside a clickable `Card` or `Box` runs only the button's `onClick`.
- A clickable block inside a `List` row does not also run the row block's `onClick`.
- A `Switch`, `CheckboxSwitch` or other input inside a clickable block runs its own `onChange`, not
  the outer `onClick`.
- In an `AgGrid` block, clicking a cell button, link, menu, input or selection checkbox runs only
  that control's event, not `onRowClick` or `onCellClick`.

Before v7, all of these events ran, and the outer event ran after the inner one. Almost always that
was a bug the app worked around, like a delete button that also opened the card it sits in. The
new behaviour fixes those cases without changes, so **this codemod leaves most nested events
alone**. It only changes the few places where the app clearly depended on both events running.

`bubble: true` on the inner event restores the v6 behaviour for that event:

```yaml
events:
  onClick:
    bubble: true
    try:
      - id: set_filter
        type: SetState
        params:
          filter: open
```

## What to Do

### Step 1: Find nested event pairs

List every **pair** of an inner block and an ancestor block where one browser event used to run
both:

- The ancestor has `onClick`, and a descendant has `onClick`, `onChange` (inputs toggled by a
  click: `Switch`, `CheckboxSwitch`, `Checkbox`-type inputs, `Selector`, `ButtonSelector`,
  `RadioSelector`, `RatingSlider`), or another click event (`onRowClick`, `onCellClick`, `onMenuClick`,
  `onTagClick`, `onItemClick`, `onSelect`).
- Descendants include blocks in `blocks`, `slots` and `areas`, blocks in `_ref` components and
  templates, and rows of `List`-category blocks.
- Skip pairs where the inner block is in a `Modal`, `Drawer` or other popup that the ancestor
  contains. Those clicks already did not reach the ancestor.

Separately, list each `AgGrid*` block that has `onRowClick` or `onCellClick` **and** cell controls:
`cell.type: buttons`, `menu`, `link`, `avatar` with a `link`, `selector`, `multipleSelector`,
`switch`, `textInput` or `paragraphInput`.

### Step 2: Keep a pair bubbling only when it has a data dependency

For each nested pair, add `bubble: true` to the **inner** event only when the outer event reads
something the inner event writes. That is, the outer event's actions (including `skip`,
`:if`/`:switch` conditions and params) read a value that one of the inner event's actions sets,
without the outer event setting it first:

- `_state: key` (or a sub-path of it) where the inner event runs `SetState` on `key`, or the inner
  block is an input whose value is `key` (its `blockId`) and the inner event is its `onChange`.
- `_global: key` where the inner event runs `SetGlobal` on `key`.
- `_actions: action_id` of an action in the inner event.

Example that keeps bubbling (the card's Request needs the filter the tag sets):

```yaml
# v6: clicking a Tag set the filter, then the Card's onClick fetched with it
- id: filter_card
  type: Card
  events:
    onClick:
      - id: fetch
        type: Request
        params: fetch_tickets # its payload reads _state: filter
  blocks:
    - id: open_tag
      type: Tag
      events:
        onClick:
          - id: set_filter
            type: SetState
            params:
              filter: open

    # v7
    - id: open_tag
      type: Tag
      events:
        onClick:
          bubble: true
          try:
            - id: set_filter
              type: SetState
              params:
                filter: open
```

When the outer event reads a request's response (`_request`), check whether that request's payload
reads a value the inner event sets, and treat that as a dependency too.

Convert an action list to the `{ try, catch }` form when you add `bubble`, keeping any existing
`catch`, `debounce` or `shortcut`.

Do **not** add `bubble: true` in any other case, even when both events look related. The outer
event running as well was usually the bug, for example:

- The outer event navigates (`Link`), opens something (`CallMethod` `open`/`toggleOpen`, a
  `Modal`/`Drawer`), or selects the item, and the inner block is a control with its own purpose
  (edit, delete, copy, toggle, menu).
- The inner event already does everything the outer one does.

### Step 3: AgGrid row clicks that cell controls relied on

For each `AgGrid*` block from Step 1, `bubble` cannot help, because the row event and the cell
control's event belong to the same block. Look for cell control events (the `eventName` of cell
buttons and menu items, `onCellLink`, and cell input events) whose actions read state that
`onRowClick` or `onCellClick` sets, usually a selected row:

```yaml
# v6: clicking the Edit button also ran onRowClick, which set selected_row first
events:
  onRowClick:
    - id: select_row
      type: SetState
      params:
        selected_row:
          _event: row
  onEditClick:
    - id: open_editor
      type: CallMethod
      params:
        blockId: edit_modal
        method: open
    - id: fill_form
      type: SetState
      params:
        form:
          _state: selected_row # set by onRowClick in v6

# v7: set the row in the button's own event; cell events carry the row as _event: row
  onEditClick:
    - id: select_row_for_edit
      type: SetState
      params:
        selected_row:
          _event: row
    - id: open_editor
      ...
```

Copy the `SetState` actions from `onRowClick`/`onCellClick` to the start of the control's event,
with new action ids, when they only use `_event: row` or other values the control's event also
has (cell button and menu events have `row`; `onCellLink` has `row` and `link`). Do not copy
`rowIndex`, `selected`, `cell` or `colId` reads, which cell control events do not carry; report
those instead.

### Step 4: Report

Produce a report with three sections:

1. **Changed.** Each inner event given `bubble: true`, and each AgGrid control event given copied
   actions: file path, line number, block id, event name, and the value that creates the
   dependency (for example `_state: filter`, set by `set_filter`).
2. **Needs a decision.** Dependencies you could not resolve: outer events that read `_request`
   responses you could not trace, AgGrid control events that read `rowIndex`/`selected`/`cell`,
   and nested events whose blocks are built at runtime (`Dynamic` blocks, `_js`, config from
   requests).
3. **New behaviour, no change.** The count of nested pairs and AgGrid grids left as they are,
   grouped by pattern (button in clickable card or box, control in list row, input in clickable
   block, AgGrid cell control), with file paths. The author can scan these for the rare case
   where the outer event should still run.

## Scope

`app`: all YAML and Nunjucks config, including shared components, modules and templates reached
through `_ref`.

## Files to Check

Glob: `**/*.{yaml,yml,njk,json}`
Grep: `onClick:|onRowClick:|onCellClick:`

## Verification

- `lowdefy build` passes.
- Every `bubble: true` added in Step 2 is on an inner event whose ancestor reads a value it sets,
  and is listed in the report.
- Clicking each changed control in the running app still runs both events, and clicking controls
  from the "no change" list runs only the control's event.
