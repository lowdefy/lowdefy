---
name: lowdefy-page-layouts
description: Use when choosing the page frame — `PageSidebarLayout`, `PageHeaderMenu`, `PageSiderMenu`, menus, headers, breadcrumbs, and sharing one layout across pages.
---

# Page layouts

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### PageSidebarLayout

`/lowdefy-docs/content/container-blocks/pagesidebarlayout`

Full-page layout with a full-height sidebar and no top-level header. The sider spans the entire viewport height with the logo affixed at the bottom. A mobile drawer menu appears on small screens. Sider collapse state is persisted in localStorage.

#### PageHeaderMenu

`/lowdefy-docs/content/container-blocks/pageheadermenu`

Page layout with a top header navigation menu.

#### PageSiderMenu

`/lowdefy-docs/content/container-blocks/pagesidermenu`

Page layout with a sidebar navigation menu.

#### Menus

`/lowdefy-docs/content/concepts/menus`

Menu objects describe links to pages, within the app or external. Menu lists are filtered to only show pages that the user is authorized to see as a result of public, private or role based access controlled (RBAC) configuration. Blocks such as [PageSiderMenu](/PageSiderMenu) render menu links. If no menu defined, a default menu is created, containing links to all pages defined in the app.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### PageSidebarLayout

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `title` | string |  |  | Page title. Accepted for compatibility. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |
| `logo` | object |  |  | Header logo settings. By default, images are served from the app public folder and auto-swap between light and dark variants based on dark mode. See Hosting Files for details. |
| `sider` | object |  |  | Sider properties. |
| `siderStorageKey` | string |  | `"sider"` | localStorage key suffix for sider state persistence. Produces key 'lf-{siderStorageKey}-open'. |
| `header` | object |  |  | Header properties. |
| `toggleSiderButton` | object |  |  | Toggle sider button properties. |
| `footer` | object |  |  | Footer properties. |
| `content` | object |  |  | Content properties. |
| `breadcrumb` | object |  |  | Breadcrumb properties. |
| `menu` | object |  |  | Menu properties. |
| `menuLg` | object |  |  | Menu large screen properties. Overwrites menu properties on desktop screen sizes. |
| `menuMd` | object |  |  | Mobile menu properties. Overwrites menu properties on mobile screen sizes. |
| `notifications` | object |  |  | Notification bell icon with badge. Shown in the sider on desktop and the mobile header on small screens. Renders when configured. Use the link property to navigate when clicked. |
| `profile` | object |  |  | Profile avatar with optional dropdown menu. Shown in the sider on desktop and the mobile header on small screens. Renders when configured. Use with the _user operator to populate from the authenticated user. |
| `darkModeToggle` | boolean |  | `false` | Show a dark mode toggle button in the sider and mobile header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage. |
| `localeSelector` | boolean |  | `false` | Show a locale picker dropdown in the sider and mobile header. Lists locales declared in `config.i18n.locales` and dispatches `SetLocale` on selection. Renders nothing when `config.i18n` is not configured. |
| `iconsColor` | string |  |  | Color for notification and dark mode toggle icons. |

##### Events

- `onToggleSider`: Trigger action when sider toggle button is clicked.
- `onMenuItemClick`: Trigger action when menu item is clicked.
- `onMenuItemSelect`: Trigger action when menu item is selected.
- `onToggleMenuGroup`: Trigger action when menu group is opened.
- `onBreadcrumbClick`: Trigger action when a breadcrumb item is clicked.
- `onMobileMenuOpen`: Trigger action when mobile menu is opened.
- `onMobileMenuClose`: Trigger action when mobile menu is closed.
- `onToggleDrawer`: Trigger action when mobile menu drawer is toggled.
- `onProfileMenuClick`: Trigger action when a profile dropdown menu item is clicked. Event payload: `key`, `keyPath`, `pageId`, `url`.
- `onProfileMenuOpen`: Trigger action when the profile dropdown opens or closes. Event payload: `open`.

##### Example

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
        content: PageSidebarLayout provides a full-page layout with a full-height sidebar. The sider spans the entire viewport height with the logo at the bottom. On mobile screens, a hamburger menu with a full-width drawer replaces the sider.
