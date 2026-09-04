# DropdownMenu

Floating dropdown menu triggered by any child block. Menu items follow the Menu block links pattern — MenuLink for navigation, MenuGroup for grouping, MenuDivider for separators. Use trigger modes click, hover, or contextMenu.

```yaml
- id: dropdown_menu_basic
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_basic_home
        type: MenuLink
        pageId: home
        properties:
          title: Home
          icon: AiOutlineHome
      - id: dm_basic_profile
        type: MenuLink
        pageId: home
        properties:
          title: Profile
          icon: AiOutlineUser
      - id: dm_basic_div
        type: MenuDivider
      - id: dm_basic_logout
        type: MenuLink
        properties:
          title: Log Out
          icon: AiOutlineLogout
          danger: true
  blocks:
    - id: dropdown_menu_basic_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Account
        color: primary
        variant: solid
```

```yaml
- id: dropdown_menu_hover
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: dm_hover_item1
        type: MenuLink
        properties:
          title: Option A
      - id: dm_hover_item2
        type: MenuLink
        properties:
          title: Option B
      - id: dm_hover_item3
        type: MenuLink
        properties:
          title: Option C
  blocks:
    - id: dropdown_menu_hover_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Hover me
        color: default
        variant: outlined
```

Right-click anywhere in this card to open the context menu.

```yaml
- id: dropdown_menu_context
  type: DropdownMenu
  properties:
    trigger: contextMenu
    links:
      - id: dm_ctx_copy
        type: MenuLink
        properties:
          title: Copy
          icon: AiOutlineCopy
      - id: dm_ctx_paste
        type: MenuLink
        properties:
          title: Paste
          icon: AiOutlineSnippets
      - id: dm_ctx_div
        type: MenuDivider
      - id: dm_ctx_delete
        type: MenuLink
        properties:
          title: Delete
          icon: AiOutlineDelete
          danger: true
  blocks:
    - id: dropdown_menu_context_area
      type: Card
      properties:
        size: small
        bordered: true
      blocks:
        - id: dropdown_menu_context_text
          type: Paragraph
          properties:
            content: Right-click anywhere in this card to open the context menu.
```

```yaml
- id: dropdown_menu_pl_bl
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    placement: bottomLeft
    links:
      - id: dm_pl_bl_1
        type: MenuLink
        properties:
          title: Item 1
      - id: dm_pl_bl_2
        type: MenuLink
        properties:
          title: Item 2
  blocks:
    - id: dropdown_menu_pl_bl_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: bottomLeft
        color: primary
        variant: solid
        size: small
- id: dropdown_menu_pl_br
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    placement: bottomRight
    links:
      - id: dm_pl_br_1
        type: MenuLink
        properties:
          title: Item 1
      - id: dm_pl_br_2
        type: MenuLink
        properties:
          title: Item 2
  blocks:
    - id: dropdown_menu_pl_br_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: bottomRight
        color: primary
        variant: outlined
        size: small
- id: dropdown_menu_pl_tl
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    placement: topLeft
    links:
      - id: dm_pl_tl_1
        type: MenuLink
        properties:
          title: Item 1
      - id: dm_pl_tl_2
        type: MenuLink
        properties:
          title: Item 2
  blocks:
    - id: dropdown_menu_pl_tl_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: topLeft
        color: default
        variant: outlined
        size: small
```

```yaml
- id: dropdown_menu_arrow
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    arrow: true
    links:
      - id: dm_arrow_1
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
      - id: dm_arrow_2
        type: MenuLink
        properties:
          title: Help
          icon: AiOutlineQuestionCircle
  blocks:
    - id: dropdown_menu_arrow_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: With Arrow
        color: primary
        variant: solid
- id: dropdown_menu_arrow_center
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    arrow:
      pointAtCenter: true
    links:
      - id: dm_arrowc_1
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
      - id: dm_arrowc_2
        type: MenuLink
        properties:
          title: Help
          icon: AiOutlineQuestionCircle
  blocks:
    - id: dropdown_menu_arrow_center_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Arrow at Center
        color: primary
        variant: outlined
```

