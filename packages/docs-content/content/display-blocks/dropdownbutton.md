# DropdownButton

Button that opens a dropdown menu of action items. Each item triggers a named event — define item eventNames and matching events in the block events section. Supports split button mode with a primary action button and a dropdown arrow.

```yaml
- id: db_basic
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Actions
    items:
      - title: Edit
        eventName: onEdit
        icon: AiOutlineEdit
      - title: Duplicate
        eventName: onDuplicate
        icon: AiOutlineCopy
      - type: divider
      - title: Delete
        eventName: onDelete
        icon: AiOutlineDelete
        danger: true
  events:
    onEdit:
      - id: db_basic_edit_msg
        type: DisplayMessage
        params:
          content: Edit clicked
          duration: 2
    onDuplicate:
      - id: db_basic_dup_msg
        type: DisplayMessage
        params:
          content: Duplicate clicked
          duration: 2
    onDelete:
      - id: db_basic_del_msg
        type: DisplayMessage
        params:
          content: Delete clicked
          status: error
          duration: 2
```

```yaml
- id: db_split
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Save
    icon: AiOutlineSave
    color: primary
    variant: solid
    split: true
    items:
      - title: Save as Draft
        eventName: onSaveDraft
        icon: AiOutlineFile
      - title: Save & Publish
        eventName: onPublish
        icon: AiOutlineSend
  events:
    onClick:
      - id: db_split_save_msg
        type: DisplayMessage
        params:
          content: Save clicked
          status: success
          duration: 2
    onSaveDraft:
      - id: db_split_draft_msg
        type: DisplayMessage
        params:
          content: Saved as draft
          duration: 2
    onPublish:
      - id: db_split_pub_msg
        type: DisplayMessage
        params:
          content: Published!
          status: success
          duration: 2
```

```yaml
- id: db_type_primary
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Primary
    color: primary
    variant: solid
    items:
      - title: Action A
        eventName: onA
      - title: Action B
        eventName: onB
- id: db_type_default
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Default
    items:
      - title: Action A
        eventName: onA
      - title: Action B
        eventName: onB
- id: db_type_dashed
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Dashed
    color: default
    variant: dashed
    items:
      - title: Action A
        eventName: onA
      - title: Action B
        eventName: onB
- id: db_type_text
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Text
    color: default
    variant: text
    items:
      - title: Action A
        eventName: onA
      - title: Action B
        eventName: onB
```

```yaml
- id: db_size_small
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Small
    size: small
    items:
      - title: Item 1
        eventName: on1
      - title: Item 2
        eventName: on2
- id: db_size_middle
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Middle
    size: middle
    items:
      - title: Item 1
        eventName: on1
      - title: Item 2
        eventName: on2
- id: db_size_large
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Large
    size: large
    items:
      - title: Item 1
        eventName: on1
      - title: Item 2
        eventName: on2
```

```yaml
- id: db_icon
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Export
    icon: AiOutlineDownload
    color: primary
    variant: outlined
    items:
      - title: Export as CSV
        eventName: onCSV
        icon: AiOutlineFile
      - title: Export as PDF
        eventName: onPDF
        icon: AiOutlineFilePdf
      - title: Export as Excel
        eventName: onExcel
        icon: AiOutlineFileExcel
  events:
    onCSV:
      - id: db_icon_csv_msg
        type: DisplayMessage
        params:
          content: Exporting CSV...
          duration: 2
    onPDF:
      - id: db_icon_pdf_msg
        type: DisplayMessage
        params:
          content: Exporting PDF...
          duration: 2
    onExcel:
      - id: db_icon_excel_msg
        type: DisplayMessage
        params:
          content: Exporting Excel...
          duration: 2
```

```yaml
- id: db_disabled_items
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Manage
    items:
      - title: View Details
        eventName: onView
        icon: AiOutlineEye
      - title: Edit (no permission)
        eventName: onEdit
        icon: AiOutlineEdit
        disabled: true
      - type: divider
      - title: Archive
        eventName: onArchive
        icon: AiOutlineDelete
        danger: true
  events:
    onView:
      - id: db_dis_view_msg
        type: DisplayMessage
        params:
          content: Viewing details...
          duration: 2
    onArchive:
      - id: db_dis_archive_msg
        type: DisplayMessage
        params:
          content: Archived!
          status: warning
          duration: 2
```

