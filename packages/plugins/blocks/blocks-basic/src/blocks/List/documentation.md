<TITLE>
List
</TITLE>

<DESCRIPTION>

The List block renders a content area for all items in the array. All list blocks create a array in state at their block `id`. The list content areas are rendered for each index in the array. See the [List Concept](/lists) page for a detailed description on how to work with lists.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "direction": {
        "type": "string",
        "enum": ["row", "column", "row-reverse", "column-reverse"],
        "description": "List content along a 'row' or down a 'column'. Applies the 'flex-direction' css property to the List block."
      },
      "wrap": {
        "type": "string",
        "enum": ["wrap", "nowrap", "wrap-reverse"],
        "description": "Specifies wrapping style to be applied to List block as 'wrap', 'nowrap' or 'wrap-reverse'. Applies the 'flex-wrap' css property to the List block - defaults to 'wrap', requires List direction to be set."
      },
      "scroll": {
        "type": "boolean",
        "description": "Specifies whether scrolling should be applied to the List, can be true or false. Applies the 'overflow' css property to the List block - defaults to 'visible', requires List direction to be set."
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to List block.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Trigger actions when the List is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Todo List

```yaml
id: todo_app
type: Box
layout:
  contentGutter: 16
blocks:
  - id: todo_input
    type: TextInput
    layout:
      grow: 1
    properties:
      label:
        disabled: true
      placeholder: Write something todo...
  - id: add_item
    type: Button
    layout:
      shrink: 1
    properties:
      icon: AiOutlinePlus
      title: Add item
    events:
      onClick:
        - id: add
          type: SetState
          params:
            todo_input: null
            todos:
              _array.concat:
                - - _state: todo_input
                - _state: todos
- id: todos
  type: List
  layout:
    contentGutter: 16
  blocks:
    - id: todos.$
      type: TitleInput
      layout:
        grow: 1
      properties:
        level: 4
    - id: remove_item
      type: Icon
      layout:
        shrink: 1
      properties:
        name: AiOutlineMinusCircle
        size: 18
      events:
        onClick:
          - id: remove
            type: CallMethod
            messages:
              loading: Removing Item...
              success: Item Removed.
            params:
              blockId: todos
              method: removeItem
              args:
                - _index: 0
```

</EXAMPLES>