```yaml
- id: dropdown_menu_groups
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_grp_nav
        type: MenuGroup
        properties:
          title: Navigation
          icon: AiOutlineAppstore
        links:
          - id: dm_grp_nav_home
            type: MenuLink
            pageId: home
            properties:
              title: Home
          - id: dm_grp_nav_dash
            type: MenuLink
            pageId: home
            properties:
              title: Dashboard
      - id: dm_grp_div
        type: MenuDivider
      - id: dm_grp_account
        type: MenuGroup
        properties:
          title: Account
          icon: AiOutlineUser
        links:
          - id: dm_grp_acc_profile
            type: MenuLink
            pageId: home
            properties:
              title: Profile
          - id: dm_grp_acc_settings
            type: MenuLink
            pageId: home
            properties:
              title: Settings
  blocks:
    - id: dropdown_menu_groups_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Grouped Menu
        color: primary
        variant: solid
```

```yaml
- id: dropdown_menu_disabled
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_dis_active
        type: MenuLink
        properties:
          title: Available Action
          icon: AiOutlineCheck
      - id: dm_dis_disabled
        type: MenuLink
        properties:
          title: Unavailable (disabled)
          disabled: true
      - id: dm_dis_div
        type: MenuDivider
      - id: dm_dis_danger
        type: MenuLink
        properties:
          title: Danger Action
          danger: true
  blocks:
    - id: dropdown_menu_disabled_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Mixed States
        color: default
        variant: outlined
```

```yaml
- id: dropdown_menu_shortcuts
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_sc_new
        type: MenuLink
        properties:
          title: New File
          icon: AiOutlineFileAdd
          shortcut: mod+shift+N
      - id: dm_sc_save
        type: MenuLink
        properties:
          title: Save
          icon: AiOutlineSave
          shortcut: mod+shift+S
      - id: dm_sc_div
        type: MenuDivider
      - id: dm_sc_close
        type: MenuLink
        properties:
          title: Close
          icon: AiOutlineClose
          shortcut: mod+shift+W
  events:
    onClick:
      - id: dropdown_menu_shortcuts_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Shortcut action: "
              - _event: key
          duration: 2
  blocks:
    - id: dropdown_menu_shortcuts_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: File Menu
        color: primary
        variant: solid
```

```yaml
- id: dropdown_menu_shortcuts
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_sc_new
        type: MenuLink
        properties:
          title: New File
          icon: AiOutlineFileAdd
          shortcut: mod+shift+N
      - id: dm_sc_save
        type: MenuLink
        properties:
          title: Save
          icon: AiOutlineSave
          shortcut: mod+shift+S
      - id: dm_sc_div
        type: MenuDivider
      - id: dm_sc_close
        type: MenuLink
        properties:
          title: Close
          icon: AiOutlineClose
          shortcut: mod+shift+W
  events:
    onClick:
      - id: dropdown_menu_shortcuts_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Shortcut action: "
              - _event: key
          duration: 2
  blocks:
    - id: dropdown_menu_shortcuts_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: File Menu
        color: primary
        variant: solid
```

```yaml
- id: dropdown_menu_event
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_ev_1
        type: MenuLink
        properties:
          title: Option A
      - id: dm_ev_2
        type: MenuLink
        properties:
          title: Option B
  events:
    onOpenChange:
      - id: dropdown_menu_event_msg
        type: DisplayMessage
        params:
          content: Dropdown toggled!
          duration: 2
  blocks:
    - id: dropdown_menu_event_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Click to Toggle
        color: primary
        variant: solid
        icon: AiOutlineBell
```

```yaml
- id: dropdown_menu_onclick
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_oc_edit
        type: MenuLink
        properties:
          title: Edit
          icon: AiOutlineEdit
      - id: dm_oc_copy
        type: MenuLink
        properties:
          title: Copy
          icon: AiOutlineCopy
      - id: dm_oc_delete
        type: MenuLink
        properties:
          title: Delete
          icon: AiOutlineDelete
          danger: true
  events:
    onClick:
      - id: dropdown_menu_onclick_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Clicked: "
              - _event: key
          duration: 2
  blocks:
    - id: dropdown_menu_onclick_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Actions
        color: default
        variant: outlined
```

