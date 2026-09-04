# PageSidebarLayout

Full-page layout with a full-height sidebar and no top-level header. The sider spans the entire viewport height with the logo affixed at the bottom. A mobile drawer menu appears on small screens. Sider collapse state is persisted in localStorage.

PageSidebarLayout provides a full-page layout with a full-height sidebar. The sider spans the entire viewport height with the logo at the bottom. On mobile screens, a hamburger menu with a full-width drawer replaces the sider.

```yaml
- id: psl_basic
  type: PageSidebarLayout
  properties:
    siderStorageKey: psl_basic
    sider:
      initialCollapsed: false
      width: 220
    menu:
      links:
        - id: psl_basic_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psl_basic_users
          type: MenuLink
          properties:
            title: Users
            icon: AiOutlineUser
        - id: psl_basic_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  blocks:
    - id: psl_basic_content
      type: Paragraph
      properties:
        content: PageSidebarLayout provides a full-page layout with a full-height
          sidebar. The sider spans the entire viewport height with the logo at
          the bottom. On mobile screens, a hamburger menu with a full-width
          drawer replaces the sider.
```

Sider starts collapsed. Click the toggle button to expand. The collapsed state is persisted in localStorage.

```yaml
- id: psl_collapsed
  type: PageSidebarLayout
  properties:
    siderStorageKey: psl_collapsed
    sider:
      initialCollapsed: true
    menu:
      links:
        - id: psl_collapsed_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psl_collapsed_users
          type: MenuLink
          properties:
            title: Users
            icon: AiOutlineUser
  blocks:
    - id: psl_collapsed_content
      type: Paragraph
      properties:
        content: Sider starts collapsed. Click the toggle button to expand. The
          collapsed state is persisted in localStorage.
```

Optional desktop header with custom content. The header sits inside the content area, not above the sider.

```yaml
- id: psl_header
  type: PageSidebarLayout
  properties:
    siderStorageKey: psl_header
    sider:
      width: 220
    header:
      contentStyle:
        justifyContent: flex-end
    menu:
      links:
        - id: psl_header_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psl_header_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  slots:
    header:
      blocks:
        - id: psl_header_search_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Search
            icon: AiOutlineSearch
            color: default
            variant: outlined
            size: small
  blocks:
    - id: psl_header_content
      type: Paragraph
      properties:
        content: Optional desktop header with custom content. The header sits inside the
          content area, not above the sider.
```

Custom logo with style overrides. The full logo (src) shows when the sider is expanded, and the square logo (srcMobile) shows when collapsed.

```yaml
- id: psl_logo
  type: PageSidebarLayout
  properties:
    siderStorageKey: psl_logo
    logo:
      src: /logo_example.png
      srcMobile: /logo_example.png
      alt: Custom Logo
      style:
        width: 80
    menu:
      links:
        - id: psl_logo_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
  blocks:
    - id: psl_logo_content
      type: Paragraph
      properties:
        content: Custom logo with style overrides. The full logo (src) shows when the
          sider is expanded, and the square logo (srcMobile) shows when
          collapsed.
```

Dashboard Overview

