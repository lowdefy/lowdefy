# Menu

Horizontal or vertical navigation menu with nested items.

```yaml
- id: mode_horizontal
  type: Menu
  properties:
    mode: horizontal
    links:
      - id: mh_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: mh_about
        type: MenuLink
        properties:
          title: About
      - id: mh_services
        type: MenuGroup
        properties:
          title: Services
        links:
          - id: mh_consulting
            type: MenuLink
            properties:
              title: Consulting
          - id: mh_development
            type: MenuLink
            properties:
              title: Development
      - id: mh_contact
        type: MenuLink
        properties:
          title: Contact
- id: mode_vertical
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: mv_dashboard
        type: MenuLink
        properties:
          title: Dashboard
          icon: AiOutlineHome
      - id: mv_users
        type: MenuLink
        properties:
          title: Users
          icon: AiOutlineUser
      - id: mv_settings
        type: MenuGroup
        properties:
          title: Settings
          icon: AiOutlineSetting
        links:
          - id: mv_profile
            type: MenuLink
            properties:
              title: Profile
          - id: mv_security
            type: MenuLink
            properties:
              title: Security
- id: mode_inline
  type: Menu
  style:
    width: 256
  properties:
    mode: inline
    defaultOpenKeys:
      - mi_navigation
    links:
      - id: mi_navigation
        type: MenuGroup
        properties:
          title: Navigation
          icon: AiOutlineAppstore
        links:
          - id: mi_option1
            type: MenuLink
            properties:
              title: Option 1
          - id: mi_option2
            type: MenuLink
            properties:
              title: Option 2
      - id: mi_tools
        type: MenuGroup
        properties:
          title: Tools
          icon: AiOutlineTool
        links:
          - id: mi_option3
            type: MenuLink
            properties:
              title: Option 3
          - id: mi_option4
            type: MenuLink
            properties:
              title: Option 4
```

```yaml
- id: lt_icons_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: lt_mail
        type: MenuLink
        properties:
          title: Mail
          icon: AiOutlineMail
      - id: lt_calendar
        type: MenuLink
        properties:
          title: Calendar
          icon: AiOutlineCalendar
      - id: lt_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: lt_dividers_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: lt_general
        type: MenuLink
        properties:
          title: General
          icon: AiOutlineSetting
      - id: lt_profile
        type: MenuLink
        properties:
          title: Profile
          icon: AiOutlineUser
      - id: lt_solid_divider
        type: MenuDivider
      - id: lt_files
        type: MenuLink
        properties:
          title: Files
          icon: AiOutlineFile
      - id: lt_dashed_divider
        type: MenuDivider
        properties:
          dashed: true
      - id: lt_logout
        type: MenuLink
        properties:
          title: Logout
          icon: AiOutlineLogout
- id: lt_nested_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: inline
    defaultOpenKeys:
      - lt_parent
    links:
      - id: lt_parent
        type: MenuGroup
        properties:
          title: Navigation
          icon: AiOutlineAppstore
        links:
          - id: lt_child_group
            type: MenuGroup
            properties:
              title: Sub Group
            links:
              - id: lt_sub1
                type: MenuLink
                properties:
                  title: Sub Item 1
              - id: lt_sub2
                type: MenuLink
                properties:
                  title: Sub Item 2
          - id: lt_direct
            type: MenuLink
            properties:
              title: Direct Item
- id: lt_danger_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: lt_edit
        type: MenuLink
        properties:
          title: Edit
          icon: AiOutlineEdit
      - id: lt_copy
        type: MenuLink
        properties:
          title: Copy
          icon: AiOutlineCopy
      - id: lt_danger_divider
        type: MenuDivider
      - id: lt_delete
        type: MenuLink
        properties:
          title: Delete
          icon: AiOutlineDelete
          danger: true
```

