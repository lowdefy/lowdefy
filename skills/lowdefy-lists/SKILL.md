---
name: lowdefy-lists
description: Use when repeating blocks over an array in state — `List` and `ControlledList`, `$` index placeholders in block ids, `_index`, and adding/removing items.
---

# List blocks

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Lists

`/lowdefy-docs/content/concepts/lists`

List category blocks render multiple [`content areas`](/layout), based on data in the [`state`](/page-and-app-state) object.

#### List

`/lowdefy-docs/content/list-blocks/list`

Flex-based list container that renders a template block for each item in an array. Supports column/row direction, wrapping, and scrolling. Use `CallMethod` with `pushItem`, `removeItem`, `moveItemUp`, and `moveItemDown` to manage items. Pair with `Validate` to validate inputs across all list rows.

#### ControlledList

`/lowdefy-docs/content/list-blocks/controlledlist`

Dynamic list with built-in add and remove controls. Supports custom add/remove buttons, conditional field visibility, nested lists, theme tokens, and scoped validation. Use `addItemButton` and `removeItemIcon` to customize controls, and `visible` with operators for conditional fields.

#### _index

`/lowdefy-docs/content/operators/_index`

The `_index` operator gets a value from the `list indices` array of a block. The `list indices` array is an array of the indices of all [`list`](/lists) block areas which the block is a part of.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### List

Provided by `@lowdefy/blocks-basic`. Category: `list`, value type: `array`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `direction` | `"row"`, `"column"`, `"row-reverse"`, `"column-reverse"` |  |  | List content along a 'row' or down a 'column'. Applies the 'flex-direction' css property to the List block. |
| `wrap` | `"wrap"`, `"nowrap"`, `"wrap-reverse"` |  |  | Specifies wrapping style to be applied to List block as 'wrap', 'nowrap' or 'wrap-reverse'. Applies the 'flex-wrap' css property to the List block - defaults to 'wrap', requires List direction to be set. |
| `scroll` | boolean |  |  | Specifies whether scrolling should be applied to the List, can be true or false. Applies the 'overflow' css property to the List block - defaults to 'visible', requires List direction to be set. |

##### Events

- `onClick`: Trigger actions when the List is clicked.

##### Example

```yaml
- id: notes_header
  type: Box
  layout:
    justify: space-between
    align: center
  blocks:
    - id: notes_title
      type: Title
      layout:
        flex: 0 0 auto
      properties:
        content: Notes
        level: 4
    - id: notes_add
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Add Note
        icon: AiOutlinePlus
        color: primary
        variant: solid
        size: small
      events:
        onClick:
          - id: notes_push
            type: CallMethod
            params:
              blockId: notes
              method: pushItem
```

#### ControlledList

Provided by `@lowdefy/blocks-antd`. Category: `list`, value type: `array`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `title` | string |  |  | Controlled list title. |
| `addToFront` | boolean |  | `false` | When true, add new items to the front of the list. |
| `hideAddButton` | boolean |  | `false` | When true, hide the add new item button. |
| `size` | `"small"`, `"default"`, `"large"` |  | `"default"` | Size of the list. |
| `addItemButton` | object |  |  | Custom add item button properties. |
| `removeItemIcon` | string \\| object |  |  | Custom remove item icon properties. Defaults to `AiOutlineMinusCircle` at a standard size with the antd error color inherited from the icon wrapper — override via `class.removeIcon` / `style.removeIcon` for visual tweaks, or via this property to change the icon name itself. |
| `hideRemoveButton` | boolean |  | `false` | When true, hide the remove item button on each list item. |
| `noDataTitle` | string |  |  | Title to show when list is empty. |
| `minItems` | number |  | `0` | Minimum number of items in the controlled list. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onAdd`: Triggered after a new item is added via the add button. The event payload is `{ index, item }`, where `item` is the newly added value (`undefined` for an empty row).
- `onRemove`: Triggered after an item is removed via the remove icon. The event payload is `{ index, item }`, where `item` is the removed value captured before removal.

##### Example

```yaml
- id: team
  type: ControlledList
  properties:
    title: Team Members
  blocks:
    - id: team.$.name
      type: TextInput
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Full name
    - id: team.$.role
      type: Selector
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Role
        options:
          - Developer
          - Designer
          - PM
          - QA
    - id: team.$.email
      type: TextInput
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Email
```

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _index

Provided by `@lowdefy/operators-js`.

Accepts integer: Returns the current array index when used inside a list block.
<!-- generated:reference:end -->

## Recipe

Must cover: the list value in state, `$` placeholders in child ids, `_index` in child operators, `ControlledList` add/remove, `pushItem`/`removeItem` methods with `CallMethod`, and why hidden list items keep their values.
