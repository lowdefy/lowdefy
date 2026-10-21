# PageRailLayout

Full-page layout for apps whose places each have their own menu or list. A slim rail of labelled places never expands, with badges and a foot for search, the assistant, notifications and the profile. Beside it, a `panel` slot holds the page's own menu or list, and its edge can be dragged between `panel.minWidth` and `panel.maxWidth`; the width is remembered in the browser and shared by every page, so the content does not jump between places. The content has an optional header and a docked `aside` on the right. Below `panel.drawerBreakpoint` (1100px) the panel becomes a drawer over the content, and below `mobileBreakpoint` (768px) the rail becomes a bottom tab bar with More. The rail is themed with CSS variables, each with an antd token as its default, set on `:root` or any parent of the block: `--lf-rail-width`, `--lf-rail-bg`, `--lf-rail-fg`, `--lf-rail-fg-active`, `--lf-rail-item-hover-bg`, `--lf-rail-item-active-bg`, `--lf-rail-item-radius`, `--lf-rail-icon-size`, `--lf-rail-label-size`, `--lf-rail-badge-bg`, `--lf-rail-badge-error-bg`, `--lf-rail-panel-bg`, `--lf-rail-panel-border`, `--lf-rail-content-bg`, `--lf-rail-header-height`, `--lf-rail-handle-color` and `--lf-rail-tab-bar-height`.

Acme Ltd

Access control

Drag the panel edge to resize it. The width is remembered.

```yaml
- id: prl_basic
  type: PageRailLayout
  style:
    .element:
      height: 560px
  properties:
    panel:
      storageKey: prl_basic_panel_width
    menu:
      selectedKeys:
        - prl_basic_controls
      links:
        - id: prl_basic_controls
          type: MenuLink
          properties:
            title: Controls
            icon: ShieldCheck
        - id: prl_basic_documents
          type: MenuLink
          properties:
            title: Documents
            icon: FileText
        - id: prl_basic_people
          type: MenuLink
          properties:
            title: People
            icon: Users
    badges:
      prl_basic_controls: 12
      prl_basic_documents:
        count: 3
        tone: error
    footItems:
      - id: search
        icon: Search
        title: Search
        tip: Search everything
      - id: settings
        icon: Settings
        title: Settings
    notifications:
      count: 4
    profile:
      title: Account
      avatar:
        content: AB
      links:
        - id: prl_basic_sign_out
          type: MenuLink
          properties:
            title: Sign out
    darkModeToggle: true
    breadcrumb:
      list:
        - Controls
        - Access control
  slots:
    panelHeader:
      blocks:
        - id: prl_basic_org
          type: Title
          properties:
            content: Acme Ltd
            level: 5
            margin: false
    panel:
      blocks:
        - id: prl_basic_menu
          type: Menu
          properties:
            mode: inline
            links:
              - id: prl_basic_menu_a
                type: MenuLink
                properties:
                  title: Access control
              - id: prl_basic_menu_b
                type: MenuLink
                properties:
                  title: Asset management
              - id: prl_basic_menu_c
                type: MenuLink
                properties:
                  title: Incident response
    content:
      blocks:
        - id: prl_basic_title
          type: Title
          properties:
            content: Access control
            level: 3
        - id: prl_basic_text
          type: Paragraph
          properties:
            content: Drag the panel edge to resize it. The width is remembered.
```

A page fills this slot with its own menu or list.

Work

An assistant panel docks here.

```yaml
- id: prl_aside
  type: PageRailLayout
  style:
    .element:
      height: 480px
  properties:
    panel:
      storageKey: prl_aside_panel_width
    aside:
      open: true
      width: 320
    menu:
      links:
        - id: prl_aside_home
          type: MenuLink
          properties:
            title: Home
            icon: House
        - id: prl_aside_work
          type: MenuLink
          properties:
            title: Work
            icon: Briefcase
  slots:
    panel:
      blocks:
        - id: prl_aside_panel_text
          type: Paragraph
          properties:
            content: A page fills this slot with its own menu or list.
    content:
      blocks:
        - id: prl_aside_title
          type: Title
          properties:
            content: Work
            level: 3
    aside:
      blocks:
        - id: prl_aside_assistant
          type: Paragraph
          properties:
            content: An assistant panel docks here.
```