```yaml
- id: dropdown_menu_onclick
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    links:
      - id: dm_oc_edit
        type: MenuLink
        properties:
          title: Edit
          icon: AiOutlineEdit
      - id: dm_oc_copy
        type: MenuLink
        properties:
          title: Copy
          icon: AiOutlineCopy
      - id: dm_oc_delete
        type: MenuLink
        properties:
          title: Delete
          icon: AiOutlineDelete
          danger: true
  events:
    onClick:
      - id: dropdown_menu_onclick_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Clicked: "
              - _event: key
          duration: 2
  blocks:
    - id: dropdown_menu_onclick_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Actions
        color: default
        variant: outlined
```

```yaml
- id: dropdown_menu_theme
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    theme:
      controlItemBgHover: "#f0f5ff"
      borderRadiusLG: 12
    links:
      - id: dm_th_1
        type: MenuLink
        properties:
          title: Styled Item A
      - id: dm_th_2
        type: MenuLink
        properties:
          title: Styled Item B
      - id: dm_th_3
        type: MenuLink
        properties:
          title: Styled Item C
  blocks:
    - id: dropdown_menu_theme_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Custom Theme
        color: primary
        variant: solid
```

JD

Jane Doe

```yaml
- id: dropdown_menu_user
  type: DropdownMenu
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    placement: bottomRight
    links:
      - id: dm_user_profile
        type: MenuLink
        pageId: home
        properties:
          title: My Profile
          icon: AiOutlineUser
      - id: dm_user_settings
        type: MenuLink
        pageId: home
        properties:
          title: Settings
          icon: AiOutlineSetting
      - id: dm_user_div
        type: MenuDivider
      - id: dm_user_logout
        type: MenuLink
        properties:
          title: Log Out
          icon: AiOutlineLogout
          danger: true
  blocks:
    - id: dropdown_menu_user_trigger
      type: Box
      layout:
        gap: 8
        align: center
      blocks:
        - id: dropdown_menu_user_avatar
          type: Avatar
          layout:
            flex: 0 0 auto
          properties:
            content: JD
            color: "#1677ff"
        - id: dropdown_menu_user_name
          type: Paragraph
          layout:
            flex: 0 0 auto
          properties:
            content: Jane Doe
```

```yaml
- id: dropdown_menu_op
  type: DropdownMenu
  properties:
    trigger: click
    links:
      _menu: default
  blocks:
    - id: dropdown_menu_op_trigger
      type: Button
      properties:
        title: Open Menu
        icon: AiOutlineMenu
```

