# PageHeaderMenu

Page layout with a top header navigation menu.

Welcome

Follow the quick start guide to set up your first project in minutes.

Browse the full API reference and configuration guides.

```yaml
- id: phm_basic
  type: PageHeaderMenu
  properties:
    menu:
      links:
        - id: phm_basic_home
          type: MenuLink
          properties:
            title: Home
            icon: AiOutlineHome
        - id: phm_basic_products
          type: MenuLink
          properties:
            title: Products
            icon: AiOutlineAppstore
        - id: phm_basic_pricing
          type: MenuLink
          properties:
            title: Pricing
        - id: phm_basic_contact
          type: MenuLink
          properties:
            title: Contact
  blocks:
    - id: phm_basic_title
      type: Title
      properties:
        content: Welcome
        level: 2
    - id: phm_basic_cards
      type: Box
      layout:
        gap: 16
      blocks:
        - id: phm_basic_card_1
          type: Card
          layout:
            flex: 1 1 0
          properties:
            title: Getting Started
          blocks:
            - id: phm_basic_card_1_text
              type: Paragraph
              properties:
                content: Follow the quick start guide to set up your first project in minutes.
        - id: phm_basic_card_2
          type: Card
          layout:
            flex: 1 1 0
          properties:
            title: Documentation
          blocks:
            - id: phm_basic_card_2_text
              type: Paragraph
              properties:
                content: Browse the full API reference and configuration guides.
```

Analytics Overview

```yaml
- id: phm_grouped
  type: PageHeaderMenu
  properties:
    darkModeToggle: true
    breadcrumb:
      separator: /
      list:
        - label: Home
          icon: AiOutlineHome
        - label: Analytics
        - label: Overview
    menu:
      links:
        - id: phm_g_dash
          type: MenuLink
          properties:
            title: Dashboard
            icon: AiOutlineDashboard
        - id: phm_g_analytics
          type: MenuGroup
          properties:
            title: Analytics
            icon: AiOutlineBarChart
          links:
            - id: phm_g_overview
              type: MenuLink
              properties:
                title: Overview
            - id: phm_g_realtime
              type: MenuLink
              properties:
                title: Real-time
            - id: phm_g_funnel
              type: MenuLink
              properties:
                title: Funnels
        - id: phm_g_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  blocks:
    - id: phm_g_title
      type: Title
      properties:
        content: Analytics Overview
        level: 3
    - id: phm_g_cards
      type: Box
      layout:
        gap: 16
      blocks:
        - id: phm_g_card_visits
          type: Card
          layout:
            flex: 1 1 200px
          properties:
            size: small
          blocks:
            - id: phm_g_stat_visits
              type: Statistic
              properties:
                title: Page Views
                value: 12847
        - id: phm_g_card_users
          type: Card
          layout:
            flex: 1 1 200px
          properties:
            size: small
          blocks:
            - id: phm_g_stat_users
              type: Statistic
              properties:
                title: Active Users
                value: 1024
        - id: phm_g_card_rate
          type: Card
          layout:
            flex: 1 1 200px
          properties:
            size: small
          blocks:
            - id: phm_g_stat_rate
              type: Statistic
              properties:
                title: Bounce Rate
                value: 23.4
                suffix: "%"
```

Dashboard

```yaml
- id: phm_profile
  type: PageHeaderMenu
  properties:
    darkModeToggle: true
    notifications:
      count: 3
    profile:
      avatar:
        content: JD
        color: "#1677ff"
      links:
        - id: phm_prof_my_profile
          type: MenuLink
          properties:
            title: My Profile
            icon: AiOutlineUser
        - id: phm_prof_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
        - id: phm_prof_divider
          type: MenuDivider
        - id: phm_prof_logout
          type: MenuLink
          properties:
            title: Logout
            icon: AiOutlineLogout
            danger: true
    menu:
      links:
        - id: phm_prof_home
          type: MenuLink
          properties:
            title: Home
            icon: AiOutlineHome
        - id: phm_prof_projects
          type: MenuLink
          properties:
            title: Projects
            icon: AiOutlineProject
        - id: phm_prof_reports
          type: MenuLink
          properties:
            title: Reports
            icon: AiOutlineBarChart
  blocks:
    - id: phm_prof_title
      type: Title
      properties:
        content: Dashboard
        level: 3
    - id: phm_prof_cards
      type: Box
      layout:
        gap: 16
      blocks:
        - id: phm_prof_card_1
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: phm_prof_stat_1
              type: Statistic
              properties:
                title: Active Projects
                value: 12
        - id: phm_prof_card_2
          type: Card
          layout:
            flex: 1 1 0
          properties:
            size: small
          blocks:
            - id: phm_prof_stat_2
              type: Statistic
              properties:
                title: Pending Tasks
                value: 8
```

