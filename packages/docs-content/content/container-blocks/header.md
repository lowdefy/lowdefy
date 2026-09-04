# Header

Page header layout section. Supports built-in notifications, profile avatar, and dark mode toggle.

```yaml
- id: header_basic
  type: Header
  style:
    borderBottom: 1px solid var(--ant-color-border)
  blocks:
    - id: header_basic_logo
      type: Html
      layout:
        flex: 0 0 auto
      properties:
        html: <span class="text-lg font-bold">MyApp</span>
```

```yaml
- id: header_nav
  type: Header
  style:
    borderBottom: 1px solid var(--ant-color-border)
  blocks:
    - id: header_nav_logo
      type: Html
      layout:
        flex: 0 0 auto
      properties:
        html: <span class="text-lg font-bold mr-6">MyApp</span>
    - id: header_nav_home
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Home
        icon: AiOutlineHome
        color: default
        variant: link
    - id: header_nav_about
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: About
        color: default
        variant: link
    - id: header_nav_contact
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Contact
        color: default
        variant: link
```

```yaml
- id: header_profile
  type: Header
  properties:
    darkModeToggle: true
    notifications:
      count: 3
    profile:
      avatar:
        content: JD
        color: "#1677ff"
      links:
        - id: header_prof_profile
          type: MenuLink
          properties:
            title: My Profile
            icon: AiOutlineUser
        - id: header_prof_settings
          type: MenuLink
          properties:
            title: Settings
            icon: AiOutlineSetting
        - id: header_prof_divider
          type: MenuDivider
        - id: header_prof_logout
          type: MenuLink
          properties:
            title: Logout
            icon: AiOutlineLogout
            danger: true
  style:
    borderBottom: 1px solid var(--ant-color-border)
  blocks:
    - id: header_profile_logo
      type: Html
      layout:
        flex: 0 0 auto
      properties:
        html: <span class="text-lg font-bold mr-6">Dashboard</span>
    - id: header_profile_overview
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Overview
        icon: AiOutlineDashboard
        color: default
        variant: link
    - id: header_profile_projects
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Projects
        icon: AiOutlineProject
        color: default
        variant: link
```

Build Better Products, Faster

A Header for marketing pages with button navigation and call-to-action buttons.

```yaml
- id: header_marketing
  type: Layout
  style:
    minHeight: 300px
  blocks:
    - id: header_marketing_el
      type: Header
      style:
        borderBottom: 1px solid var(--ant-color-border)
      blocks:
        - id: header_marketing_brand
          type: Html
          layout:
            flex: 0 0 auto
          properties:
            html: <span class="text-primary text-[22px] font-bold mr-8">Acme Inc</span>
        - id: header_marketing_nav_features
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Features
            color: default
            variant: link
        - id: header_marketing_nav_pricing
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Pricing
            color: default
            variant: link
        - id: header_marketing_nav_docs
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Docs
            color: default
            variant: link
        - id: header_marketing_spacer
          type: Box
          layout:
            flex: 1 1 0
        - id: header_marketing_btn_login
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Log In
            color: default
            variant: outlined
        - id: header_marketing_btn_signup
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Get Started
            color: primary
            variant: solid
    - id: header_marketing_content
      type: Content
      style:
        padding: 64px 48px
        textAlign: center
      blocks:
        - id: header_marketing_hero_title
          type: Title
          properties:
            content: Build Better Products, Faster
            level: 1
        - id: header_marketing_hero_subtitle
          type: Paragraph
          properties:
            content: A Header for marketing pages with button navigation and call-to-action
              buttons.
```

```yaml
- id: header_token_branded
  type: Header
  properties:
    theme:
      headerBg: "#0958d9"
      headerHeight: 56
      headerPadding: 0 24px
  blocks:
    - id: header_token_branded_title
      type: Html
      layout:
        flex: 0 0 auto
      properties:
        html: <span class="text-white text-lg font-bold">Branded Header</span>
    - id: header_token_branded_spacer
      type: Box
      layout:
        flex: 1 1 0
    - id: header_token_branded_subtitle
      type: Html
      layout:
        flex: 0 0 auto
      properties:
        html: <span style="color:#bae0ff">Using headerBg token</span>
- id: header_token_compact
  type: Header
  properties:
    theme:
      headerHeight: 40
      headerPadding: 0 16px
  style:
    borderBottom: 1px solid var(--ant-color-border)
  blocks:
    - id: header_token_compact_title
      type: Html
      properties:
        html: <span class="text-sm">Compact Header (40px height)</span>
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | string | - | Header background color. Accepts any CSS color value. Defaults to the antd container background color (light in light mode, dark in dark mode). |
| `iconsColor` | string | - | Color for the notification, profile, and dark mode toggle icons. Use when the header has a dark background color. |
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
| `profile.links` | array | - | Dropdown menu items. Uses the same MenuLink/MenuGroup/MenuDivider pattern as DropdownMenu. When links are provided, clicking the avatar opens a dropdown menu. |
| `profile.links.$.id` | string | - | Menu item id. |
| `profile.links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`, `MenuGroup`. |
| `profile.links.$.pageId` | string | - | Page to link to. |
| `profile.links.$.url` | string | - | External URL to link to. |
| `profile.links.$.newTab` | boolean | - | Open link in new tab. |
| `profile.links.$.properties` | object | - | Properties for the menu item. |
| `profile.links.$.properties.title` | string | - | Menu item title. |
| `profile.links.$.properties.icon` | string \| object | - | Icon for the menu item. |
| `profile.links.$.properties.danger` | boolean | `false` | Apply danger style to menu item. |
| `profile.links.$.properties.disabled` | boolean | `false` | Disable the menu item. |
| `profile.trigger` | string | `"hover"` | How the profile dropdown opens. Enum: `click`, `hover`. |
| `profile.placement` | string | `"bottomRight"` | Dropdown placement relative to the avatar. Enum: `bottomLeft`, `bottom`, `bottomRight`, `topLeft`, `top`, `topRight`. |
| `profile.arrow` | boolean \| object | `false` | Show arrow on the dropdown. |
| `profile.arrow.pointAtCenter` | boolean | - |  |
| `darkModeToggle` | boolean | `false` | Show a dark mode toggle icon in the header. Toggles the Ant Design dark theme for the entire page. Preference is persisted to localStorage. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design layout tokens](https://ant.design/components/layout#design-token). |

| Event | Event Data | Description |
| --- | --- | --- |
| `onProfileMenuClick` | `{ key: string, keyPath: array, pageId: string, url: string }` | Trigger action when a profile dropdown menu item is clicked. |
| `onProfileMenuOpen` | `{ open: boolean }` | Trigger action when the profile dropdown opens or closes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Header element. |
| `/headerActions` | The header actions container (notifications, profile, dark mode toggle). |
| `/notifications` | The notification bell wrapper. |
| `/notificationsBadge` | The notification badge. |
| `/notificationsIcon` | The notification bell icon. |
| `/profile` | The profile avatar and dropdown wrapper. |
| `/profileAvatar` | The profile avatar element. |
| `/profileMenu` | The profile dropdown menu popup. |
| `/darkModeToggle` | The dark mode toggle wrapper. |

| Slot | Description |
| --- | --- |
| `content` | Child blocks in the header. |