```yaml
- id: dropdown_menu_op
  type: DropdownMenu
  properties:
    trigger: click
    links:
      _menu: default
  blocks:
    - id: dropdown_menu_op_trigger
      type: Button
      properties:
        title: Open Menu
        icon: AiOutlineMenu
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `links` | array | - | Menu items. Same structure as Menu block: MenuLink, MenuGroup, MenuDivider. |
| `links.$.id` | string | - | Menu item id. |
| `links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`, `MenuGroup`. |
| `links.$.pageId` | string | - | Page to link to. |
| `links.$.url` | string | - | External URL to link to. |
| `links.$.newTab` | boolean | - | Open link in new tab. |
| `links.$.style` | object \| string \| array | - | CSS styles for the menu item. Use a flat object for the item wrapper, or dot-prefixed slot keys (`.element`, `.icon`, `.label`). |
| `links.$.class` | string \| array \| object | - | CSS classes for the menu item. Flat applies to the item wrapper; use dot-prefixed slot keys to target parts. |
| `links.$.properties` | object | - | Properties for the menu item. |
| `links.$.properties.title` | string | - | Menu item title. |
| `links.$.properties.icon` | string \| object | - | Name of a React-Icon or properties of an Icon block to customize icon on menu item. |
| `links.$.properties.danger` | boolean | `false` | Apply danger style to menu item. |
| `links.$.properties.disabled` | boolean | `false` | Disable the menu item. |
| `links.$.properties.tooltip` | string | - | Tooltip text shown when the menu is collapsed. |
| `links.$.properties.extra` | string | - | Free-form right-aligned label on a MenuLink. For real keybindings use `shortcut`; when both are set, `shortcut` sits to the right of `extra`. |
| `links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed. |
| `links.$.properties.shortcut` | string | - | Keyboard shortcut for this menu item. Renders a kbd badge floated to the far right of the item AND wires the key handler. Use "mod" for Cmd/Ctrl. |
| `links.$.links` | array | - | Nested menu items for MenuGroup. |
| `links.$.links.$.id` | string | - | Menu item id. |
| `links.$.links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`. |
| `links.$.links.$.pageId` | string | - | Page to link to. |
| `links.$.links.$.url` | string | - | External URL to link to. |
| `links.$.links.$.newTab` | boolean | - | Open link in new tab. |
| `links.$.links.$.style` | object \| string \| array | - | CSS styles for the menu item. Flat or dot-prefixed slot keys (`.element`, `.icon`, `.label`). |
| `links.$.links.$.class` | string \| array \| object | - | CSS classes for the menu item. |
| `links.$.links.$.properties` | object | - | Properties for the menu item. |
| `links.$.links.$.properties.title` | string | - | Menu item title. |
| `links.$.links.$.properties.icon` | string \| object | - | Icon name or config. |
| `links.$.links.$.properties.danger` | boolean | `false` | Danger style. |
| `links.$.links.$.properties.disabled` | boolean | `false` | Disable the item. |
| `links.$.links.$.properties.tooltip` | string | - | Tooltip text shown when the menu is collapsed. |
| `links.$.links.$.properties.extra` | string | - | Free-form right-aligned label on a MenuLink. For real keybindings use `shortcut`. |
| `links.$.links.$.properties.dashed` | boolean | `false` | Dashed divider line. |
| `links.$.links.$.properties.shortcut` | string | - | Keyboard shortcut. Renders a kbd badge floated to the far right and wires the key handler. Use "mod" for Cmd/Ctrl. |
| `trigger` | string | `"hover"` | How the dropdown opens. Enum: `click`, `hover`, `contextMenu`. |
| `placement` | string | `"bottomLeft"` | Position relative to trigger. Enum: `bottomLeft`, `bottom`, `bottomRight`, `topLeft`, `top`, `topRight`. |
| `arrow` | boolean \| object | `false` | Show arrow pointing to trigger. |
| `arrow.pointAtCenter` | boolean | - |  |
| `disabled` | boolean | `false` | Disable the dropdown. |
| `destroyOnClose` | boolean | `false` | Unmount menu DOM when closed. |
| `selectedKeys` | array | - | Highlighted menu items. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design dropdown tokens](https://ant.design/components/dropdown#design-token). |
| `theme.zIndexPopup` | number | `1050` | Z-index of the dropdown popup. |
| `theme.controlItemBgHover` | string | - | Background color on item hover. |
| `theme.colorPrimary` | string | - | Primary color override. |
| `theme.borderRadiusLG` | number | - | Border radius for the dropdown. |
| `theme.paddingBlock` | number | - | Vertical padding for menu items. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | `{ key: string, keyPath: array, pageId: string, url: string }` | Trigger action when a menu item is clicked. |
| `onSelect` | `{ key: string, selectedKeys: array, pageId: string, url: string }` | Trigger action when a menu item is selected. |
| `onOpenChange` | `{ open: boolean }` | Trigger action when dropdown opens or closes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The trigger wrapper element. |
| `/menu` | The floating menu container. |
| `/item` | Individual menu items. |
| `/itemIcon` | Icon within menu items. |
| `/subMenu` | Submenu/group containers. |
| `/arrow` | Dropdown arrow indicator. |

| Slot | Description |
| --- | --- |
| `content` | Blocks that trigger the dropdown. |
