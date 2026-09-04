# PageSiderMenu

Page layout with a sidebar navigation menu.

Dashboard

```yaml
- id: psm_basic
  type: PageSiderMenu
  properties:
    sider:
      width: 220
      hideToggleButton: true
    menu:
      links:
        - id: psm_basic_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psm_basic_orders
          type: MenuLink
          properties:
            title: Orders
            icon: AiOutlineShoppingCart
        - id: psm_basic_products
          type: MenuLink
          properties:
            title: Products
            icon: AiOutlineAppstore
        - id: psm_basic_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  blocks:
    - id: psm_basic_title
      type: Title
      properties:
        content: Dashboard
        level: 3
    - id: psm_basic_stats
      type: Box
      layout:
        gap: 16
      blocks:
        - id: psm_basic_stat_1
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psm_basic_stat_1_val
              type: Statistic
              properties:
                title: Orders Today
                value: 128
        - id: psm_basic_stat_2
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psm_basic_stat_2_val
              type: Statistic
              properties:
                title: Revenue
                value: 4820
                prefix: $
```

Website Redesign

Breadcrumb items support both simple strings and objects with label, icon, pageId, and url properties. Toggle dark mode to see the layout adapt automatically.

> 3 tasks due this week

```yaml
- id: psm_light
  type: PageSiderMenu
  properties:
    darkModeToggle: true
    sider:
      width: 230
      hideToggleButton: true
    breadcrumb:
      list:
        - label: Home
          icon: AiOutlineHome
        - label: Projects
        - label: Website Redesign
    menu:
      links:
        - id: psm_light_overview
          type: MenuLink
          properties:
            title: Overview
            icon: AiOutlineProject
        - id: psm_light_tasks
          type: MenuLink
          properties:
            title: Tasks
            icon: AiOutlineCheckSquare
        - id: psm_light_files
          type: MenuLink
          properties:
            title: Files
            icon: AiOutlineFile
        - id: psm_light_team
          type: MenuLink
          properties:
            title: Team
            icon: AiOutlineTeam
  blocks:
    - id: psm_light_title
      type: Title
      properties:
        content: Website Redesign
        level: 3
    - id: psm_light_desc
      type: Paragraph
      properties:
        content: Breadcrumb items support both simple strings and objects with label,
          icon, pageId, and url properties. Toggle dark mode to see the layout
          adapt automatically.
    - id: psm_light_alert
      type: Alert
      properties:
        message: 3 tasks due this week
        type: warning
        showIcon: true
```

All Users

Jane Cooper

Tom Wilson

```yaml
- id: psm_groups
  type: PageSiderMenu
  properties:
    sider:
      width: 240
      hideToggleButton: false
    menu:
      links:
        - id: psm_grp_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psm_grp_users_group
          type: MenuGroup
          properties:
            title: User Management
            icon: AiOutlineTeam
          links:
            - id: psm_grp_all_users
              type: MenuLink
              properties:
                title: All Users
            - id: psm_grp_roles
              type: MenuLink
              properties:
                title: Roles & Permissions
        - id: psm_grp_content_group
          type: MenuGroup
          properties:
            title: Content
            icon: AiOutlineEdit
          links:
            - id: psm_grp_articles
              type: MenuLink
              properties:
                title: Articles
            - id: psm_grp_categories
              type: MenuLink
              properties:
                title: Categories
        - id: psm_grp_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  blocks:
    - id: psm_grp_title
      type: Title
      properties:
        content: All Users
        level: 3
    - id: psm_grp_card
      type: Card
      properties:
        title: User List
      blocks:
        - id: psm_grp_user_1
          type: Box
          layout:
            gap: 8
            align: center
          style:
            padding: 8px 0
            borderBottom: 1px solid var(--ant-color-border)
          blocks:
            - id: psm_grp_avatar_1
              type: Avatar
              layout:
                flex: 0 0 auto
              properties:
                size: small
                color: "#1677ff"
                icon: AiOutlineUser
            - id: psm_grp_name_1
              type: Paragraph
              layout:
                flex: 1 1 0
              style:
                margin: 0
              properties:
                content: Jane Cooper
            - id: psm_grp_tag_1
              type: Tag
              layout:
                flex: 0 0 auto
              properties:
                title: Admin
                color: blue
        - id: psm_grp_user_2
          type: Box
          layout:
            gap: 8
            align: center
          style:
            padding: 8px 0
          blocks:
            - id: psm_grp_avatar_2
              type: Avatar
              layout:
                flex: 0 0 auto
              properties:
                size: small
                color: "#52c41a"
                icon: AiOutlineUser
            - id: psm_grp_name_2
              type: Paragraph
              layout:
                flex: 1 1 0
              style:
                margin: 0
              properties:
                content: Tom Wilson
            - id: psm_grp_tag_2
              type: Tag
              layout:
                flex: 0 0 auto
              properties:
                title: Editor
                color: green
```

