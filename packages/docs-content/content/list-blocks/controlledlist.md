# ControlledList

Dynamic list with built-in add and remove controls. Supports custom add/remove buttons, conditional field visibility, nested lists, theme tokens, and scoped validation. Use `addItemButton` and `removeItemIcon` to customize controls, and `visible` with operators for conditional fields.

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

```yaml
team:
  _state: team
```

```yaml
- id: bookmarks
  type: ControlledList
  properties:
    title: Bookmarks
    addToFront: true
    size: small
    addItemButton:
      title: Bookmark
      icon: AiOutlinePlus
      color: primary
      variant: dashed
    removeItemIcon:
      name: AiOutlineDelete
  blocks:
    - id: bookmarks.$.url
      type: TextInput
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: https://...
        prefixIcon: AiOutlineLink
    - id: bookmarks.$.label
      type: TextInput
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Label
```

```yaml
bookmarks:
  _state: bookmarks
```

```yaml
- id: attendees
  type: ControlledList
  properties:
    title: Attendees
    addItemButton:
      title: Add Attendee
      icon: AiOutlineUserAdd
      color: primary
      variant: outlined
  blocks:
    - id: attendees.$.name
      type: TextInput
      required: true
      layout:
        flex: 2 1 0
      properties:
        label:
          disabled: true
        placeholder: Full name
    - id: attendees.$.type
      type: Selector
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Type
        options:
          - Adult
          - Child
          - Senior
    - id: attendees.$.email
      type: TextInput
      required: true
      visible:
        _eq:
          - _state: attendees.$.type
          - Adult
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Email
      validate:
        - message: Enter a valid email.
          status: error
          pass:
            _regex:
              pattern: ^[^@]+@[^@]+\.[^@]+$
              on:
                _if_none:
                  - _state: attendees.$.email
                  - ""
    - id: attendees.$.meal
      type: Selector
      visible:
        _eq:
          - _state: attendees.$.type
          - Adult
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Meal
        options:
          - Standard
          - Vegetarian
          - Vegan
    - id: attendees.$.age
      type: NumberInput
      visible:
        _eq:
          - _state: attendees.$.type
          - Child
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Age
        min: 1
        max: 17
    - id: attendees.$.supervision
      type: Switch
      visible:
        _eq:
          - _state: attendees.$.type
          - Child
      layout:
        flex: 0 0 auto
      properties:
        label:
          title: Needs supervision
        size: small
    - id: attendees.$.wheelchair
      type: Switch
      visible:
        _eq:
          - _state: attendees.$.type
          - Senior
      layout:
        flex: 0 0 auto
      properties:
        label:
          title: Wheelchair access
        size: small
    - id: attendees.$.dietary
      type: TextInput
      visible:
        _eq:
          - _state: attendees.$.type
          - Senior
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Dietary notes
- id: attendees_footer
  type: Box
  layout:
    justify: flex-end
  blocks:
    - id: attendees_register
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Register All
        icon: AiOutlineSend
        color: primary
        variant: solid
      events:
        onClick:
          - id: attendees_validate
            type: Validate
            params:
              regex: ^attendees
          - id: attendees_msg
            type: DisplayMessage
            params:
              content: All attendees registered!
              status: success
```

```yaml
- id: attendees
  type: ControlledList
  properties:
    title: Attendees
    addItemButton:
      title: Add Attendee
      icon: AiOutlineUserAdd
      color: primary
      variant: outlined
  blocks:
    - id: attendees.$.name
      type: TextInput
      required: true
      layout:
        flex: 2 1 0
      properties:
        label:
          disabled: true
        placeholder: Full name
    - id: attendees.$.type
      type: Selector
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Type
        options:
          - Adult
          - Child
          - Senior
    - id: attendees.$.email
      type: TextInput
      required: true
      visible:
        _eq:
          - _state: attendees.$.type
          - Adult
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Email
      validate:
        - message: Enter a valid email.
          status: error
          pass:
            _regex:
              pattern: ^[^@]+@[^@]+\.[^@]+$
              on:
                _if_none:
                  - _state: attendees.$.email
                  - ""
    - id: attendees.$.meal
      type: Selector
      visible:
        _eq:
          - _state: attendees.$.type
          - Adult
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Meal
        options:
          - Standard
          - Vegetarian
          - Vegan
    - id: attendees.$.age
      type: NumberInput
      visible:
        _eq:
          - _state: attendees.$.type
          - Child
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Age
        min: 1
        max: 17
    - id: attendees.$.supervision
      type: Switch
      visible:
        _eq:
          - _state: attendees.$.type
          - Child
      layout:
        flex: 0 0 auto
      properties:
        label:
          title: Needs supervision
        size: small
    - id: attendees.$.wheelchair
      type: Switch
      visible:
        _eq:
          - _state: attendees.$.type
          - Senior
      layout:
        flex: 0 0 auto
      properties:
        label:
          title: Wheelchair access
        size: small
    - id: attendees.$.dietary
      type: TextInput
      visible:
        _eq:
          - _state: attendees.$.type
          - Senior
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Dietary notes
- id: attendees_footer
  type: Box
  layout:
    justify: flex-end
  blocks:
    - id: attendees_register
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Register All
        icon: AiOutlineSend
        color: primary
        variant: solid
      events:
        onClick:
          - id: attendees_validate
            type: Validate
            params:
              regex: ^attendees
          - id: attendees_msg
            type: DisplayMessage
            params:
              content: All attendees registered!
              status: success
```