```yaml
- id: sk_menu
  type: Menu
  properties:
    mode: horizontal
    selectedKeys:
      - sk_active
    links:
      - id: sk_home
        type: MenuLink
        properties:
          title: Home
      - id: sk_active
        type: MenuLink
        properties:
          title: Active Page
      - id: sk_other
        type: MenuLink
        properties:
          title: Other
- id: dok_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: inline
    defaultOpenKeys:
      - dok_group1
      - dok_group2
    links:
      - id: dok_group1
        type: MenuGroup
        properties:
          title: Group 1
          icon: AiOutlineFolder
        links:
          - id: dok_item1
            type: MenuLink
            properties:
              title: Item 1
          - id: dok_item2
            type: MenuLink
            properties:
              title: Item 2
      - id: dok_group2
        type: MenuGroup
        properties:
          title: Group 2
          icon: AiOutlineFolderOpen
        links:
          - id: dok_item3
            type: MenuLink
            properties:
              title: Item 3
- id: sk_multiple_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    selectedKeys:
      - sk_multi_b
    links:
      - id: sk_multi_a
        type: MenuLink
        properties:
          title: Dashboard
          icon: AiOutlineHome
      - id: sk_multi_b
        type: MenuLink
        properties:
          title: Reports
          icon: AiOutlineBarChart
      - id: sk_multi_c
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
```

```yaml
- id: io_collapsed_menu
  type: Menu
  style:
    width: 80
  properties:
    mode: inline
    collapsed: true
    links:
      - id: io_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: io_users
        type: MenuLink
        properties:
          title: Users
          icon: AiOutlineUser
      - id: io_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: io_indent_menu
  type: Menu
  style:
    width: 280
  properties:
    mode: inline
    inlineIndent: 40
    defaultOpenKeys:
      - io_ind_group
    links:
      - id: io_ind_group
        type: MenuGroup
        properties:
          title: Deep Indent
          icon: AiOutlineMenuFold
        links:
          - id: io_ind_a
            type: MenuLink
            properties:
              title: Indented Item A
          - id: io_ind_b
            type: MenuLink
            properties:
              title: Indented Item B
- id: io_expand_icon_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: inline
    expandIcon: AiOutlineRight
    defaultOpenKeys:
      - io_exp_group
    links:
      - id: io_exp_group
        type: MenuGroup
        properties:
          title: Custom Expand Icon
          icon: AiOutlineAppstore
        links:
          - id: io_exp_a
            type: MenuLink
            properties:
              title: Sub Item A
          - id: io_exp_b
            type: MenuLink
            properties:
              title: Sub Item B
```

```yaml
- id: sd_fast_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    subMenuOpenDelay: 0
    subMenuCloseDelay: 0
    links:
      - id: sd_fast_group
        type: MenuGroup
        properties:
          title: Instant Open
          icon: AiOutlineThunderbolt
        links:
          - id: sd_fast_a
            type: MenuLink
            properties:
              title: No Delay Open
          - id: sd_fast_b
            type: MenuLink
            properties:
              title: No Delay Close
- id: sd_slow_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    subMenuOpenDelay: 0.5
    subMenuCloseDelay: 1
    links:
      - id: sd_slow_group
        type: MenuGroup
        properties:
          title: Slow Submenu
          icon: AiOutlineClockCircle
        links:
          - id: sd_slow_a
            type: MenuLink
            properties:
              title: 0.5s Open Delay
          - id: sd_slow_b
            type: MenuLink
            properties:
              title: 1s Close Delay
- id: sd_force_render_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    forceSubMenuRender: true
    links:
      - id: sd_force_group
        type: MenuGroup
        properties:
          title: Pre-rendered Submenu
          icon: AiOutlineSync
        links:
          - id: sd_force_a
            type: MenuLink
            properties:
              title: Already in DOM
          - id: sd_force_b
            type: MenuLink
            properties:
              title: Before Visible
```