Admin Dashboard

```yaml
- id: psm_profile
  type: PageSiderMenu
  properties:
    darkModeToggle: true
    sider:
      width: 220
      hideToggleButton: true
    notifications:
      count: 5
    profile:
      avatar:
        content: JC
        color: "#1677ff"
      links:
        - id: psm_prof_my_profile
          type: MenuLink
          properties:
            title: My Profile
            icon: AiOutlineUser
        - id: psm_prof_settings
          type: MenuLink
          properties:
            title: Account Settings
            icon: AiOutlineSetting
        - id: psm_prof_divider
          type: MenuDivider
        - id: psm_prof_logout
          type: MenuLink
          properties:
            title: Sign Out
            icon: AiOutlineLogout
            danger: true
    menu:
      links:
        - id: psm_prof_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psm_prof_users
          type: MenuLink
          properties:
            title: Users
            icon: AiOutlineTeam
        - id: psm_prof_reports
          type: MenuLink
          properties:
            title: Reports
            icon: AiOutlineBarChart
  blocks:
    - id: psm_prof_title
      type: Title
      properties:
        content: Admin Dashboard
        level: 3
    - id: psm_prof_stats
      type: Box
      layout:
        gap: 16
      blocks:
        - id: psm_prof_stat_1
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psm_prof_stat_1_val
              type: Statistic
              properties:
                title: Active Users
                value: 1284
        - id: psm_prof_stat_2
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psm_prof_stat_2_val
              type: Statistic
              properties:
                title: Pending Requests
                value: 23
```

Dashboard Overview

Sprint Progress

```yaml
- id: psm_full
  type: PageSiderMenu
  properties:
    darkModeToggle: true
    sider:
      width: 240
      hideToggleButton: true
    notifications:
      dot: true
    profile:
      avatar:
        icon: AiOutlineUser
        color: "#1677ff"
    breadcrumb:
      separator: /
      list:
        - Admin
        - Dashboard
    menu:
      links:
        - id: psm_full_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psm_full_analytics
          type: MenuLink
          properties:
            title: Analytics
            icon: AiOutlineBarChart
        - id: psm_full_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  slots:
    sider:
      blocks:
        - id: psm_full_sider_box
          type: Box
          style:
            padding: 12px
          blocks:
            - id: psm_full_progress_label
              type: Paragraph
              style:
                margin: 0 0 8px 0
                fontSize: 12
                color: "#999"
              properties:
                content: Sprint Progress
            - id: psm_full_progress
              type: Progress
              properties:
                percent: 68
    footer:
      blocks:
        - id: psm_full_footer_text
          type: Paragraph
          style:
            textAlign: center
            margin: 0
            color: "#999"
            fontSize: 12
          properties:
            content: Admin Panel v2.4.1
  blocks:
    - id: psm_full_title
      type: Title
      properties:
        content: Dashboard Overview
        level: 3
    - id: psm_full_stats_row
      type: Box
      layout:
        gap: 16
      blocks:
        - id: psm_full_stat_users
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psm_full_stat_users_val
              type: Statistic
              properties:
                title: Total Users
                value: 2847
                prefixIcon: AiOutlineUser
        - id: psm_full_stat_revenue
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psm_full_stat_revenue_val
              type: Statistic
              properties:
                title: Revenue
                value: 58420
                prefix: $
        - id: psm_full_stat_orders
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psm_full_stat_orders_val
              type: Statistic
              properties:
                title: Orders
                value: 384
```

