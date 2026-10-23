# PageRailLayout

Full-page layout for apps whose places each have their own menu or list. A slim rail of labelled places never expands; places carry badges, and its foot holds search, an assistant, notifications and the profile. A bar over the page holds a panel toggle, a breadcrumb whose leading crumbs can be switchers (an organisation, a workspace, a filter that applies to every page), and the page's actions. Beside the rail, the `panel` slot holds the page's own menu or list. On a desktop its edge drags between `panel.minWidth` and `panel.maxWidth`, resisting below the smallest width and collapsing the panel when dragged far past it; a click on the collapsed edge, the bar button, the active place in the rail or Ctrl/Cmd with backslash opens it again, a double-click on the edge resets the width, and the arrow keys, Home and End resize it from the keyboard. The width and the collapse are remembered in the browser and shared by every page, so the content does not jump between places. Below `panel.drawerBreakpoint` (1100px) the panel is a drawer over the content that Escape, the scrim, a swipe or following a link inside it closes; `panel.startOpen` opens it when a page has nothing picked yet. Below `mobileBreakpoint` (768px) the rail becomes a bottom tab bar with More, the switchers move into a sheet behind a pill in the bar, and the header slot is hidden unless `headerOnPhone` is set. The window scrolls the content and the rail, bar and panel are sticky. Theme it with CSS variables, each defaulting to an antd token, set on `:root` or any parent of the block: `--lf-rail-width`, `--lf-rail-bg`, `--lf-rail-fg`, `--lf-rail-fg-active`, `--lf-rail-hover-bg`, `--lf-rail-active-bg`, `--lf-rail-accent`, `--lf-rail-divider`, `--lf-rail-label-size`, `--lf-rail-badge-bg`, `--lf-rail-badge-fg`, `--lf-rail-badge-error-bg`, `--lf-rail-bar-bg`, `--lf-rail-bar-height`, `--lf-rail-panel-bg`, `--lf-rail-content-bg`, `--lf-rail-handle-color`, `--lf-rail-handle-active`, `--lf-rail-scrim`, `--lf-rail-tab-bg`, `--lf-rail-tab-height`, `--lf-rail-switcher-width` and `--lf-rail-motion-duration`. Set `--lf-rail-viewport-height` to show the layout inside a box of fixed height.

Access control

Drag the panel edge to resize it, or past its smallest width to collapse it. Double-click the edge to reset it, and press Ctrl or Cmd with the backslash key to show or hide the panel. Pick the organisation or the framework from the crumbs.