Welcome back, Jane

Office hours updated: Building opens at 7:00 AM starting next Monday.

Q1 All-Hands meeting scheduled for March 28 at 2:00 PM.

Submit a Time-Off Request

View Expense Reports

```yaml
- id: phm_full
  type: PageHeaderMenu
  properties:
    darkModeToggle: true
    logo:
      alt: Acme Corp
    notifications:
      dot: true
    profile:
      avatar:
        icon: AiOutlineUser
    breadcrumb:
      list:
        - Intranet
        - Team Directory
    menu:
      links:
        - id: phm_full_home
          type: MenuLink
          properties:
            title: Home
            icon: AiOutlineHome
        - id: phm_full_directory
          type: MenuLink
          properties:
            title: Directory
            icon: AiOutlineTeam
        - id: phm_full_resources
          type: MenuGroup
          properties:
            title: Resources
            icon: AiOutlineBook
          links:
            - id: phm_full_policies
              type: MenuLink
              properties:
                title: Company Policies
            - id: phm_full_benefits
              type: MenuLink
              properties:
                title: Benefits Guide
        - id: phm_full_help
          type: MenuLink
          properties:
            title: IT Support
            icon: AiOutlineQuestionCircle
  slots:
    footer:
      blocks:
        - id: phm_full_footer_text
          type: Paragraph
          style:
            margin: 0
            color: "#888"
            textAlign: center
          properties:
            content: Acme Corp Intranet - Internal Use Only
  blocks:
    - id: phm_full_welcome
      type: Title
      properties:
        content: Welcome back, Jane
        level: 3
    - id: phm_full_cards
      type: Box
      layout:
        gap: 16
      blocks:
        - id: phm_full_card_announce
          type: Card
          layout:
            flex: 1 1 300px
          properties:
            title: Announcements
          blocks:
            - id: phm_full_announce_1
              type: Paragraph
              properties:
                content: "Office hours updated: Building opens at 7:00 AM starting next Monday."
            - id: phm_full_announce_2
              type: Paragraph
              properties:
                content: Q1 All-Hands meeting scheduled for March 28 at 2:00 PM.
        - id: phm_full_card_links
          type: Card
          layout:
            flex: 1 1 300px
          properties:
            title: Quick Links
          blocks:
            - id: phm_full_link_1
              type: Paragraph
              properties:
                content: Submit a Time-Off Request
            - id: phm_full_link_2
              type: Paragraph
              properties:
                content: View Expense Reports
```

Installation

Get started by installing the framework via npm or yarn. Follow the steps below to set up your development environment.

> Prerequisites

1. Initialize a new project directory and run the setup command.

2. Configure your lowdefy.yaml file with pages and connections.

3. Start the development server to preview your application.

```yaml
- id: phm_light
  type: PageHeaderMenu
  properties:
    darkModeToggle: true
    menu:
      links:
        - id: phm_light_guide
          type: MenuLink
          properties:
            title: Guide
            icon: AiOutlineBook
        - id: phm_light_api
          type: MenuLink
          properties:
            title: API Reference
            icon: AiOutlineApi
        - id: phm_light_examples
          type: MenuLink
          properties:
            title: Examples
            icon: AiOutlineCode
        - id: phm_light_community
          type: MenuLink
          properties:
            title: Community
            icon: AiOutlineGlobal
    breadcrumb:
      separator: /
      list:
        - Docs
        - Getting Started
        - Installation
  slots:
    header:
      blocks:
        - id: phm_light_search_btn
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
    - id: phm_light_title
      type: Title
      properties:
        content: Installation
        level: 2
    - id: phm_light_intro
      type: Paragraph
      properties:
        content: Get started by installing the framework via npm or yarn. Follow the
          steps below to set up your development environment.
    - id: phm_light_alert
      type: Alert
      properties:
        message: Prerequisites
        description: Make sure you have Node.js version 18 or higher installed before
          proceeding.
        type: info
        showIcon: true
    - id: phm_light_steps
      type: Card
      properties:
        title: Setup Steps
        size: small
      blocks:
        - id: phm_light_step_1
          type: Paragraph
          properties:
            content: 1. Initialize a new project directory and run the setup command.
        - id: phm_light_step_2
          type: Paragraph
          properties:
            content: 2. Configure your lowdefy.yaml file with pages and connections.
        - id: phm_light_step_3
          type: Paragraph
          properties:
            content: 3. Start the development server to preview your application.
```