```yaml
- id: css_tailwind_menu
  type: Menu
  class: shadow-md rounded-lg
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: css_tw_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: css_tw_reports
        type: MenuLink
        properties:
          title: Reports
          icon: AiOutlineBarChart
      - id: css_tw_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: css_inline_menu
  type: Menu
  style:
    width: 256
    border: 1px solid
    borderRadius: 8
    padding: 4
  properties:
    mode: vertical
    links:
      - id: css_in_dashboard
        type: MenuLink
        properties:
          title: Dashboard
          icon: AiOutlineDashboard
      - id: css_in_analytics
        type: MenuLink
        properties:
          title: Analytics
          icon: AiOutlineLineChart
- id: css_dark_bg
  type: Box
  class: bg-gradient-to-b from-slate-900 to-slate-800 p-4 rounded-lg
  blocks:
    - id: css_dark_menu
      type: Menu
      properties:
        mode: horizontal
        theme: dark
        links:
          - id: css_dk_home
            type: MenuLink
            properties:
              title: Home
              icon: AiOutlineHome
          - id: css_dk_explore
            type: MenuLink
            properties:
              title: Explore
              icon: AiOutlineCompass
          - id: css_dk_profile
            type: MenuLink
            properties:
              title: Profile
              icon: AiOutlineUser
- id: css_link_style_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: css_ls_normal
        type: MenuLink
        properties:
          title: Normal Item
      - id: css_ls_styled
        type: MenuLink
        style:
          fontWeight: bold
          fontStyle: italic
        properties:
          title: Bold Italic Item
      - id: css_ls_colored
        type: MenuLink
        style:
          color: "#1677ff"
        properties:
          title: Blue Text Item
```

```yaml
- id: tt_colors_menu
  type: Menu
  properties:
    mode: horizontal
    theme:
      itemSelectedColor: "#722ed1"
      horizontalItemSelectedColor: "#722ed1"
      itemHoverColor: "#9254de"
      horizontalItemHoverColor: "#9254de"
    selectedKeys:
      - tt_active
    links:
      - id: tt_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: tt_active
        type: MenuLink
        properties:
          title: Active
          icon: AiOutlineStar
      - id: tt_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: tt_sizing_menu
  type: Menu
  style:
    width: 280
  properties:
    mode: vertical
    theme:
      itemHeight: 50
      iconSize: 18
      itemBorderRadius: 12
      itemPaddingInline: 24
      fontSize: 16
    links:
      - id: tt_sz_home
        type: MenuLink
        properties:
          title: Dashboard
          icon: AiOutlineHome
      - id: tt_sz_reports
        type: MenuLink
        properties:
          title: Reports
          icon: AiOutlineBarChart
      - id: tt_sz_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: tt_dark_custom_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    theme:
      itemBg: "#1a1a2e"
      itemColor: "#e0e0e0"
      itemHoverBg: "#16213e"
      itemHoverColor: "#00d4ff"
      itemSelectedBg: "#0f3460"
      itemSelectedColor: "#00d4ff"
    selectedKeys:
      - tt_dc_analytics
    links:
      - id: tt_dc_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: tt_dc_analytics
        type: MenuLink
        properties:
          title: Analytics
          icon: AiOutlineLineChart
      - id: tt_dc_team
        type: MenuLink
        properties:
          title: Team
          icon: AiOutlineTeam
- id: tt_danger_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    theme:
      dangerItemColor: "#cf1322"
      dangerItemHoverColor: "#ff4d4f"
      dangerItemSelectedColor: "#fff"
      dangerItemSelectedBg: "#ff4d4f"
    links:
      - id: tt_dg_files
        type: MenuLink
        properties:
          title: My Files
          icon: AiOutlineFile
      - id: tt_dg_divider
        type: MenuDivider
      - id: tt_dg_delete
        type: MenuLink
        properties:
          title: Delete Account
          icon: AiOutlineDelete
          danger: true
```

Admin Panel

Manage your blog posts here. Use the sidebar to navigate between sections.

**Recent Activity:**
- 3 new posts published this week
- 12 comments pending review
- 2 pages updated