```yaml
attendees:
  _state: attendees
attendees_footer:
  _state: attendees_footer
```

```yaml
- id: expenses
  type: ControlledList
  properties:
    title: Expenses
    addItemButton:
      title: Add Expense
      icon: AiOutlinePlus
      color: primary
      variant: dashed
    theme:
      itemPadding: 16px 12px
  blocks:
    - id: expenses.$.date
      type: DateSelector
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Date
    - id: expenses.$.category
      type: Selector
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Category
        options:
          - Travel
          - Meals
          - Software
          - Equipment
          - Other
    - id: expenses.$.desc
      type: TextInput
      required: true
      layout:
        flex: 2 1 0
      properties:
        label:
          disabled: true
        placeholder: Description
    - id: expenses.$.amount
      type: NumberInput
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Amount
        min: 0
        step: 0.01
- id: expenses_footer
  type: Box
  layout:
    gap: 16
    justify: flex-end
    align: center
  blocks:
    - id: expenses_total
      type: Statistic
      layout:
        flex: 0 0 auto
      properties:
        title: Total Expenses
        prefix: $
        precision: 2
        value:
          _js: |
            const expenses = state('expenses') || [];
            return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    - id: expenses_submit
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Submit Report
        icon: AiOutlineSend
        color: primary
        variant: solid
      events:
        onClick:
          - id: expenses_validate
            type: Validate
            params:
              regex: ^expenses
          - id: expenses_msg
            type: DisplayMessage
            params:
              content: Expense report submitted!
              status: success
```

```yaml
- id: expenses
  type: ControlledList
  properties:
    title: Expenses
    addItemButton:
      title: Add Expense
      icon: AiOutlinePlus
      color: primary
      variant: dashed
    theme:
      itemPadding: 16px 12px
  blocks:
    - id: expenses.$.date
      type: DateSelector
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Date
    - id: expenses.$.category
      type: Selector
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Category
        options:
          - Travel
          - Meals
          - Software
          - Equipment
          - Other
    - id: expenses.$.desc
      type: TextInput
      required: true
      layout:
        flex: 2 1 0
      properties:
        label:
          disabled: true
        placeholder: Description
    - id: expenses.$.amount
      type: NumberInput
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Amount
        min: 0
        step: 0.01
- id: expenses_footer
  type: Box
  layout:
    gap: 16
    justify: flex-end
    align: center
  blocks:
    - id: expenses_total
      type: Statistic
      layout:
        flex: 0 0 auto
      properties:
        title: Total Expenses
        prefix: $
        precision: 2
        value:
          _js: |
            const expenses = state('expenses') || [];
            return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    - id: expenses_submit
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Submit Report
        icon: AiOutlineSend
        color: primary
        variant: solid
      events:
        onClick:
          - id: expenses_validate
            type: Validate
            params:
              regex: ^expenses
          - id: expenses_msg
            type: DisplayMessage
            params:
              content: Expense report submitted!
              status: success
```

```yaml
expenses:
  _state: expenses
expenses_footer:
  _state: expenses_footer
```