```yaml
- id: db_shortcuts
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Edit
    icon: AiOutlineEdit
    items:
      - title: Undo
        eventName: onUndo
        icon: AiOutlineUndo
      - title: Redo
        eventName: onRedo
        icon: AiOutlineRedo
      - type: divider
      - title: Delete
        eventName: onDelete
        icon: AiOutlineDelete
        danger: true
  events:
    onUndo:
      shortcut: alt+z
      try:
        - id: db_sc_undo_msg
          type: DisplayMessage
          params:
            content: Undo
            duration: 2
    onRedo:
      shortcut: alt+shift+z
      try:
        - id: db_sc_redo_msg
          type: DisplayMessage
          params:
            content: Redo
            duration: 2
    onDelete:
      shortcut: alt+Backspace
      try:
        - id: db_sc_del_msg
          type: DisplayMessage
          params:
            content: Deleted
            status: error
            duration: 2
```

```yaml
- id: db_hover
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Hover Menu
    trigger: hover
    items:
      - title: Quick Action A
        eventName: onQuickA
      - title: Quick Action B
        eventName: onQuickB
```

```yaml
- id: db_split_small
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Small Split
    color: primary
    variant: solid
    size: small
    split: true
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
- id: db_split_default
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Default Split
    color: primary
    variant: solid
    split: true
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
- id: db_split_large
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Large Split
    color: primary
    variant: solid
    size: large
    split: true
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
```

```yaml
- id: db_openchange
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Track Open
    items:
      - title: Item A
        eventName: onA
      - title: Item B
        eventName: onB
  events:
    onOpenChange:
      - id: db_openchange_msg
        type: DisplayMessage
        params:
          content: Dropdown toggled!
          duration: 2
```

```yaml
- id: db_color_primary
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Primary
    color: primary
    variant: solid
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
- id: db_color_danger
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Danger
    color: danger
    variant: solid
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
- id: db_color_green
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Green
    color: green
    variant: solid
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
- id: db_color_custom
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Custom Hex
    color: "#722ed1"
    variant: solid
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
```

```yaml
- id: db_ghost
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Ghost
    color: primary
    variant: solid
    ghost: true
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
- id: db_danger_btn
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Danger Button
    danger: true
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
```

```yaml
- id: db_shape_square
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Square
    shape: square
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
- id: db_shape_round
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Round
    shape: round
    items:
      - title: Option A
        eventName: onA
      - title: Option B
        eventName: onB
```

```yaml
- id: db_theme_account
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: My Account
    icon: AiOutlineUser
    color: "#531dab"
    variant: solid
    theme:
      borderRadiusLG: 12
      controlItemBgHover: "#f9f0ff"
      controlItemBgActive: "#efdbff"
      button:
        borderRadius: 20
        paddingInline: 24
        controlHeight: 40
    items:
      - title: Profile Settings
        eventName: onProfile
        icon: AiOutlineSetting
      - title: Billing & Plans
        eventName: onBilling
        icon: AiOutlineCreditCard
      - type: divider
      - title: Sign Out
        eventName: onSignOut
        icon: AiOutlineLogout
        danger: true
  events:
    onProfile:
      - id: db_theme_profile_msg
        type: DisplayMessage
        params:
          content: Opening profile settings...
          duration: 2
    onBilling:
      - id: db_theme_billing_msg
        type: DisplayMessage
        params:
          content: Opening billing page...
          duration: 2
    onSignOut:
      - id: db_theme_signout_msg
        type: DisplayMessage
        params:
          content: Signed out
          status: warning
          duration: 2
```