Profile from _menu

> The profile dropdown links are populated using _menu operator, pulling from the menus defined in lowdefy.yaml. Click the avatar to see the dropdown.

```yaml
- id: phm_menu_op
  type: PageHeaderMenu
  properties:
    darkModeToggle: true
    notifications:
      count: 2
      link:
        pageId: home
    profile:
      avatar:
        content: JD
        color: "#6366f1"
      links:
        _menu: default
    menu:
      links:
        - id: phm_mo_home
          type: MenuLink
          properties:
            title: Home
            icon: AiOutlineHome
        - id: phm_mo_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  blocks:
    - id: phm_mo_title
      type: Title
      properties:
        content: Profile from _menu
        level: 3
    - id: phm_mo_info
      type: Alert
      properties:
        message: The profile dropdown links are populated using _menu operator, pulling
          from the menus defined in lowdefy.yaml. Click the avatar to see the
          dropdown.
        type: info
        showIcon: true
```

```yaml
- id: phm_menu_op
  type: PageHeaderMenu
  properties:
    darkModeToggle: true
    notifications:
      count: 2
      link:
        pageId: home
    profile:
      avatar:
        content: JD
        color: "#6366f1"
      links:
        _menu: default
    menu:
      links:
        - id: phm_mo_home
          type: MenuLink
          properties:
            title: Home
            icon: AiOutlineHome
        - id: phm_mo_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
  blocks:
    - id: phm_mo_title
      type: Title
      properties:
        content: Profile from _menu
        level: 3
    - id: phm_mo_info
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
| `footer` | object | - | Footer properties. |
| `content` | object | - | Content properties. |
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
| `onClose` | \- | Trigger action when mobile menu is closed. |
| `onMenuItemClick` | \- | Trigger action when menu item is clicked. |
| `onMenuItemSelect` | \- | Trigger action when menu item is selected. |
| `onOpen` | \- | Trigger action when mobile menu is open. |
| `onProfileMenuClick` | `{ key: string, keyPath: array, pageId: string, url: string }` | Trigger action when a profile dropdown menu item is clicked. |
| `onProfileMenuOpen` | `{ open: boolean }` | Trigger action when the profile dropdown opens or closes. |
| `onToggleDrawer` | \- | Trigger action when mobile menu drawer is toggled. |
| `onToggleMenuGroup` | \- | Trigger action when mobile menu group is opened. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PageHeaderMenu element. |
| `/header` | The PageHeaderMenu header. |
| `/headerActions` | The header actions container (notifications, profile, dark mode toggle). |
| `/headerContent` | The PageHeaderMenu header content area. |
| `/logo` | The PageHeaderMenu logo. |
| `/notifications` | The notification bell button. |
| `/notificationsBadge` | The notification badge wrapper. |
| `/notificationsIcon` | The notification bell icon. |
| `/profile` | The profile avatar and dropdown wrapper. |
| `/profileAvatar` | The profile avatar element. |
| `/profileMenu` | The profile dropdown menu popup. |
| `/darkModeToggle` | The PageHeaderMenu dark mode toggle button. |
| `/localeSelector` | The PageHeaderMenu locale selector trigger. |
| `/localeSelectorMenu` | The PageHeaderMenu locale selector dropdown popup. |
| `/mobileMenu` | The PageHeaderMenu mobile menu. |
| `/menu` | The PageHeaderMenu menu. |
| `/content` | The PageHeaderMenu content. |
| `/breadcrumb` | The PageHeaderMenu breadcrumb. |
| `/footer` | The PageHeaderMenu footer. |

| Slot | Description |
| --- | --- |
| `content` | Main page content. |
| `footer` | Page footer. |
| `header` | Additional header content. |