```yaml
- id: psl_admin
  type: PageSidebarLayout
  properties:
    siderStorageKey: psl_admin
    darkModeToggle: true
    notifications:
      count: 3
    profile:
      avatar:
        content: AU
        color: "#1677ff"
      links:
        - id: psl_admin_prof_profile
          type: MenuLink
          properties:
            title: My Profile
            icon: AiOutlineUser
        - id: psl_admin_prof_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
        - id: psl_admin_prof_divider
          type: MenuDivider
        - id: psl_admin_prof_logout
          type: MenuLink
          properties:
            title: Sign Out
            icon: AiOutlineLogout
            danger: true
    sider:
      width: 240
    breadcrumb:
      list:
        - Admin
        - Dashboard
    menu:
      defaultOpenKeys:
        - psl_admin_users_group
      links:
        - id: psl_admin_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: psl_admin_users_group
          type: MenuGroup
          properties:
            title: User Management
            icon: AiOutlineTeam
          links:
            - id: psl_admin_all_users
              type: MenuLink
              properties:
                title: All Users
            - id: psl_admin_user_roles
              type: MenuLink
              properties:
                title: Roles & Permissions
        - id: psl_admin_analytics
          type: MenuLink
          properties:
            title: Analytics
            icon: AiOutlineBarChart
        - id: psl_admin_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  slots:
    siderOpen:
      blocks:
        - id: psl_admin_sider_open
          type: Box
          style:
            padding: 8px 12px
          blocks:
            - id: psl_admin_env_tag
              type: Tag
              properties:
                title: Production
                color: green
                icon: AiOutlineCloudServer
    siderClosed:
      blocks:
        - id: psl_admin_sider_closed
          type: Box
          style:
            padding: 8px
            textAlign: center
          blocks:
            - id: psl_admin_env_tag_sm
              type: Tag
              properties:
                title: Prod
                color: green
    footer:
      blocks:
        - id: psl_admin_footer_text
          type: Paragraph
          style:
            textAlign: center
            margin: 0
            color: "#999"
            fontSize: 12
          properties:
            content: Admin Panel v2.4.1
  blocks:
    - id: psl_admin_title
      type: Title
      properties:
        content: Dashboard Overview
        level: 3
    - id: psl_admin_stats_row
      type: Box
      layout:
        gap: 16
      blocks:
        - id: psl_admin_stat_users
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psl_admin_stat_users_val
              type: Statistic
              properties:
                title: Total Users
                value: 2847
                prefixIcon: AiOutlineUser
        - id: psl_admin_stat_revenue
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psl_admin_stat_revenue_val
              type: Statistic
              properties:
                title: Revenue
                value: 58420
                prefix: $
        - id: psl_admin_stat_orders
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: psl_admin_stat_orders_val
              type: Statistic
              properties:
                title: Orders
                value: 384
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | - | Page title. Accepted for compatibility. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). |
| `logo` | object | - | Header logo settings. By default, images are served from the app public folder and auto-swap between light and dark variants based on dark mode. See [Hosting Files](/hosting-files) for details. |
| `logo.src` | string | - | Logo image URL for desktop. Defaults to logo-light-theme.png or logo-dark-theme.png from the public folder (~250x72px), auto-selected based on dark mode. |
| `logo.srcMobile` | string | - | Logo image URL for mobile. Defaults to logo-square-light-theme.png or logo-square-dark-theme.png from the public folder (~125x125px), auto-selected based on dark mode. |
| `logo.alt` | string | `"Lowdefy"` | Logo alternative text. |
| `logo.style` | object | - | Css style object to apply to logo. |
| `sider` | object | - | Sider properties. |
| `sider.collapsedWidth` | integer | - | Width of the collapsed sidebar, by setting to 0 a special trigger will appear. |
| `sider.collapsible` | boolean | `true` | Whether can be collapsed. |
| `sider.initialCollapsed` | boolean | `false` | Set the initial collapsed state. |
| `sider.width` | string \| number | - | Width of the sidebar. |
| `sider.hideToggleButton` | boolean | `false` | Hide toggle button in sider. |
| `siderStorageKey` | string | `"sider"` | localStorage key suffix for sider state persistence. Produces key 'lf-{siderStorageKey}-open'. |
| `header` | object | - | Header properties. |
| `header.contentStyle` | object | - | Header content css style object. |
| `toggleSiderButton` | object | - | Toggle sider button properties. |
| `footer` | object | - | Footer properties. |
| `footer.style` | object | - | Footer css style object. |
| `content` | object | - | Content properties. |
| `content.style` | object | - | Content css style object. |
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
| `notifications` | object | - | Notification bell icon with badge. Shown in the sider on desktop and the mobile header on small screens. Renders when configured. Use the link property to navigate when clicked. |
| `notifications.title` | string | `"Notifications"` | Label shown next to the bell icon when the sider is expanded. Hidden on mobile header and collapsed sider. |
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
| `profile` | object | - | Profile avatar with optional dropdown menu. Shown in the sider on desktop and the mobile header on small screens. Renders when configured. Use with the _user operator to populate from the authenticated user. |
| `profile.title` | string | `"Profile"` | Label shown next to the avatar when the sider is expanded. Hidden on mobile header and collapsed sider. |
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
| `darkModeToggle` | boolean | `false` | Show a dark mode toggle button in the sider and mobile header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage. |
| `localeSelector` | boolean | `false` | Show a locale picker dropdown in the sider and mobile header. Lists locales declared in `config.i18n.locales` and dispatches `SetLocale` on selection. Renders nothing when `config.i18n` is not configured. |
| `iconsColor` | string | - | Color for notification and dark mode toggle icons. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onToggleSider` | \- | Trigger action when sider toggle button is clicked. |
| `onMenuItemClick` | \- | Trigger action when menu item is clicked. |
| `onMenuItemSelect` | \- | Trigger action when menu item is selected. |
| `onToggleMenuGroup` | \- | Trigger action when menu group is opened. |
| `onBreadcrumbClick` | \- | Trigger action when a breadcrumb item is clicked. |
| `onMobileMenuOpen` | \- | Trigger action when mobile menu is opened. |
| `onMobileMenuClose` | \- | Trigger action when mobile menu is closed. |
| `onToggleDrawer` | \- | Trigger action when mobile menu drawer is toggled. |
| `onProfileMenuClick` | `{ key: string, keyPath: array, pageId: string, url: string }` | Trigger action when a profile dropdown menu item is clicked. |
| `onProfileMenuOpen` | `{ open: boolean }` | Trigger action when the profile dropdown opens or closes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PageSidebarLayout element. |
| `/sider` | The PageSidebarLayout sider. |
| `/menu` | The PageSidebarLayout menu. |
| `/mobileHeader` | The PageSidebarLayout mobile header. |
| `/mobileMenu` | The PageSidebarLayout mobile menu. |
| `/header` | The PageSidebarLayout header. |
| `/headerActions` | The header actions container (notifications, profile, dark mode toggle). |
| `/headerContent` | The PageSidebarLayout header content area (the header slot row). |
| `/logo` | The PageSidebarLayout logo. |
| `/notifications` | The notification bell button. |
| `/notificationsBadge` | The notification badge wrapper. |
| `/notificationsIcon` | The notification bell icon. |
| `/profile` | The profile avatar and dropdown wrapper. |
| `/profileAvatar` | The profile avatar element. |
| `/profileMenu` | The profile dropdown menu popup. |
| `/darkModeToggle` | The dark mode toggle button. |
| `/localeSelector` | The locale selector trigger. |
| `/localeSelectorMenu` | The locale selector dropdown popup. |
| `/content` | The PageSidebarLayout content. |
| `/breadcrumb` | The PageSidebarLayout breadcrumb. |
| `/footer` | The PageSidebarLayout footer. |
| `/toggleButton` | The PageSidebarLayout sider toggle button. |

| Slot | Description |
| --- | --- |
| `content` | Main page content. |
| `footer` | Page footer. |
| `header` | Additional header content. |
| `mobileDrawerContent` | Content in the mobile menu drawer. |
| `mobileDrawerFooter` | Footer in the mobile menu drawer. |
| `mobileExtra` | Extra content in the mobile header bar. |
| `siderClosed` | Content shown in the sider when collapsed. |
| `siderOpen` | Content shown in the sider when expanded. |