```yaml
- id: prl_basic
  type: PageRailLayout
  style:
    .element:
      height: 560px
      overflow: auto
      --lf-rail-viewport-height: 560px
  properties:
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
    panel:
      title: Controls
      storageKey: prl_basic_panel
    crumbs:
      - id: org
        label: Acme Ltd
        mark:
          text: AL
          color: "#17b3a3"
        switcher:
          title: Organisations
          options:
            - id: acme
              label: Acme Ltd
              description: Owner
              selected: true
              mark:
                text: AL
                color: "#17b3a3"
            - id: globex
              label: Globex
              description: Admin
              extra: 4
              mark:
                text: GX
                color: "#5b7fd6"
          actions:
            - id: new
              label: New organisation
              icon: Plus
      - id: lens
        label: ISO 27001
        mark:
          percent: 62
        switcher:
          options:
            - id: all
              label: All frameworks
              mark:
                percent: 48
            - id: iso
              label: ISO 27001
              selected: true
              mark:
                percent: 62
      - id: place
        label: Controls
      - id: record
        label: Access control
  slots:
    header:
      blocks:
        - id: prl_basic_comment
          type: Button
          properties:
            title: Comment
            size: small
            icon: MessageCircle
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
            content: Drag the panel edge to resize it, or past its smallest width to
              collapse it. Double-click the edge to reset it, and press Ctrl or
              Cmd with the backslash key to show or hide the panel. Pick the
              organisation or the framework from the crumbs.
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
      overflow: auto
      --lf-rail-viewport-height: 480px
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
      overflow: auto
      --lf-rail-viewport-height: 360px
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
| `theme` | object | - | Antd global design token overrides, such as colorPrimary or borderRadius, applied to everything in the page layout. See [antd design tokens](https://ant.design/components/overview#design-token). The rail, bar and panel colours and sizes are CSS variables, listed on this block's documentation page. See [Ant Design component tokens](https://ant.design/docs/react/customize-theme#seedtoken). |
| `logo` | object | - | Logo mark at the top of the rail. Links to the home page. |
| `logo.src` | string | - | Logo image URL. |
| `logo.alt` | string | - | Accessible name of the logo link. Defaults to Home. |
| `menu` | object | - | The places in the rail, each an icon over a short label. A MenuGroup or MenuDivider is not supported: the panel is where a place's pages go. Clicking the place whose page is open toggles its panel. |
| `menu.links` | array | - | Menu links. Compatible with `_menu` operator output. A link's `properties.tip` is added to its hover tip, and `properties.shortcut` (modifiers and one key joined by `+`, such as `mod+1`) opens it from the keyboard. |
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
| `badges` | object | - | Badges on places, keyed by menu link id: a number, or `{ count, tone, dot }`. Count what needs someone, not totals, so an empty badge means nothing is waiting. |
| `footItems` | array | - | Items at the foot of the rail, above notifications and the profile, such as search or an assistant. One with a pageId or url is a link; one without triggers `onFootItemClick`. |
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
| `footItems.$.shortcut` | string | - | Keyboard shortcut shown in the hover tip, such as `mod+k`. |
| `footItems.$.badge` | - | - | A number, or `{ count, tone, dot }`. Tone is `default` or `error`; `dot` shows a dot with no number. A count of 0 shows nothing. |
| `footItems.$.pageId` | string | - | Page to link to. |
| `footItems.$.url` | string | - | External URL to link to. |
| `footItems.$.urlQuery` | object | - | Query parameters for the link. |
| `footItems.$.newTab` | boolean | - | Open link in new tab. |
| `notifications` | object | - | Notifications item with a count badge, after the foot items. Renders when configured. Triggers `onNotificationsClick`, and navigates when `link` is given. |
| `notifications.title` | string | `"Alerts"` | Label under the bell. |
| `notifications.tip` | string | - | Extra text in the hover tip. |
| `notifications.link` | object | - | Link to navigate to when the item is clicked. |
| `notifications.link.pageId` | string | - | Page to link to. |
| `notifications.link.url` | string | - | External URL to link to. |
| `notifications.link.urlQuery` | object | - | Query parameters for the link. |
| `notifications.link.newTab` | boolean | - | Open link in new tab. |
| `notifications.count` | number | - | Number to display on the badge. |
| `notifications.dot` | boolean | `false` | Show a dot instead of a count. |
| `notifications.tone` | string | `"error"` | Badge colour. Enum: `default`, `error`. |
| `notifications.overflowCount` | number | `99` | Max count to show. Values above this display as "N+". |
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
| `profile` | object | - | Profile avatar at the foot of the rail, with its menu. Renders when configured. Use with the `_user` operator to fill it from the signed-in user. |
| `profile.title` | string | `"Account"` | Label under the avatar. |
| `profile.name` | string | - | The person's name, at the top of the menu. |
| `profile.email` | string | - | The person's email, under their name. |
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
| `profile.avatar.shape` | string | `"circle"` | Shape of the avatar. Enum: `circle`, `square`. |
| `profile.links` | array | - | Menu items. Uses the same MenuLink/MenuGroup/MenuDivider schema as Menu. On a phone they are listed in the More sheet. |
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
| `darkModeToggle` | boolean | `false` | Add a dark mode item to the profile menu. The preference is persisted to localStorage. |
| `crumbs` | array | - | The breadcrumb in the bar. Lead with switcher crumbs (an organisation, a workspace, a filter that applies to every page), then the trail to the current page. On a phone the last switcher becomes a pill that opens a sheet with every switcher, and the last crumb is the title. |
| `crumbs.$.id` | string | - | Crumb id. |
| `crumbs.$.label` | string | - | Crumb text. |
| `crumbs.$.icon` | string \| object | - | Icon before the text, when there is no mark. |
| `crumbs.$.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `crumbs.$.icon.color` | string | - | Icon color. |
| `crumbs.$.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `crumbs.$.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `crumbs.$.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `crumbs.$.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `crumbs.$.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `crumbs.$.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `crumbs.$.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `crumbs.$.mark` | object | - | What marks the crumb or option: `{ percent, color }` draws a progress ring (a score), `{ src }` an image, `{ icon, color }` an icon on a tint, `{ text, color }` up to two letters on a tint. |
| `crumbs.$.mark.text` | string | - | Up to two letters on a tint. |
| `crumbs.$.mark.color` | string | - | Tint, or the ring colour with percent. |
| `crumbs.$.mark.src` | string | - | Image URL. |
| `crumbs.$.mark.icon` | string \| object | - | Icon on a tint. |
| `crumbs.$.mark.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `crumbs.$.mark.icon.color` | string | - | Icon color. |
| `crumbs.$.mark.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `crumbs.$.mark.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `crumbs.$.mark.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `crumbs.$.mark.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `crumbs.$.mark.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `crumbs.$.mark.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `crumbs.$.mark.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `crumbs.$.mark.percent` | number | - | Draw a progress ring filled to this percent. |
| `crumbs.$.pageId` | string | - | Page to link to. |
| `crumbs.$.url` | string | - | External URL to link to. |
| `crumbs.$.urlQuery` | object | - | Query parameters for the link. |
| `crumbs.$.newTab` | boolean | - | Open link in new tab. |
| `crumbs.$.switcher` | object | - | Makes the crumb a switcher: clicking it opens a list of options, filtered once there are enough of them. |
| `crumbs.$.switcher.title` | string | - | Heading over the list. |
| `crumbs.$.switcher.placeholder` | string | - | Placeholder of the filter box. |
| `crumbs.$.switcher.filterFrom` | integer | `6` | Show the filter box from this many options. |
| `crumbs.$.switcher.empty` | string | - | Text when the filter matches nothing. |
| `crumbs.$.switcher.ariaLabel` | string | - | Accessible name of the crumb button. |
| `crumbs.$.switcher.options` | array | - | The options. One with a pageId or url navigates; every pick triggers `onSwitch`. |
| `crumbs.$.switcher.options.$.id` | string | - | Option id. |
| `crumbs.$.switcher.options.$.label` | string | - | Option text. |
| `crumbs.$.switcher.options.$.description` | string | - | Second line. |
| `crumbs.$.switcher.options.$.extra` | string \| number | - | Short text or count at the right, such as what waits there. |
| `crumbs.$.switcher.options.$.selected` | boolean | - | Tick this option as current. |
| `crumbs.$.switcher.options.$.mark` | object | - | What marks the crumb or option: `{ percent, color }` draws a progress ring (a score), `{ src }` an image, `{ icon, color }` an icon on a tint, `{ text, color }` up to two letters on a tint. |
| `crumbs.$.switcher.options.$.mark.text` | string | - | Up to two letters on a tint. |
| `crumbs.$.switcher.options.$.mark.color` | string | - | Tint, or the ring colour with percent. |
| `crumbs.$.switcher.options.$.mark.src` | string | - | Image URL. |
| `crumbs.$.switcher.options.$.mark.icon` | string \| object | - | Icon on a tint. |
| `crumbs.$.switcher.options.$.mark.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `crumbs.$.switcher.options.$.mark.icon.color` | string | - | Icon color. |
| `crumbs.$.switcher.options.$.mark.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `crumbs.$.switcher.options.$.mark.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `crumbs.$.switcher.options.$.mark.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `crumbs.$.switcher.options.$.mark.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `crumbs.$.switcher.options.$.mark.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `crumbs.$.switcher.options.$.mark.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `crumbs.$.switcher.options.$.mark.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `crumbs.$.switcher.options.$.mark.percent` | number | - | Draw a progress ring filled to this percent. |
| `crumbs.$.switcher.options.$.pageId` | string | - | Page to link to. |
| `crumbs.$.switcher.options.$.url` | string | - | External URL to link to. |
| `crumbs.$.switcher.options.$.urlQuery` | object | - | Query parameters for the link. |
| `crumbs.$.switcher.options.$.newTab` | boolean | - | Open link in new tab. |
| `crumbs.$.switcher.actions` | array | - | Rows under the options, such as "New organisation". One with a pageId or url navigates; every pick triggers `onSwitcherAction`. |
| `crumbs.$.switcher.actions.$.id` | string | - | Action id. |
| `crumbs.$.switcher.actions.$.label` | string | - | Action text. |
| `crumbs.$.switcher.actions.$.icon` | string \| object | - | Action icon. |
| `crumbs.$.switcher.actions.$.icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `crumbs.$.switcher.actions.$.icon.color` | string | - | Icon color. |
| `crumbs.$.switcher.actions.$.icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `crumbs.$.switcher.actions.$.icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `crumbs.$.switcher.actions.$.icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `crumbs.$.switcher.actions.$.icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `crumbs.$.switcher.actions.$.icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `crumbs.$.switcher.actions.$.icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `crumbs.$.switcher.actions.$.icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `crumbs.$.switcher.actions.$.pageId` | string | - | Page to link to. |
| `crumbs.$.switcher.actions.$.url` | string | - | External URL to link to. |
| `crumbs.$.switcher.actions.$.urlQuery` | object | - | Query parameters for the link. |
| `crumbs.$.switcher.actions.$.newTab` | boolean | - | Open link in new tab. |
| `panel` | object | - | The panel beside the rail, filled by the `panel` slot. On a desktop people drag its edge to resize it and collapse it; the width and collapse are kept in localStorage, shared by every page of the app. On a tablet or phone it is a drawer over the content. |
| `panel.title` | string | - | The panel's accessible name, and its heading in the drawer. |
| `panel.minWidth` | integer | `240` | Smallest width in pixels. |
| `panel.maxWidth` | integer | `480` | Largest width in pixels. |
| `panel.initialWidth` | integer | `300` | Width before the person has resized the panel, and after a double-click on its edge. |
| `panel.storageKey` | string | `"rail-panel"` | localStorage key suffix. Produces key 'lf-{storageKey}', kept per app. |
| `panel.shortcut` | string \| null | `"mod+\\"` | Keyboard shortcut that opens and closes the panel. Null turns it off. |
| `panel.startOpen` | boolean | `false` | Open the drawer when the page opens on a tablet or phone, such as a list page with nothing picked yet. |
| `panel.closeOnNavigate` | boolean | `true` | Close the drawer when a link inside it is followed. |
| `panel.drawerBreakpoint` | integer | `1100` | Below this screen width in pixels the panel becomes a drawer over the content. |
| `mobileBreakpoint` | integer | `768` | Below this screen width in pixels the rail becomes a bottom tab bar. |
| `headerOnPhone` | boolean | `false` | Keep the header slot in the bar on a phone. Off by default: a phone's bar has room for the switcher pill and the title only, so put a page's phone actions in its content. |
| `mobileTabs` | integer | `4` | How many places the phone tab bar shows before More, which holds the rest, the foot items, notifications and the profile menu. |
| `aside` | object | - | The right dock, filled by the `aside` slot. |
| `aside.open` | boolean | `false` | Show the dock. |
| `aside.width` | integer | `400` | Width in pixels. |
| `aside.title` | string | - | The dock's accessible name. |
| `padding` | string | `"default"` | Space around the content. `compact` tightens it to 16px. `none` removes it so content such as a table runs edge to edge. Enum: `default`, `compact`, `none`. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onMenuItemClick` | `{ key, keyPath, index }` | Trigger action when a place in the rail or tab bar is clicked. |
| `onFootItemClick` | `{ id }` | Trigger action when a foot item without a page or url is clicked. |
| `onNotificationsClick` | \- | Trigger action when the notifications item is clicked. |
| `onProfileMenuClick` | `{ key, keyPath, pageId, url }` | Trigger action when a profile menu item is clicked. |
| `onProfileMenuOpen` | `{ open }` | Trigger action when the profile menu opens or closes. |
| `onSwitch` | `{ crumbId, optionId, pageId, url }` | Trigger action when an option is picked in a switcher crumb. An option with a page or url also navigates. |
| `onSwitcherAction` | `{ crumbId, actionId }` | Trigger action when one of a switcher crumb's actions is picked. |
| `onCrumbClick` | `{ id }` | Trigger action when a crumb that links to a page is clicked. |
| `onPanelToggle` | `{ open, mode, source }` | Trigger action when the panel opens or closes. |
| `onPanelResize` | `{ width }` | Trigger action when the panel width is set, on drag end or a key press. |
| `onAsideClose` | \- | Trigger action when the scrim behind the aside is tapped on a tablet or phone. |

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
| `/bar` | The bar above the panel and the content. |
| `/crumbs` | The breadcrumb in the bar. |
| `/header` | The box at the right of the bar that holds the header slot. |
| `/panel` | The panel beside the rail; a drawer on a tablet or phone. |
| `/panelHeader` | The box at the top of the panel that holds the panelHeader slot. |
| `/panelBody` | The scrolling box that holds the panel slot. |
| `/resizeHandle` | The draggable right edge of the panel. |
| `/main` | The content. |
| `/aside` | The right dock. |
| `/tabBar` | The bottom tab bar shown on a phone. |
| `/moreSheet` | The sheet the tab bar's More item opens. |

| Slot | Description |
| --- | --- |
| `content` | Main page content. |
| `panel` | The page's own menu or list, in the panel beside the rail. The panel is shown when this slot has blocks. |
| `panelHeader` | Content at the top of the panel, such as a title, filters or a search box. It stays in place while the panel scrolls. |
| `header` | The page's actions, at the right of the bar. |
| `aside` | Content of the right dock, shown while `aside.open` is true. On a desktop the content narrows to make room; on a tablet or phone it slides over the content. |