```yaml
- id: projects
  type: ControlledList
  properties:
    title: Projects
    addItemButton:
      title: Add Project
      icon: AiOutlinePlus
      color: primary
      variant: outlined
  blocks:
    - id: projects.$.name
      type: TextInput
      required: true
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Project name
    - id: projects.$.status
      type: Selector
      layout:
        flex: 0 0 140px
      properties:
        label:
          disabled: true
        placeholder: Status
        options:
          - Planning
          - Active
          - Review
          - Done
    - id: projects.$.tasks
      type: ControlledList
      properties:
        title: Tasks
        size: small
        addItemButton:
          title: Add Task
          icon: AiOutlinePlus
          size: small
          variant: dashed
      blocks:
        - id: projects.$.tasks.$.task
          type: TextInput
          required: true
          layout:
            flex: 1 1 0
          properties:
            label:
              disabled: true
            placeholder: Task description
            size: small
        - id: projects.$.tasks.$.done
          type: Switch
          layout:
            flex: 0 0 auto
          properties:
            label:
              title: Done
            size: small
- id: projects_footer
  type: Box
  layout:
    justify: flex-end
  blocks:
    - id: projects_save
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Save All
        icon: AiOutlineSave
        color: primary
        variant: solid
      events:
        onClick:
          - id: projects_validate
            type: Validate
            params:
              regex: ^projects
          - id: projects_msg
            type: DisplayMessage
            params:
              content: Projects saved!
              status: success
```

```yaml
projects:
  _state: projects
projects_footer:
  _state: projects_footer
```

```yaml
- id: tags
  type: ControlledList
  properties:
    title: Tags
    size: small
    addItemButton:
      title: Add Tag
      icon: AiOutlinePlus
      size: small
      variant: dashed
  events:
    onAdd:
      - id: tags_added_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Added row at index "
              - _event: index
          duration: 1
    onRemove:
      - id: tags_removed_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - Removed "
              - _if_none:
                  - _event: item.label
                  - (empty)
              - '" at index '
              - _event: index
          status: warning
          duration: 2
  blocks:
    - id: tags.$.label
      type: TextInput
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Tag name
        size: small
```

```yaml
- id: tags
  type: ControlledList
  properties:
    title: Tags
    size: small
    addItemButton:
      title: Add Tag
      icon: AiOutlinePlus
      size: small
      variant: dashed
  events:
    onAdd:
      - id: tags_added_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Added row at index "
              - _event: index
          duration: 1
    onRemove:
      - id: tags_removed_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - Removed "
              - _if_none:
                  - _event: item.label
                  - (empty)
              - '" at index '
              - _event: index
          status: warning
          duration: 2
  blocks:
    - id: tags.$.label
      type: TextInput
      layout:
        flex: 1 1 0
      properties:
        label:
          disabled: true
        placeholder: Tag name
        size: small
```

```yaml
tags:
  _state: tags
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | - | Controlled list title. |
| `addToFront` | boolean | `false` | When true, add new items to the front of the list. |
| `hideAddButton` | boolean | `false` | When true, hide the add new item button. |
| `size` | string | `"default"` | Size of the list. Enum: `small`, `default`, `large`. |
| `addItemButton` | object | - | Custom add item button properties. |
| `removeItemIcon` | string \| object | - | Custom remove item icon properties. Defaults to `AiOutlineMinusCircle` at a standard size with the antd error color inherited from the icon wrapper — override via `class.removeIcon` / `style.removeIcon` for visual tweaks, or via this property to change the icon name itself. |
| `hideRemoveButton` | boolean | `false` | When true, hide the remove item button on each list item. |
| `noDataTitle` | string | - | Title to show when list is empty. |
| `minItems` | number | `0` | Minimum number of items in the controlled list. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design list tokens](https://ant.design/components/list#design-token). |
| `theme.titleMarginBottom` | number | `12` | Margin bottom of list item title. |
| `theme.contentWidth` | number | `220` | Width of the content area. |
| `theme.itemPadding` | string | `"12px 0"` | Padding of list items. |
| `theme.itemPaddingLG` | string | `"16px 24px"` | Padding of list items (large size). |
| `theme.itemPaddingSM` | string | `"8px 16px"` | Padding of list items (small size). |
| `theme.headerBg` | string | `"transparent"` | Background color of the list header. |
| `theme.footerBg` | string | `"transparent"` | Background color of the list footer. |
| `theme.emptyTextPadding` | number | `32` | Padding for the empty text area. |
| `theme.metaMarginBottom` | number | `16` | Margin bottom of list item meta. |
| `theme.avatarMarginRight` | number | `16` | Margin right of the avatar in list items. |
| `theme.descriptionFontSize` | number | `14` | Font size of the description text. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onAdd` | `{ index: integer, item: any }` | Triggered after a new item is added via the add button. |
| `onRemove` | `{ index: integer, item: any }` | Triggered after an item is removed via the remove icon. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The ControlledList element. |
| `/header` | The ControlledList header. |
| `/footer` | The ControlledList footer. |
| `/item` | The ControlledList item. |
| `/removeIcon` | The remove-item icon wrapper. Defaults to the antd error color at `fontSizeLG`; override `color`, `font-size`, or spacing here. |

| Slot | Description |
| --- | --- |
| `content` | Blocks rendered for each list item. |
