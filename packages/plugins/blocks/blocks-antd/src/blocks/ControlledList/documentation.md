<TITLE>
ControlledList
</TITLE>

<DESCRIPTION>

The ControlledList block renders a content area for all items in the array into the list card and provides easy UI elements to add or remove items in the list. All list blocks create a array in state at their block `id`. The list content areas are rendered for each index in the array. See the [List Concept](/lists) page for a detailed description on how to work with lists.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "title": {
        "type": "string",
        "description": "Controlled list title."
      },
      "addToFront": {
        "type": "boolean",
        "default": false,
        "description": "When true, add new items to the front of the list."
      },
      "hideAddButton": {
        "type": "boolean",
        "default": false,
        "description": "When true, hide the add new item button."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "When true, hide the add new item button."
      },
      "style": {
        "type": "object",
        "description": "Css style object to applied to content.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "addItemButton": {
        "type": "object",
        "description": "Custom add item button properties.",
        "docs": {
          "displayType": "button"
        }
      },
      "removeItemIcon": {
        "type": ["string", "object"],
        "description": "Custom remove item icon properties.",
        "docs": {
          "displayType": "icon"
        }
      },
      "footerStyle": {
        "type": "object",
        "description": "Css style object to applied to controlled list footer.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "itemStyle": {
        "type": "object",
        "description": "Css style object to applied to controlled list items.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "noDataTitle": {
        "type": "string",
        "description": "Title to show when list is empty."
      },
      "minItems": {
        "type": "number",
        "default": 0,
        "description": "Minimum number of items in the controlled list."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Todo List

```yaml
id: todos
type: ControlledList
blocks:
  - id: todos.$
    type: TitleInput
    properties:
      level: 4
```

### List of Contacts

```yaml
id: contacts
type: ControlledList
blocks:
  - id: contacts.$.first_name
    type: TextInput
    layout:
      span: 12
    properties:
      label:
        align: right
        span: 10
      title: First Name
    required: true
  - id: contacts.$.last_name
    type: TextInput
    layout:
      span: 12
    properties:
      label:
        align: right
        span: 10
      title: Last Name
    required: true
  - id: contacts.$.date_of_birth
    type: DateSelector
    layout:
      span: 12
    properties:
      label:
        align: right
        span: 10
      title: Date of Birth
    required: true
  - id: contacts.$.email
    type: TextInput
    layout:
      span: 12
    properties:
      label:
        align: right
        span: 10
      title: Email address
    required: true
  - id: contacts.$.phone_number
    type: TextInput
    layout:
      span: 12
    properties:
      label:
        align: right
        span: 10
      title: Phone number
  - id: contacts.$.preference
    type: ButtonSelector
    layout:
      span: 12
    properties:
      label:
        align: right
        span: 10
      options:
        - Phone
        - Email
      title: Preference
```

</EXAMPLES>
