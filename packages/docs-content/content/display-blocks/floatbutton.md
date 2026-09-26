# FloatButton

Floating action button with tooltip, badge, and icon.

```yaml
- id: float_demo
  type: FloatButton
  visible:
    _state: float_active
  properties:
    type:
      _state: float_props.type
    shape:
      _state: float_props.shape
    icon:
      _state: float_props.icon
    tooltip:
      _state: float_props.tooltip
    description:
      _state: float_props.description
    badge:
      _state: float_props.badge
    href:
      _state: float_props.href
    target:
      _state: float_props.target
    theme:
      _state: float_props.theme
  events:
    onClick:
      - id: float_click_msg
        type: DisplayMessage
        params:
          content: FloatButton clicked!
          status: info
- id: btn_type_default
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Default
    color: default
    variant: outlined
    icon: help
  events:
    onClick:
      - id: set_type_default
        type: SetState
        params:
          float_active: true
          float_props:
            type: default
            icon: help
            tooltip: Default type
- id: btn_type_primary
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Primary
    color: primary
    variant: outlined
    icon: help
  events:
    onClick:
      - id: set_type_primary
        type: SetState
        params:
          float_active: true
          float_props:
            type: primary
            icon: help
            tooltip: Primary type
- id: btn_type_support
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Support
    color: primary
    variant: outlined
    icon: Headset
  events:
    onClick:
      - id: set_type_support
        type: SetState
        params:
          float_active: true
          float_props:
            type: primary
            icon: Headset
            tooltip: Contact support
```

```yaml
- id: btn_shape_circle
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Circle
    color: default
    variant: outlined
  events:
    onClick:
      - id: set_shape_circle
        type: SetState
        params:
          float_active: true
          float_props:
            shape: circle
            icon: add
            tooltip: Circle (default)
- id: btn_shape_square
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Square
    color: default
    variant: outlined
  events:
    onClick:
      - id: set_shape_square
        type: SetState
        params:
          float_active: true
          float_props:
            shape: square
            icon: settings
            tooltip: Square shape
- id: btn_shape_square_primary
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Square Primary
    color: primary
    variant: outlined
  events:
    onClick:
      - id: set_shape_square_primary
        type: SetState
        params:
          float_active: true
          float_props:
            shape: square
            type: primary
            icon: edit
            tooltip: Square primary
```

```yaml
- id: btn_icon_string
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: String
    color: default
    variant: outlined
    icon: help
  events:
    onClick:
      - id: set_icon_string
        type: SetState
        params:
          float_active: true
          float_props:
            icon: help
            tooltip: String icon
- id: btn_icon_object
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Object
    color: default
    variant: outlined
    icon: Rocket
  events:
    onClick:
      - id: set_icon_object
        type: SetState
        params:
          float_active: true
          float_props:
            icon:
              name: Rocket
            tooltip: Object icon
- id: btn_icon_colored
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Colored
    color: default
    variant: outlined
    icon: heart
  events:
    onClick:
      - id: set_icon_colored
        type: SetState
        params:
          float_active: true
          float_props:
            icon:
              name: heart
              color: "#eb2f96"
            tooltip: Colored icon
```

```yaml
- id: btn_tooltip_short
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Short
    color: default
    variant: outlined
  events:
    onClick:
      - id: set_tooltip_short
        type: SetState
        params:
          float_active: true
          float_props:
            icon: help
            tooltip: Help
- id: btn_tooltip_long
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Long
    color: default
    variant: outlined
  events:
    onClick:
      - id: set_tooltip_long
        type: SetState
        params:
          float_active: true
          float_props:
            icon: Headset
            tooltip: Click here to get help from our support team
```

```yaml
- id: btn_desc_icon
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: With Icon
    color: primary
    variant: outlined
    icon: help
  events:
    onClick:
      - id: set_desc_icon
        type: SetState
        params:
          float_active: true
          float_props:
            shape: square
            type: primary
            icon: help
            description: Help
- id: btn_desc_docs
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Docs
    color: primary
    variant: outlined
    icon: document
  events:
    onClick:
      - id: set_desc_docs
        type: SetState
        params:
          float_active: true
          float_props:
            shape: square
            type: primary
            icon: document
            description: Docs
- id: btn_desc_text
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Text Only
    color: primary
    variant: outlined
  events:
    onClick:
      - id: set_desc_text
        type: SetState
        params:
          float_active: true
          float_props:
            shape: square
            type: primary
            description: Chat
```