```yaml
- id: admin_layout
  type: Box
  layout:
    direction: row
    gap: 0
  blocks:
    - id: admin_sidebar
      type: Box
      layout:
        flex: 0 0 256px
      blocks:
        - id: admin_logo
          type: Markdown
          class: px-4 py-3 font-bold text-lg border-b border-border
          properties:
            content: Admin Panel
        - id: admin_menu
          type: Menu
          style:
            width: 256
          properties:
            mode: inline
            defaultOpenKeys:
              - adm_content
            selectedKeys:
              - adm_posts
            links:
              - id: adm_overview
                type: MenuLink
                properties:
                  title: Overview
                  icon: AiOutlineDashboard
              - id: adm_content
                type: MenuGroup
                properties:
                  title: Content
                  icon: AiOutlineFileText
                links:
                  - id: adm_posts
                    type: MenuLink
                    properties:
                      title: Posts
                  - id: adm_pages
                    type: MenuLink
                    properties:
                      title: Pages
                  - id: adm_media
                    type: MenuLink
                    properties:
                      title: Media
              - id: adm_users
                type: MenuGroup
                properties:
                  title: Users
                  icon: AiOutlineTeam
                links:
                  - id: adm_all_users
                    type: MenuLink
                    properties:
                      title: All Users
                  - id: adm_roles
                    type: MenuLink
                    properties:
                      title: Roles
              - id: adm_divider
                type: MenuDivider
              - id: adm_danger_zone
                type: MenuLink
                properties:
                  title: Danger Zone
                  icon: AiOutlineWarning
                  danger: true
          events:
            onSelect:
              - id: adm_select_msg
                type: DisplayMessage
                params:
                  content:
                    _string.concat:
                      - "Navigated to: "
                      - _event: key
                  status: info
    - id: admin_main
      type: Card
      layout:
        flex: 1 1 auto
      properties:
        title: Posts
        size: small
      blocks:
        - id: admin_welcome
          type: Markdown
          properties:
            content: >
              Manage your blog posts here. Use the sidebar to navigate between
              sections.


              **Recent Activity:**

              - 3 new posts published this week

              - 12 comments pending review

              - 2 pages updated
```

```yaml
- id: admin_layout
  type: Box
  layout:
    direction: row
    gap: 0
  blocks:
    - id: admin_sidebar
      type: Box
      layout:
        flex: 0 0 256px
      blocks:
        - id: admin_logo
          type: Markdown
          class: px-4 py-3 font-bold text-lg border-b border-border
          properties:
            content: Admin Panel
        - id: admin_menu
          type: Menu
          style:
            width: 256
          properties:
            mode: inline
            defaultOpenKeys:
              - adm_content
            selectedKeys:
              - adm_posts
            links:
              - id: adm_overview
                type: MenuLink
                properties:
                  title: Overview
                  icon: AiOutlineDashboard
              - id: adm_content
                type: MenuGroup
                properties:
                  title: Content
                  icon: AiOutlineFileText
                links:
                  - id: adm_posts
                    type: MenuLink
                    properties:
                      title: Posts
                  - id: adm_pages
                    type: MenuLink
                    properties:
                      title: Pages
                  - id: adm_media
                    type: MenuLink
                    properties:
                      title: Media
              - id: adm_users
                type: MenuGroup
                properties:
                  title: Users
                  icon: AiOutlineTeam
                links:
                  - id: adm_all_users
                    type: MenuLink
                    properties:
                      title: All Users
                  - id: adm_roles
                    type: MenuLink
                    properties:
                      title: Roles
              - id: adm_divider
                type: MenuDivider
              - id: adm_danger_zone
                type: MenuLink
                properties:
                  title: Danger Zone
                  icon: AiOutlineWarning
                  danger: true
          events:
            onSelect:
              - id: adm_select_msg
                type: DisplayMessage
                params:
                  content:
                    _string.concat:
                      - "Navigated to: "
                      - _event: key
                  status: info
    - id: admin_main
      type: Card
      layout:
        flex: 1 1 auto
      properties:
        title: Posts
        size: small
      blocks:
        - id: admin_welcome
          type: Markdown
          properties:
            content: >
              Manage your blog posts here. Use the sidebar to navigate between
              sections.


              **Recent Activity:**

              - 3 new posts published this week

              - 12 comments pending review

              - 2 pages updated
```

## Configuration Guide

Learn how to configure your Lowdefy application with YAML configuration files.

**Topics covered:**
- App configuration
- Page definitions
- Block properties
- Event handling