```

#### PageHeaderMenu

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `logo` | object |  |  | Header logo settings. By default, images are served from the app public folder and auto-swap between light and dark variants based on dark mode. See Hosting Files for details. |
| `header` | object |  |  | Header properties. |
| `footer` | object |  |  | Footer properties. |
| `content` | object |  |  | Content properties. |
| `breadcrumb` | object |  |  | Breadcrumb properties. |
| `menu` | object |  |  | Menu properties. |
| `menuLg` | object |  |  | Menu large screen properties. Overwrites menu properties on desktop screen sizes. |
| `menuMd` | object |  |  | Mobile menu properties. Overwrites menu properties on mobile screen sizes. |
| `notifications` | object |  |  | Notification bell icon with badge in the header. Renders when configured. Use the link property to navigate when clicked. |
| `profile` | object |  |  | Profile avatar with optional dropdown menu in the header. Renders when configured. Use with the _user operator to populate from the authenticated user. |
| `darkModeToggle` | boolean |  | `false` | Show a dark mode toggle button in the header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage. |
| `localeSelector` | boolean |  | `false` | Show a locale picker dropdown in the header. Lists locales declared in `config.i18n.locales` and dispatches `SetLocale` on selection. Renders nothing when `config.i18n` is not configured. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onBreadcrumbClick`: Trigger action when a breadcrumb item is clicked.
- `onClose`: Trigger action when mobile menu is closed.
- `onMenuItemClick`: Trigger action when menu item is clicked.
- `onMenuItemSelect`: Trigger action when menu item is selected.
- `onOpen`: Trigger action when mobile menu is open.
- `onProfileMenuClick`: Trigger action when a profile dropdown menu item is clicked. Event payload: `key`, `keyPath`, `pageId`, `url`.
- `onProfileMenuOpen`: Trigger action when the profile dropdown opens or closes. Event payload: `open`.
- `onToggleDrawer`: Trigger action when mobile menu drawer is toggled.
- `onToggleMenuGroup`: Trigger action when mobile menu group is opened.

##### Example

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

#### PageSiderMenu

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `logo` | object |  |  | Header logo settings. By default, images are served from the app public folder and auto-swap between light and dark variants based on dark mode. See Hosting Files for details. |
| `header` | object |  |  | Header properties. |
| `sider` | object |  |  | Sider properties. |
| `siderStorageKey` | string |  | `"sider"` | localStorage key suffix for sider state persistence. Produces key 'lf-{siderStorageKey}-open'. |
| `toggleSiderButton` | object |  |  | Toggle sider button properties. |
| `footer` | object |  |  | Footer properties. |
| `content` | object |  |  | Content properties. |
| `breadcrumb` | object |  |  | Breadcrumb properties. |
| `menu` | object |  |  | Menu properties. |
| `menuLg` | object |  |  | Menu large screen properties. Overwrites menu properties on desktop screen sizes. |
| `menuMd` | object |  |  | Mobile menu properties. Overwrites menu properties on mobile screen sizes. |
| `notifications` | object |  |  | Notification bell icon with badge in the header. Renders when configured. Use the link property to navigate when clicked. |
| `profile` | object |  |  | Profile avatar with optional dropdown menu in the header. Renders when configured. Use with the _user operator to populate from the authenticated user. |
| `darkModeToggle` | boolean |  | `false` | Show a dark mode toggle button in the header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage. |
| `localeSelector` | boolean |  | `false` | Show a locale picker dropdown in the header. Lists locales declared in `config.i18n.locales` and dispatches `SetLocale` on selection. Renders nothing when `config.i18n` is not configured. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onBreadcrumbClick`: Trigger action when a breadcrumb item is clicked.
- `onChangeToggleSiderAffix`: Trigger action when sider collapse button affix triggers a onChange event.
- `onClose`: Trigger action when menu is closed.
- `onMenuItemSelect`: Trigger action when menu item is selected.
- `onMenuItemClick`: Trigger action when menu item is clicked.
- `onOpen`: Trigger action when menu is open.
- `onProfileMenuClick`: Trigger action when a profile dropdown menu item is clicked. Event payload: `key`, `keyPath`, `pageId`, `url`.
- `onProfileMenuOpen`: Trigger action when the profile dropdown opens or closes. Event payload: `open`.
- `onToggleDrawer`: Trigger action when mobile menu drawer is toggled.
- `onToggleMenuGroup`: Trigger action when mobile menu group is opened.

##### Example

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
<!-- generated:reference:end -->

## Recipe

Must cover: one layout block as the page root, `menus.yaml` and `menuId`, `header`/`sider` areas, the `content` area for the page body, breadcrumbs, and a `_ref` template so every page shares the frame.