A page with only a rail

```yaml
- id: prl_plain
  type: PageRailLayout
  style:
    .element:
      height: 360px
  properties:
    menu:
      links:
        - id: prl_plain_home
          type: MenuLink
          properties:
            title: Home
            icon: House
        - id: prl_plain_settings
          type: MenuLink
          properties:
            title: Settings
            icon: Settings
  slots:
    content:
      blocks:
        - id: prl_plain_title
          type: Title
          properties:
            content: A page with only a rail
            level: 3
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | - | Page title. Accepted for compatibility. |
| `theme` | object | - | Antd global design token overrides, such as colorPrimary or borderRadius, applied to everything in the page layout. See [antd design tokens](https://ant.design/components/overview#design-token). The size and colour of the rail itself are CSS variables, listed on this block's documentation page. See [Ant Design component tokens](https://ant.design/docs/react/customize-theme#seedtoken). |
| `logo` | object | - | Logo mark at the top of the rail. Links to the home page. |
| `logo.src` | string | - | Logo image URL. |
| `logo.alt` | string | - | Logo alternative text. |
| `menu` | object | - | The places in the rail, each an icon over a short label. A MenuGroup or MenuDivider is not supported: the panel is where a place's pages go. |
| `menu.links` | array | - | Menu links. Compatible with `_menu` operator output. A link's `properties.tip` is shown in its hover tip. |
| `menu.links.$.id` | string | - | Menu item id. |
| `menu.links.$.pageId` | string | - | Page to link to. |
| `menu.links.$.properties` | object | - | properties from menu item. |
| `menu.links.$.properties.title` | string | - | Menu item title. |
| `menu.links.$.properties.icon` | string \| object | - | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on menu item. |
| `menu.links.$.properties.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `menu.links.$.properties.icon.color` | string | - | Icon color. |
| `menu.links.$.properties.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `menu.links.$.properties.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `menu.links.$.properties.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `menu.links.$.properties.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `menu.links.$.properties.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `menu.links.$.properties.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `menu.links.$.properties.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `menu.menuId` | string | `"default"` | Id of the app menu to use when `links` is not given. |
| `menu.selectedKeys` | array | - | Keys (page ids) of the places to show as active. Defaults to the current page. |
| `badges` | object | - | Badges on places, keyed by menu link id. A value is a number, or `{ count, tone }` where tone is `default` or `error`. A count of 0 shows no badge. |
| `footItems` | array | - | Items at the foot of the rail, above notifications and the profile. One with a pageId or url is a link; one without triggers `onFootItemClick`. |
| `footItems.$.id` | string | - | Foot item id. |
| `footItems.$.icon` | string \| object | - | Icon for the foot item. |
| `footItems.$.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `footItems.$.icon.color` | string | - | Icon color. |
| `footItems.$.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `footItems.$.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `footItems.$.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `footItems.$.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `footItems.$.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `footItems.$.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `footItems.$.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `footItems.$.title` | string | - | Short label under the icon. |
| `footItems.$.tip` | string | - | Extra text in the hover tip. |
| `footItems.$.badge` | - | - | A number, or `{ count, tone }`. |
| `footItems.$.pageId` | string | - | Page to link to. |
| `footItems.$.url` | string | - | External URL to link to. |
| `footItems.$.newTab` | boolean | - | Open link in new tab. |
| `notifications` | object | - | Notifications item with a count badge, after the foot items. Renders when configured. Triggers `onNotificationsClick`, and navigates when `link` is given. |
| `notifications.title` | string | `"Notifications"` | Label under the bell. |
| `notifications.tip` | string | - | Extra text in the hover tip. |
| `notifications.link` | object | - | Link to navigate to when the item is clicked. |
| `notifications.link.pageId` | string | - | Page to link to. |
| `notifications.link.url` | string | - | External URL to link to. |
| `notifications.link.newTab` | boolean | - | Open link in new tab. |
| `notifications.count` | number | - | Number to display on the badge. |
| `notifications.dot` | boolean | `false` | Show a dot instead of a count. |
| `notifications.showZero` | boolean | `false` | Show the badge at zero. |
| `notifications.overflowCount` | number | `99` | Max count to show. Values above this display as "N+". |
| `notifications.color` | string | - | Badge color. |
| `notifications.icon` | string \| object | - | Icon for the item. Defaults to `bell`. |
| `notifications.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `notifications.icon.color` | string | - | Icon color. |
| `notifications.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `notifications.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `notifications.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `notifications.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `notifications.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `notifications.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `notifications.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `profile` | object | - | Profile avatar at the foot of the rail, with an optional dropdown menu. Renders when configured. Use with the `_user` operator to fill it from the signed-in user. |
| `profile.title` | string | `"Profile"` | Label under the avatar. |
| `profile.avatar` | object | - | Avatar display properties. |
| `profile.avatar.src` | string | - | Image URL for the avatar. |
| `profile.avatar.content` | string | - | Text inside the avatar, such as initials, when there is no src. |
| `profile.avatar.icon` | string \| object | - | Icon when there is no src or content. |
| `profile.avatar.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `profile.avatar.icon.color` | string | - | Icon color. |
| `profile.avatar.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `profile.avatar.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `profile.avatar.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `profile.avatar.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `profile.avatar.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `profile.avatar.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `profile.avatar.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `profile.avatar.color` | string | - | Background color when not using src. |
| `profile.avatar.size` | string \| number | `24` | Size of the avatar: default, small, large or a pixel number. |
| `profile.avatar.shape` | string | `"circle"` | Shape of the avatar. Enum: `circle`, `square`. |
| `profile.links` | array | - | Dropdown menu items. Uses the same MenuLink/MenuGroup/MenuDivider schema as Menu. |
| `profile.links.$.id` | string | - | Menu item id. |
| `profile.links.$.pageId` | string | - | Page to link to. |
| `profile.links.$.properties` | object | - | properties from menu item. |
| `profile.links.$.properties.title` | string | - | Menu item title. |
| `profile.links.$.properties.icon` | string \| object | - | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on menu item. |
| `profile.links.$.properties.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `profile.links.$.properties.icon.color` | string | - | Icon color. |
| `profile.links.$.properties.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `profile.links.$.properties.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `profile.links.$.properties.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `profile.links.$.properties.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `profile.links.$.properties.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `profile.links.$.properties.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `profile.links.$.properties.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `darkModeToggle` | boolean | `false` | Add a dark mode item to the profile menu. Toggles the Ant Design dark theme for the page. The preference is persisted to localStorage. |
| `panel` | object | - | The resizable panel beside the rail, filled by the `panel` slot. Its width is stored in localStorage and shared by every page of the app. |
| `panel.minWidth` | integer | `240` | Smallest width in pixels. |
| `panel.maxWidth` | integer | `480` | Largest width in pixels. |
| `panel.initialWidth` | integer | `300` | Width in pixels before the person has dragged the panel. |
| `panel.storageKey` | string | `"rail-panel-width"` | localStorage key suffix for the width. Produces key 'lf-{storageKey}', kept per app. |
| `panel.drawerBreakpoint` | integer | `1100` | Below this screen width in pixels the panel becomes a drawer over the content. |
| `mobileBreakpoint` | integer | `768` | Below this screen width in pixels the rail becomes a bottom tab bar. |
| `mobileTabs` | integer | `4` | How many places the phone tab bar shows before More, which holds the rest, the foot items, notifications and the profile menu. |
| `aside` | object | - | The right dock, filled by the `aside` slot. |
| `aside.open` | boolean | `false` | Show the dock. The content narrows rather than being covered. |
| `aside.width` | integer | `400` | Width in pixels. |
| `padding` | string | `"default"` | Space around the content. `compact` tightens it to 16px. `none` removes it so content such as a table runs edge to edge. Enum: `default`, `compact`, `none`. |
| `breadcrumb` | object | - | Breadcrumb shown in the content header. |
| `breadcrumb.separator` | string | `"/"` | Use a custom separator string. |
| `breadcrumb.list` | array | - | List of breadcrumb links. |
| `breadcrumb.list.$.label` | string | - | Label of the breadcrumb link. |
| `breadcrumb.list.$.pageId` | string | - | Page id to link to when clicked. |
| `breadcrumb.list.$.url` | string | - | External url link. |
| `breadcrumb.list.$.style` | object | - | Css style to apply to link. |
| `breadcrumb.list.$.icon` | string \| object | - | Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to use an icon in breadcrumb link. |
| `breadcrumb.list.$.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `breadcrumb.list.$.icon.color` | string | - | Icon color. |
| `breadcrumb.list.$.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `breadcrumb.list.$.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `breadcrumb.list.$.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `breadcrumb.list.$.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `breadcrumb.list.$.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `breadcrumb.list.$.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `breadcrumb.list.$.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `breadcrumb.list.$.links` | array | - | Links shown in a dropdown menu on the breadcrumb item. |
| `breadcrumb.list.$.links.$.label` | string | - | Label of the dropdown link. |
| `breadcrumb.list.$.links.$.pageId` | string | - | Page id to link to when clicked. |
| `breadcrumb.list.$.links.$.url` | string | - | External url link. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onMenuItemClick` | `{ key, keyPath, index }` | Trigger action when a place in the rail or tab bar is clicked. |
| `onFootItemClick` | `{ id }` | Trigger action when a foot item without a page or url is clicked. |
| `onPanelResize` | `{ width }` | Trigger action when the panel width is set, on drag end or an arrow key. |
| `onPanelDrawerToggle` | `{ open }` | Trigger action when the panel drawer opens or closes on a tablet. |
| `onNotificationsClick` | \- | Trigger action when the notifications item is clicked. |
| `onBreadcrumbClick` | \- | Trigger action when a breadcrumb item is clicked. |
| `onProfileMenuClick` | `{ key, keyPath, pageId, url }` | Trigger action when a profile dropdown menu item is clicked. |
| `onProfileMenuOpen` | `{ open }` | Trigger action when the profile dropdown opens or closes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PageRailLayout element. |
| `/rail` | The rail. |
| `/railFoot` | The foot of the rail, which holds the foot items, notifications and profile. |
| `/logo` | The logo image at the top of the rail. |
| `/notifications` | The notifications item. |
| `/profile` | The profile item. |
| `/profileAvatar` | The profile avatar. |
| `/profileMenu` | The profile dropdown menu popup. |
| `/panel` | The panel beside the rail. On a phone, the section above the content. |
| `/panelHeader` | The box above the panel that holds the panelHeader slot. |
| `/panelBody` | The scrolling box that holds the panel slot. |
| `/resizeHandle` | The draggable right edge of the panel. |
| `/drawer` | The body of the panel drawer shown on a tablet. |
| `/main` | The column that holds the content header and the content. |
| `/contentHeader` | The row above the content. |
| `/breadcrumb` | The breadcrumb in the content header. |
| `/content` | The content. |
| `/aside` | The right dock. |
| `/tabBar` | The bottom tab bar shown on a phone. |
| `/moreSheet` | The sheet the tab bar's More item opens. |

| Slot | Description |
| --- | --- |
| `content` | Main page content. |
| `contentHeader` | Content of the 52px row above the content, beside the breadcrumb. It lines up with the panel header. |
| `panel` | The page's own menu or list, in the resizable panel beside the rail. The panel is shown when this slot has blocks. |
| `panelHeader` | Content above the panel, such as an organisation switcher. It stays in place while the panel scrolls. |
| `aside` | Content of the right dock, shown while `aside.open` is true. The content narrows to make room. |
| `mobileHeader` | Content above the panel on a phone. |