```yaml
- id: docs_header_box
  type: Box
  class: border-b border-border
  blocks:
    - id: docs_nav_menu
      type: Menu
      properties:
        mode: horizontal
        selectedKeys:
          - docs_guides
        theme:
          horizontalItemSelectedColor: "#1677ff"
          horizontalItemHoverColor: "#4096ff"
          activeBarHeight: 3
        links:
          - id: docs_getting_started
            type: MenuLink
            properties:
              title: Getting Started
              icon: AiOutlineRocket
          - id: docs_guides
            type: MenuLink
            properties:
              title: Guides
              icon: AiOutlineBook
          - id: docs_api_ref
            type: MenuGroup
            properties:
              title: API Reference
            links:
              - id: docs_rest
                type: MenuLink
                properties:
                  title: REST API
              - id: docs_graphql
                type: MenuLink
                properties:
                  title: GraphQL
              - id: docs_api_divider
                type: MenuDivider
              - id: docs_changelog
                type: MenuLink
                properties:
                  title: Changelog
          - id: docs_examples
            type: MenuLink
            properties:
              title: Examples
              icon: AiOutlineCode
      events:
        onClick:
          - id: docs_click_msg
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Opening: "
                  - _event: key
              status: success
- id: docs_content_card
  type: Card
  properties:
    title: Guides
    size: small
  blocks:
    - id: docs_content
      type: Markdown
      properties:
        content: >
          ## Configuration Guide


          Learn how to configure your Lowdefy application with YAML
          configuration files.


          **Topics covered:**

          - App configuration

          - Page definitions

          - Block properties

          - Event handling
```

```yaml
- id: docs_header_box
  type: Box
  class: border-b border-border
  blocks:
    - id: docs_nav_menu
      type: Menu
      properties:
        mode: horizontal
        selectedKeys:
          - docs_guides
        theme:
          horizontalItemSelectedColor: "#1677ff"
          horizontalItemHoverColor: "#4096ff"
          activeBarHeight: 3
        links:
          - id: docs_getting_started
            type: MenuLink
            properties:
              title: Getting Started
              icon: AiOutlineRocket
          - id: docs_guides
            type: MenuLink
            properties:
              title: Guides
              icon: AiOutlineBook
          - id: docs_api_ref
            type: MenuGroup
            properties:
              title: API Reference
            links:
              - id: docs_rest
                type: MenuLink
                properties:
                  title: REST API
              - id: docs_graphql
                type: MenuLink
                properties:
                  title: GraphQL
              - id: docs_api_divider
                type: MenuDivider
              - id: docs_changelog
                type: MenuLink
                properties:
                  title: Changelog
          - id: docs_examples
            type: MenuLink
            properties:
              title: Examples
              icon: AiOutlineCode
      events:
        onClick:
          - id: docs_click_msg
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Opening: "
                  - _event: key
              status: success
- id: docs_content_card
  type: Card
  properties:
    title: Guides
    size: small
  blocks:
    - id: docs_content
      type: Markdown
      properties:
        content: >
          ## Configuration Guide


          Learn how to configure your Lowdefy application with YAML
          configuration files.


          **Topics covered:**

          - App configuration

          - Page definitions

          - Block properties

          - Event handling
```

```yaml
- id: ip_per_item_class_menu
  type: Menu
  style:
    width: 280
  properties:
    mode: vertical
    links:
      - id: ip_dashboard
        type: MenuLink
        class: rounded-lg
        properties:
          title: Dashboard
          icon: AiOutlineDashboard
      - id: ip_reports
        type: MenuLink
        class:
          .element: rounded-lg
          .icon: text-blue-500
          .label: font-semibold
        properties:
          title: Reports
          icon: AiOutlineBarChart
      - id: ip_settings
        type: MenuLink
        style:
          .element:
            borderLeft: 3px solid '#1677ff'
          .label:
            letterSpacing: 0.05em
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: ip_disabled_tooltip_extra_menu
  type: Menu
  style:
    width: 280
  properties:
    mode: vertical
    links:
      - id: ip_search
        type: MenuLink
        properties:
          title: Search
          icon: AiOutlineSearch
          extra: ⌘K
          tooltip: Open command palette
      - id: ip_history
        type: MenuLink
        properties:
          title: History
          icon: AiOutlineHistory
          disabled: true
          tooltip: Coming soon
      - id: ip_divider
        type: MenuDivider
      - id: ip_delete
        type: MenuLink
        properties:
          title: Delete account
          icon: AiOutlineDelete
          danger: true
          extra: irreversible
- id: ip_popup_class_menu
  type: Menu
  style:
    width: 280
  properties:
    mode: vertical
    links:
      - id: ip_group
        type: MenuGroup
        class:
          .popup: shadow-2xl rounded-lg
        properties:
          title: Settings
          icon: AiOutlineSetting
        links:
          - id: ip_general
            type: MenuLink
            properties:
              title: General
          - id: ip_security
            type: MenuLink
            properties:
              title: Security
```