```yaml
- id: btn_badge_count
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Count
    color: default
    variant: outlined
    icon: bell
  events:
    onClick:
      - id: set_badge_count
        type: SetState
        params:
          float_active: true
          float_props:
            icon: bell
            tooltip: Notifications
            badge:
              count: 5
- id: btn_badge_dot
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Dot
    color: default
    variant: outlined
    icon: mail
  events:
    onClick:
      - id: set_badge_dot
        type: SetState
        params:
          float_active: true
          float_props:
            icon: mail
            tooltip: Messages
            badge:
              dot: true
- id: btn_badge_overflow
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Overflow
    color: default
    variant: outlined
    icon: Inbox
  events:
    onClick:
      - id: set_badge_overflow
        type: SetState
        params:
          float_active: true
          float_props:
            icon: Inbox
            tooltip: Inbox
            badge:
              count: 99
              overflowCount: 50
```

```yaml
- id: btn_href_link
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Link
    color: default
    variant: outlined
    icon: link
  events:
    onClick:
      - id: set_href_link
        type: SetState
        params:
          float_active: true
          float_props:
            icon: link
            tooltip: Open Lowdefy (new tab)
            href: https://lowdefy.com
            target: _blank
- id: btn_href_docs
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Docs Link
    color: primary
    variant: outlined
    icon: document
  events:
    onClick:
      - id: set_href_docs
        type: SetState
        params:
          float_active: true
          float_props:
            type: primary
            icon: document
            tooltip: View documentation (new tab)
            href: https://docs.lowdefy.com
            target: _blank
```

```yaml
- id: btn_theme_green
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Green
    color: primary
    variant: outlined
    icon: check
  events:
    onClick:
      - id: set_theme_green
        type: SetState
        params:
          float_active: true
          float_props:
            type: primary
            icon: check
            tooltip: Green primary
            theme:
              colorPrimary: "#52c41a"
              colorPrimaryHover: "#73d13d"
- id: btn_theme_dark
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Dark
    color: default
    variant: outlined
    icon: settings
  events:
    onClick:
      - id: set_theme_dark
        type: SetState
        params:
          float_active: true
          float_props:
            icon: settings
            tooltip: Dark background
            theme:
              colorBgElevated: "#1f1f1f"
              colorText: "#ffffff"
- id: btn_theme_large
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Large
    color: primary
    variant: outlined
    icon: add
  events:
    onClick:
      - id: set_theme_large
        type: SetState
        params:
          float_active: true
          float_props:
            type: primary
            icon: add
            tooltip: Large button
            theme:
              controlHeightLG: 56
              fontSizeIcon: 24
- id: btn_theme_badge
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Custom Badge
    color: default
    variant: outlined
    icon: bell
  events:
    onClick:
      - id: set_theme_badge
        type: SetState
        params:
          float_active: true
          float_props:
            icon: bell
            tooltip: Custom badge color
            badge:
              count: 3
            theme:
              badgeColor: "#722ed1"
              dotSize: 12
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | `"default"` | Setting button type. Enum: `default`, `primary`. |
| `shape` | string | `"circle"` | Setting button shape. Enum: `circle`, `square`. |
| `description` | string | - | Text and other. |
| `tooltip` | string | - | The text shown in the tooltip. |
| `icon` | string \| object | - | Icon for the button. |
| `icon.name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. |
| `icon.color` | string | - | Icon color. |
| `icon.size` | string \| number | - | Size of the icon. Defaults to `theme.icons.size`. |
| `icon.rotate` | number | - | Number of degrees to rotate the icon. |
| `icon.spin` | boolean | - | Continuously spin the icon with animation. |
| `icon.strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `icon.nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `icon.title` | string | - | Icon hover title for accessibility. An empty string marks the icon as decorative. |
| `icon.disableLoadingIcon` | boolean | - | While loading after the icon has been clicked, don't render the loading icon. |
| `href` | string | - | The target of hyperlink. |
| `htmlType` | string | `"button"` | HTML button type. Enum: `button`, `submit`, `reset`. |
| `target` | string | - | Specifies where to display the linked URL. |
| `badge` | object | - | Badge configuration for the button. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design float-button tokens](https://ant.design/components/float-button#design-token). |
| `theme.dotSize` | number | `8` | Badge dot size. |
| `theme.badgeColor` | string | - | Badge color. |
| `theme.borderRadiusLG` | number | `8` | Border radius for square shape. |
| `theme.colorPrimary` | string | - | Primary color for primary type button. |
| `theme.colorPrimaryHover` | string | - | Hover color for primary type button. |
| `theme.colorBgElevated` | string | - | Background color for default type button. |
| `theme.colorText` | string | - | Text and icon color. |
| `theme.colorTextLightSolid` | string | - | Text color on primary background. |
| `theme.boxShadowSecondary` | string | - | Shadow for the float button. |
| `theme.fontSize` | number | `14` | Font size. |
| `theme.fontSizeIcon` | number | `18` | Icon font size. |
| `theme.controlHeightLG` | number | `40` | Controls the float button size. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Trigger action when button is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The FloatButton element. |
| `/icon` | The icon in the FloatButton. |

No slots defined.