```yaml
- id: db_theme_dangerzone
  type: DropdownButton
  layout:
    flex: 0 0 auto
  properties:
    title: Delete Account
    icon: AiOutlineWarning
    color: danger
    variant: solid
    split: true
    theme:
      borderRadiusLG: 8
      button:
        colorPrimary: "#cf1322"
        colorPrimaryHover: "#a8071a"
        colorPrimaryActive: "#820014"
    items:
      - title: Delete All Data
        eventName: onDeleteData
        icon: AiOutlineDelete
        danger: true
      - title: Export Data First
        eventName: onExportFirst
        icon: AiOutlineDownload
  events:
    onClick:
      - id: db_dz_click_msg
        type: DisplayMessage
        params:
          content: Are you sure? This cannot be undone.
          status: error
          duration: 3
    onDeleteData:
      - id: db_dz_deldata_msg
        type: DisplayMessage
        params:
          content: All data deleted permanently.
          status: error
          duration: 3
    onExportFirst:
      - id: db_dz_export_msg
        type: DisplayMessage
        params:
          content: Exporting data before deletion...
          duration: 2
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | - | Button label text. |
| `icon` | string \| object | - | Name of a React-Icon or properties of an Icon block to use icon in button. |
| `type` | string | `"default"` | Deprecated - use color and variant instead. The button type. Enum: `primary`, `default`, `dashed`, `text`, `link`. |
| `color` | string | - | Button color. Preset values: default, primary, danger, blue, purple, cyan, green, magenta, pink, red, orange, yellow, volcano, geekblue, lime, gold. Also accepts custom hex color strings. |
| `variant` | string | - | Button visual variant. When set, takes precedence over type. Enum: `solid`, `outlined`, `dashed`, `filled`, `text`, `link`. |
| `size` | string | `"middle"` | Button size. Enum: `small`, `middle`, `large`. |
| `shape` | string | `"square"` | Shape of the button. Enum: `circle`, `round`, `square`. |
| `danger` | boolean | `false` | Set button style to danger. |
| `ghost` | boolean | `false` | Make the button's background transparent. |
| `disabled` | boolean | `false` | Disable the entire dropdown. |
| `trigger` | string | `"click"` | How the dropdown opens. Enum: `click`, `hover`. |
| `placement` | string | `"bottomRight"` | Dropdown position. Enum: `bottomLeft`, `bottom`, `bottomRight`, `topLeft`, `top`, `topRight`. |
| `arrow` | boolean \| object | `false` | Show arrow pointing to trigger. |
| `arrow.pointAtCenter` | boolean | - |  |
| `split` | boolean | `false` | Split button mode. Left button fires onClick, right arrow opens dropdown. |
| `items` | array | - | Menu items. Each with an eventName that triggers a named event. Keyboard shortcuts can be configured via the standard `events..shortcut` schema (preferred) or via the item-level `shortcut` property — both render a badge next to the item label. The event-level shortcut takes precedence when both are set. |
| `items.$.title` | string | - | Display text. |
| `items.$.eventName` | string | - | Event name to trigger when clicked. |
| `items.$.icon` | string \| object | - | Icon name or config. |
| `items.$.danger` | boolean | - | Red danger styling. |
| `items.$.disabled` | boolean | - | Disable this item. |
| `items.$.type` | string | - | Set to divider for a separator. Enum: `divider`. |
| `items.$.shortcut` | string | - | Keyboard shortcut. Binds the key and renders the badge. Prefer configuring this via `events..shortcut` to follow the standard Lowdefy event schema — the event-level shortcut takes precedence when both are set. |
| `theme` | object | - | Antd design token overrides. Top-level keys apply to the Dropdown menu. Use the nested "button" key for Button-specific tokens. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design dropdown tokens](https://ant.design/components/dropdown#design-token). |
| `theme.zIndexPopup` | number | `1050` | Z-index of the dropdown popup. |
| `theme.controlItemBgHover` | string | - | Background color on menu item hover. |
| `theme.borderRadiusLG` | number | - | Border radius for the dropdown menu. |
| `theme.paddingBlock` | number | - | Vertical padding for menu items. |
| `theme.button` | object | - | Button component token overrides. See [Button design tokens](https://ant.design/components/button#design-token). See [Ant Design button tokens](https://ant.design/components/button#design-token). |
| `theme.button.borderRadius` | number | `6` | Border radius of the button. |
| `theme.button.borderRadiusLG` | number | `8` | Border radius for large buttons. |
| `theme.button.borderRadiusSM` | number | `4` | Border radius for small buttons. |
| `theme.button.controlHeight` | number | `32` | Height of the button. |
| `theme.button.controlHeightLG` | number | `40` | Height for large buttons. |
| `theme.button.controlHeightSM` | number | `24` | Height for small buttons. |
| `theme.button.fontSize` | number | `14` | Font size. |
| `theme.button.paddingInline` | number | `15` | Horizontal padding. |
| `theme.button.paddingBlock` | number | `0` | Vertical padding. |
| `theme.button.colorPrimary` | string | - | Primary color override. |
| `theme.button.colorPrimaryHover` | string | - | Primary hover color. |
| `theme.button.colorPrimaryActive` | string | - | Primary active color. |
| `theme.button.colorBgContainer` | string | - | Background color for default buttons. |
| `theme.button.colorText` | string | - | Text color for default buttons. |
| `theme.button.colorBorder` | string | - | Border color for outlined and dashed buttons. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Trigger action when the button is clicked (split mode). Renders a shortcut badge when a shortcut is configured on the event. |
| `onOpenChange` | \- | Trigger action when dropdown opens or closes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The outer container. |
| `/button` | The trigger button. |
| `/icon` | The icon in the button. |
| `/menu` | The floating menu container. |
| `/item` | Individual menu items. |
| `/itemIcon` | Icon within menu items. |
| `/arrow` | Dropdown arrow indicator. |

No slots defined.