Profile from _menu

> The profile dropdown links are populated using _menu operator, pulling from the menus defined in lowdefy.yaml. Click the avatar to see the dropdown.

```yaml
- id: psm_menu_op
  type: PageSiderMenu
  properties:
    darkModeToggle: true
    sider:
      width: 220
      hideToggleButton: true
    notifications:
      count: 4
      link:
        pageId: home
    profile:
      avatar:
        content: JC
        color: "#6366f1"
      links:
        _menu: default
    menu:
      links:
        - id: psm_mo_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psm_mo_users
          type: MenuLink
          properties:
            title: Users
            icon: AiOutlineTeam
  blocks:
    - id: psm_mo_title
      type: Title
      properties:
        content: Profile from _menu
        level: 3
    - id: psm_mo_info
      type: Alert
      properties:
        message: The profile dropdown links are populated using _menu operator, pulling
          from the menus defined in lowdefy.yaml. Click the avatar to see the
          dropdown.
        type: info
        showIcon: true
```

```yaml
- id: psm_menu_op
  type: PageSiderMenu
  properties:
    darkModeToggle: true
    sider:
      width: 220
      hideToggleButton: true
    notifications:
      count: 4
      link:
        pageId: home
    profile:
      avatar:
        content: JC
        color: "#6366f1"
      links:
        _menu: default
    menu:
      links:
        - id: psm_mo_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psm_mo_users
          type: MenuLink
          properties:
            title: Users
            icon: AiOutlineTeam
  blocks:
    - id: psm_mo_title
      type: Title
      properties:
        content: Profile from _menu
        level: 3
    - id: psm_mo_info
      type: Alert
      properties:
        message: The profile dropdown links are populated using _menu operator, pulling
          from the menus defined in lowdefy.yaml. Click the avatar to see the
          dropdown.
        type: info
        showIcon: true
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `logo` | object | - | Header logo settings. By default, images are served from the app public folder and auto-swap between light and dark variants based on dark mode. See [Hosting Files](/hosting-files) for details. |
| `logo.src` | string | - | Logo image URL for desktop. Defaults to logo-light-theme.png or logo-dark-theme.png from the public folder (~250x72px), auto-selected based on dark mode. |
| `logo.srcMobile` | string | - | Logo image URL for mobile. Defaults to logo-square-light-theme.png or logo-square-dark-theme.png from the public folder (~125x125px), auto-selected based on dark mode. |
| `logo.breakpoint` | number | - | Viewport width breakpoint (in px) for switching between mobile and desktop logo. Default is 577. |
| `logo.alt` | string | `"Lowdefy"` | Logo image alt text. |
| `header` | object | - | Header properties. |
| `iconsColor` | string | - | Color for the notification, profile, and dark mode toggle icons. Use when the header has a dark background color. |
| `sider` | object | - | Sider properties. |
| `sider.breakpoint` | string | `"sm"` | Breakpoint of the responsive layout. Enum: `xs`, `sm`, `md`, `lg`, `xl`. |
| `sider.collapsedWidth` | integer | - | Width of the collapsed sidebar, by setting to 0 a special trigger will appear. |
| `sider.initialCollapsed` | boolean | `false` | Set the initial collapsed state. Used as the fallback when no persisted preference exists in localStorage. |
| `sider.reverseArrow` | boolean | `false` | Direction of arrow, for a sider that expands from the right. |
| `sider.width` | string \| number | - | Width of the sidebar. |
| `sider.hideToggleButton` | boolean | `false` | Hide toggle button in sider. |
| `siderStorageKey` | string | `"sider"` | localStorage key suffix for sider state persistence. Produces key 'lf-{siderStorageKey}-open'. |
| `toggleSiderButton` | object | - | Toggle sider button properties. |
| `footer` | object | - | Footer properties. |
| `content` | object | - | Content properties. |
| `layout` | object | - | Layout properties for the Layout wrapping the sider and content. hasSider is always true. |
| `breadcrumb` | object | - | Breadcrumb properties. |
| `breadcrumb.separator` | string | `"/"` | Use a custom separator string. |
| `breadcrumb.list` | array | - | List of breadcrumb links. |
| `breadcrumb.list.$.label` | string | - | Label of the breadcrumb link. |
| `breadcrumb.list.$.pageId` | string | - | Page id to link to when clicked. |
| `breadcrumb.list.$.url` | string | - | External url link. |
| `breadcrumb.list.$.style` | object | - | Css style to apply to link. |
| `breadcrumb.list.$.icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to use an icon in breadcrumb link. |
| `menu` | object | - | Menu properties. |
| `menu.links` | array | - |  |
| `menu.links.$.id` | string | - | Menu item id. |
| `menu.links.$.pageId` | string | - | Page to link to. |
| `menu.links.$.properties` | object | - | properties from menu item. |
| `menu.links.$.properties.title` | string | - | Menu item title. |
| `menu.links.$.properties.icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on menu item. |
| `menuLg` | object | - | Menu large screen properties. Overwrites menu properties on desktop screen sizes. |
| `menuMd` | object | - | Mobile menu properties. Overwrites menu properties on mobile screen sizes. |
| `notifications` | object | - | Notification bell icon with badge in the header. Renders when configured. Use the link property to navigate when clicked. |
| `notifications.link` | object | - | Link to navigate to when the notification bell is clicked. |
| `notifications.link.pageId` | string | - | Page to link to. |
| `notifications.link.url` | string | - | External URL to link to. |
| `notifications.link.newTab` | boolean | - | Open link in new tab. |
| `notifications.count` | number | - | Number to display on the badge. Set to 0 to hide the badge (unless showZero is true). |
| `notifications.dot` | boolean | `false` | Show a dot instead of a count number. |
| `notifications.showZero` | boolean | `false` | Show badge when count is zero. |
| `notifications.overflowCount` | number | `99` | Max count to show. Values above this display as "N+". |
| `notifications.color` | string | - | Badge color. |
| `notifications.icon` | string \| object | - | Icon for the notification button. Defaults to AiOutlineBell. |
| `notifications.size` | string | `"small"` | Size of the notification button. Enum: `small`, `default`, `large`. |
| `profile` | object | - | Profile avatar with optional dropdown menu in the header. Renders when configured. Use with the _user operator to populate from the authenticated user. |
| `profile.avatar` | object | - | Avatar display properties. |
| `profile.avatar.src` | string | - | Image URL for the avatar. Typically bound to _user: image. |
| `profile.avatar.content` | string | - | Text content inside the avatar (e.g. user initials). Shown when no src is provided. |
| `profile.avatar.icon` | string \| object | - | Icon to display in avatar when no src or content is set. Defaults to AiOutlineUser. |
| `profile.avatar.color` | string | - | Background color of the avatar when not using src. |
| `profile.avatar.size` | string \| number | `"small"` | Size of the avatar. Enum: `default`, `small`, `large`. |
| `profile.avatar.shape` | string | `"circle"` | Shape of the avatar. Enum: `circle`, `square`. |
| `profile.links` | array | - | Dropdown menu items. Uses the same MenuLink/MenuGroup/MenuDivider schema as Menu. Compatible with _menu operator output for access-filtered menus. |
| `profile.links.$.id` | string | - | Menu item id. |
| `profile.links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`, `MenuGroup`. |
| `profile.links.$.pageId` | string | - | Page to link to. |
| `profile.links.$.url` | string | - | External URL to link to. |
| `profile.links.$.newTab` | boolean | - | Open link in new tab. |
| `profile.links.$.style` | object | - | CSS style applied to the link. |
| `profile.links.$.properties` | object | - | Properties for the menu item. |
| `profile.links.$.properties.title` | string | - | Menu item title. |
| `profile.links.$.properties.icon` | string \| object | - | Icon for the menu item. |
| `profile.links.$.properties.danger` | boolean | `false` | Apply danger style to menu item. |
| `profile.links.$.properties.disabled` | boolean | `false` | Disable the menu item. |
| `profile.links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed. |
| `profile.links.$.properties.shortcut` | string | - | Keyboard shortcut. Renders a kbd badge floated to the far right and wires the key handler. Use "mod" for Cmd/Ctrl. |
| `profile.links.$.links` | array | - | Nested menu items for MenuGroup. |
| `profile.trigger` | string | `"hover"` | How the profile dropdown opens. Enum: `click`, `hover`. |
| `profile.placement` | string | `"bottomRight"` | Dropdown placement relative to the avatar. Enum: `bottomLeft`, `bottom`, `bottomRight`, `topLeft`, `top`, `topRight`. |
| `profile.arrow` | boolean \| object | `false` | Show arrow on the dropdown. |
| `profile.arrow.pointAtCenter` | boolean | - |  |
| `darkModeToggle` | boolean | `false` | Show a dark mode toggle button in the header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage. |
| `localeSelector` | boolean | `false` | Show a locale picker dropdown in the header. Lists locales declared in `config.i18n.locales` and dispatches `SetLocale` on selection. Renders nothing when `config.i18n` is not configured. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBreadcrumbClick` | \- | Trigger action when a breadcrumb item is clicked. |
| `onChangeToggleSiderAffix` | \- | Trigger action when sider collapse button affix triggers a onChange event. |
| `onClose` | \- | Trigger action when menu is closed. |
| `onMenuItemSelect` | \- | Trigger action when menu item is selected. |
| `onMenuItemClick` | \- | Trigger action when menu item is clicked. |
| `onOpen` | \- | Trigger action when menu is open. |
| `onProfileMenuClick` | `{ key: string, keyPath: array, pageId: string, url: string }` | Trigger action when a profile dropdown menu item is clicked. |
| `onProfileMenuOpen` | `{ open: boolean }` | Trigger action when the profile dropdown opens or closes. |
| `onToggleDrawer` | \- | Trigger action when mobile menu drawer is toggled. |
| `onToggleMenuGroup` | \- | Trigger action when mobile menu group is opened. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PageSiderMenu element. |
| `/header` | The PageSiderMenu header. |
| `/headerActions` | The header actions container (notifications, profile, dark mode toggle). |
| `/headerContent` | The PageSiderMenu header content area. |
| `/logo` | The PageSiderMenu logo. |
| `/notifications` | The notification bell button. |
| `/notificationsBadge` | The notification badge wrapper. |
| `/notificationsIcon` | The notification bell icon. |
| `/profile` | The profile avatar and dropdown wrapper. |
| `/profileAvatar` | The profile avatar element. |
| `/profileMenu` | The profile dropdown menu popup. |
| `/darkModeToggle` | The PageSiderMenu dark mode toggle button. |
| `/localeSelector` | The PageSiderMenu locale selector trigger. |
| `/localeSelectorMenu` | The PageSiderMenu locale selector dropdown popup. |
| `/mobileMenu` | The PageSiderMenu mobile menu. |
| `/layout` | The PageSiderMenu inner layout. |
| `/sider` | The PageSiderMenu sider. |
| `/menu` | The PageSiderMenu menu. |
| `/content` | The PageSiderMenu content. |
| `/breadcrumb` | The PageSiderMenu breadcrumb. |
| `/footer` | The PageSiderMenu footer. |

| Slot | Description |
| --- | --- |
| `content` | Main page content. |
| `footer` | Page footer. |
| `header` | Additional header content. |
| `sider` | Sider content below the menu. |