```yaml
- id: ks_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: ks_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
          shortcut: mod+1
      - id: ks_search
        type: MenuLink
        properties:
          title: Search
          icon: AiOutlineSearch
          shortcut: mod+k
      - id: ks_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
          shortcut: mod+,
  events:
    onSelect:
      - id: ks_select_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Selected: "
              - _event: key
          status: info
```

```yaml
- id: ks_menu
  type: Menu
  style:
    width: 256
  properties:
    mode: vertical
    links:
      - id: ks_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
          shortcut: mod+1
      - id: ks_search
        type: MenuLink
        properties:
          title: Search
          icon: AiOutlineSearch
          shortcut: mod+k
      - id: ks_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
          shortcut: mod+,
  events:
    onSelect:
      - id: ks_select_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Selected: "
              - _event: key
          status: info
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `expandIcon` | string \| object | - | Menu expand icon. |
| `menuId` | string | - | App menu id used to get menu links. |
| `mode` | string | `"vertical"` | Type of menu to render. Enum: `vertical`, `horizontal`, `inline`. |
| `selectedKeys` | array | - | Array with the keys of currently selected menu items. |
| `defaultOpenKeys` | array | - | Array with the keys of default opened sub menus. |
| `collapsed` | boolean | `false` | Collapse the inline menu. |
| `inlineIndent` | number | `24` | Indent width for each sub menu level in pixels (inline mode only). |
| `forceSubMenuRender` | boolean | `false` | Render submenu into DOM before it becomes visible. |
| `subMenuCloseDelay` | number | - | Delay time to hide submenu when mouse leaves (in seconds). |
| `subMenuOpenDelay` | number | - | Delay time to show submenu when mouse enters (in seconds). |
| `theme` | string \| object | - | The Menu color theme, light or dark, or antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design menu tokens](https://ant.design/components/menu#design-token). |
| `theme.dropdownWidth` | number | `160` | Width of dropdown submenus. |
| `theme.zIndexPopup` | number | `1050` | Z-index for popup submenus. |
| `theme.itemBorderRadius` | number | `8` | Border radius for menu items. |
| `theme.subMenuItemBorderRadius` | number | `4` | Border radius for submenu items. |
| `theme.itemColor` | string | - | Text color of menu items. |
| `theme.itemHoverColor` | string | - | Text color when hovering menu items. |
| `theme.horizontalItemHoverColor` | string | - | Text color when hovering horizontal menu items. |
| `theme.itemSelectedColor` | string | - | Text color of selected menu items. |
| `theme.horizontalItemSelectedColor` | string | - | Text color of selected horizontal menu items. |
| `theme.itemDisabledColor` | string | - | Text color of disabled menu items. |
| `theme.dangerItemColor` | string | - | Text color of danger menu items. |
| `theme.dangerItemHoverColor` | string | - | Text color when hovering danger items. |
| `theme.dangerItemSelectedColor` | string | - | Text color of selected danger items. |
| `theme.dangerItemSelectedBg` | string | - | Background color of selected danger items. |
| `theme.dangerItemActiveBg` | string | - | Background color of active danger items. |
| `theme.itemBg` | string | - | Background color of menu items. |
| `theme.itemHoverBg` | string | - | Background color when hovering menu items. |
| `theme.subMenuItemBg` | string | - | Background color of submenu items. |
| `theme.itemActiveBg` | string | - | Background color of active menu items. |
| `theme.itemSelectedBg` | string | - | Background color of selected menu items. |
| `theme.horizontalItemSelectedBg` | string | - | Background color of selected horizontal items. |
| `theme.horizontalItemHoverBg` | string | - | Background color of hovered horizontal items. |
| `theme.horizontalItemBorderRadius` | number | `0` | Border radius for horizontal menu items. |
| `theme.activeBarWidth` | number | `0` | Width of active indicator bar. |
| `theme.activeBarHeight` | number | `2` | Height of active indicator bar. |
| `theme.activeBarBorderWidth` | number | `1` | Border width of active indicator bar. |
| `theme.itemHeight` | number | `40` | Height of menu items. |
| `theme.itemMarginInline` | number | `4` | Horizontal margin between items. |
| `theme.itemMarginBlock` | number | `4` | Vertical margin between items. |
| `theme.itemPaddingInline` | number | `16` | Horizontal padding of menu items. |
| `theme.collapsedWidth` | number | `80` | Width of collapsed inline menu. |
| `theme.popupBg` | string | - | Background color of popup submenus. |
| `theme.groupTitleColor` | string | - | Text color of group titles. |
| `theme.groupTitleFontSize` | number | `14` | Font size of group titles. |
| `theme.iconSize` | number | `14` | Icon size in menu items. |
| `theme.iconMarginInlineEnd` | number | `10` | Margin after icon in menu items. |
| `theme.collapsedIconSize` | number | `16` | Icon size in collapsed menu. |
| `theme.darkItemColor` | string | - | Text color in dark theme. |
| `theme.darkItemBg` | string | `"#001529"` | Background color in dark theme. |
| `theme.darkSubMenuItemBg` | string | `"#000c17"` | Submenu background in dark theme. |
| `theme.darkItemSelectedColor` | string | - | Selected item text color in dark theme. |
| `theme.darkItemSelectedBg` | string | - | Selected item background in dark theme. |
| `theme.darkItemHoverBg` | string | - | Hover background in dark theme. |
| `theme.darkItemHoverColor` | string | - | Hover text color in dark theme. |
| `theme.darkGroupTitleColor` | string | - | Group title color in dark theme. |
| `theme.darkItemDisabledColor` | string | - | Disabled item color in dark theme. |
| `theme.darkPopupBg` | string | `"#001529"` | Popup background in dark theme. |
| `theme.darkDangerItemColor` | string | - | Danger item color in dark theme. |
| `theme.darkDangerItemSelectedBg` | string | - | Selected danger item background in dark theme. |
| `theme.darkDangerItemHoverColor` | string | - | Hover danger item color in dark theme. |
| `theme.darkDangerItemSelectedColor` | string | - | Selected danger item text color in dark theme. |
| `theme.darkDangerItemActiveBg` | string | - | Active danger item background in dark theme. |
| `links` | array | - |  |
| `links.$.id` | string | - | Menu item id. |
| `links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`, `MenuGroup`. |
| `links.$.pageId` | string | - | Page to link to. |
| `links.$.style` | object \| string \| array | - | CSS styles for the menu item. Use a flat object for the item wrapper, or use dot-prefixed slot keys (`.element`, `.icon`, `.label`) to target specific parts. |
| `links.$.class` | string \| array \| object | - | CSS classes for the menu item (including Tailwind utilities). Flat string/array applies to the item wrapper. Use an object with dot-prefixed slot keys (`.element`, `.icon`, `.label`, `.popup` — popup only on MenuGroup) to target specific parts. |
| `links.$.properties` | object | - | properties from menu item. |
| `links.$.properties.title` | string | - | Menu item title. |
| `links.$.properties.icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on menu item. |
| `links.$.properties.danger` | boolean | `false` | Apply danger style (MenuLink only). Switches the item onto the `dangerItem*` token set — theme via `properties.theme.dangerItemColor` etc. |
| `links.$.properties.disabled` | boolean | `false` | Disable the menu item (blocks clicks and applies a greyed style). |
| `links.$.properties.tooltip` | string | - | Tooltip text shown on hover when the menu is collapsed. Maps to antd item `title`. |
| `links.$.properties.extra` | string | - | Free-form right-aligned label on a MenuLink (e.g. a status hint like "beta" or "soon"). For real keyboard shortcuts use `shortcut` instead — it renders a kbd badge AND wires the key handler. When both are set, `shortcut` sits to the far right of `extra`. |
| `links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed (MenuDivider only). |
| `links.$.properties.shortcut` | string | - | Keyboard shortcut for this menu item. Renders a kbd badge floated to the far right of the item AND wires the key handler (fires onSelect when pressed). Use "mod" for Cmd/Ctrl. |
| `links.$.links` | array | - |  |
| `links.$.links.$.id` | string | - | Menu item id. |
| `links.$.links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`, `MenuGroup`. |
| `links.$.links.$.style` | object \| string \| array | - | CSS styles for the menu item. Use a flat object for the item wrapper, or dot-prefixed slot keys (`.element`, `.icon`, `.label`). |
| `links.$.links.$.class` | string \| array \| object | - | CSS classes for the menu item. Flat applies to the item wrapper; use dot-prefixed slot keys to target parts. |
| `links.$.links.$.pageId` | string | - | Page to link to. |
| `links.$.links.$.properties` | object | - | properties from menu item. |
| `links.$.links.$.properties.title` | string | - | Menu item title. |
| `links.$.links.$.properties.icon` | string \| object | - | Icon name or Icon block properties. |
| `links.$.links.$.properties.danger` | boolean | `false` | Apply danger style (MenuLink only). |
| `links.$.links.$.properties.disabled` | boolean | `false` | Disable the menu item. |
| `links.$.links.$.properties.tooltip` | string | - | Tooltip text shown when the menu is collapsed. |
| `links.$.links.$.properties.extra` | string | - | Free-form right-aligned label on a MenuLink. For real keybindings use `shortcut`; when both are set, `shortcut` sits to the right of `extra`. |
| `links.$.links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed. |
| `links.$.links.$.properties.shortcut` | string | - | Keyboard shortcut for this menu item. Renders a kbd badge floated to the far right of the item AND wires the key handler (fires onSelect when pressed). Use "mod" for Cmd/Ctrl. |
| `links.$.links.$.links` | array | - |  |
| `links.$.links.$.links.$.id` | string | - | Menu item id. |
| `links.$.links.$.links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`. |
| `links.$.links.$.links.$.style` | object \| string \| array | - | CSS styles for the menu item. Use a flat object or dot-prefixed slot keys. |
| `links.$.links.$.links.$.class` | string \| array \| object | - | CSS classes for the menu item. |
| `links.$.links.$.links.$.pageId` | string | - | Page to link to. |
| `links.$.links.$.links.$.properties` | object | - | properties from menu item. |
| `links.$.links.$.links.$.properties.title` | string | - | Menu item title. |
| `links.$.links.$.links.$.properties.icon` | string \| object | - | Icon name or Icon block properties. |
| `links.$.links.$.links.$.properties.danger` | boolean | `false` | Apply danger style (MenuLink only). |
| `links.$.links.$.links.$.properties.disabled` | boolean | `false` | Disable the menu item. |
| `links.$.links.$.links.$.properties.tooltip` | string | - | Tooltip text shown when the menu is collapsed. |
| `links.$.links.$.links.$.properties.extra` | string | - | Free-form right-aligned label on a MenuLink. For real keybindings use `shortcut`. |
| `links.$.links.$.links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed. |
| `links.$.links.$.links.$.properties.shortcut` | string | - | Keyboard shortcut. Renders a kbd badge floated to the far right and wires the key handler. Use "mod" for Cmd/Ctrl. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onSelect` | `{ key: string }` | Trigger action when menu item is selected. |
| `onClick` | `{ key: string }` | Trigger action when menu item is clicked. |
| `onToggleMenuGroup` | `{ openKeys: array }` | Trigger action when mobile menu group is opened. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Menu element. |
| `/expandIcon` | The expand icon in the Menu. |
| `/icon` | Deprecated alias for `itemIcon`. |
| `/itemIcon` | The icon shown in each menu item. |
| `/item` | The Menu item wrapper (li). |

No slots defined.
