# Tag

Tag with preset and custom colors, icons, and closable option.

```yaml
- id: title_simple
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Feature
- id: title_html_bold
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: <b>Important</b> Update
- id: title_html_styled
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: '<span style="letter-spacing: 1px">NEW</span>'
- id: title_fallback
  type: Tag
  layout:
    flex: 0 0 auto
```

```yaml
- id: color_status_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: color_success
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: success
        color: success
    - id: color_processing
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: processing
        color: processing
    - id: color_error
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: error
        color: error
    - id: color_warning
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: warning
        color: warning
    - id: color_default
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: default
        color: default
- id: color_named_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: color_blue
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: blue
        color: blue
    - id: color_green
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: green
        color: green
    - id: color_gold
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: gold
        color: gold
    - id: color_purple
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: purple
        color: purple
    - id: color_volcano
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: volcano
        color: volcano
```

```yaml
- id: hex_coral
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Coral
    color: "#ff6b6b"
- id: hex_teal
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Teal
    color: "#20c997"
- id: hex_indigo
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Indigo
    color: "#4c6ef5"
- id: hex_navy
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Navy
    color: "#1864ab"
```

```yaml
- id: icon_string
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Approved
    icon: AiOutlineCheck
    color: success
- id: icon_warning
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Warning
    icon: AiOutlineWarning
    color: warning
- id: icon_star
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Featured
    icon: AiOutlineStar
    color: gold
- id: icon_object_color
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Custom Icon
    icon:
      name: AiOutlineCrown
      color: "#faad14"
    color: gold
- id: icon_object_style
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Large Icon
    icon:
      name: AiOutlineRocket
      style:
        fontSize: 16
    color: purple
```

```yaml
- id: closable_default
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Removable
    closable: true
- id: closable_colored
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Done
    closable: true
    color: success
- id: closable_with_icon
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Starred
    closable: true
    icon: AiOutlineStar
    color: gold
- id: closable_with_event
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Close me
    closable: true
    color: processing
  events:
    onClose:
      - id: closable_event_msg
        type: DisplayMessage
        params:
          content: Tag closed!
          status: info
```

```yaml
- id: click_basic
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Click me
    color: blue
  events:
    onClick:
      - id: click_basic_msg
        type: DisplayMessage
        params:
          content: Tag clicked!
          status: info
- id: click_with_icon
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: View Details
    icon: AiOutlineEye
    color: geekblue
  events:
    onClick:
      - id: click_icon_msg
        type: DisplayMessage
        params:
          content: Opening details...
          status: info
- id: click_set_state
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Select Category
    color: purple
  events:
    onClick:
      - id: click_set_state_action
        type: SetState
        params:
          selectedCategory: design
```

```yaml
- id: shortcut_filter
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Toggle Filter
    icon: AiOutlineFilter
    color: blue
  events:
    onClick:
      shortcut: mod+f
      try:
        - id: filter_msg
          type: DisplayMessage
          params:
            content: Filter toggled
            status: info
```

```yaml
- id: css_shadow
  type: Tag
  layout:
    flex: 0 0 auto
  class: shadow-md
  properties:
    title: Shadow
    color: blue
- id: css_rounded
  type: Tag
  layout:
    flex: 0 0 auto
  class: rounded-full
  properties:
    title: Pill Shape
    color: green
- id: css_uppercase
  type: Tag
  layout:
    flex: 0 0 auto
  class: uppercase tracking-wider
  properties:
    title: Uppercase
    color: purple
- id: style_inline_bold
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Bold Text
    color: volcano
  style:
    .element:
      fontWeight: bold
      fontSize: 14px
- id: style_inline_padding
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Extra Padding
    color: cyan
  style:
    .element:
      padding: 4px 16px
      borderWidth: 2px
```

```yaml
- id: theme_light_blue
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Light Blue
    theme:
      defaultColor: "#1677ff"
- id: theme_dark
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Dark Tag
    theme:
      defaultBg: "#141414"
      defaultColor: "#ffffff"
- id: theme_warm
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Warm Tone
    theme:
      defaultColor: "#d46b08"
- id: theme_solid_text
  type: Tag
  layout:
    flex: 0 0 auto
  properties:
    title: Custom Solid
    color: "#7c3aed"
    theme:
      solidTextColor: "#fde68a"
```

When a user enters an email without a domain, the login page throws an unhandled exception and shows a blank screen.

```yaml
- id: issue_card
  type: Card
  properties:
    title: "BUG-1042: Login page crashes on invalid email"
    size: small
  blocks:
    - id: issue_description
      type: Markdown
      properties:
        content: When a user enters an email without a domain, the login page throws an
          unhandled exception and shows a blank screen.
    - id: issue_tags_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: issue_status
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: In Progress
            icon: AiOutlineSync
            color: processing
        - id: issue_priority
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: High Priority
            icon: AiOutlineArrowUp
            color: error
          style:
            .element:
              fontWeight: bold
        - id: issue_label_bug
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: bug
            color: red
            closable: true
          events:
            onClose:
              - id: issue_remove_label
                type: DisplayMessage
                params:
                  content: Label removed
                  status: info
        - id: issue_label_auth
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: authentication
            color: geekblue
            closable: true
          events:
            onClose:
              - id: issue_remove_auth_label
                type: DisplayMessage
                params:
                  content: Label removed
                  status: info
    - id: issue_actions_row
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: issue_assign_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Assign
            icon: AiOutlineUser
            color: default
            variant: outlined
            size: small
          events:
            onClick:
              - id: issue_assign_msg
                type: DisplayMessage
                params:
                  content: Assignee updated
                  status: success
        - id: issue_resolve_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Resolve
            icon: AiOutlineCheck
            color: primary
            variant: solid
            size: small
          events:
            onClick:
              - id: issue_resolve_msg
                type: DisplayMessage
                params:
                  content: Issue marked as resolved
                  status: success
```

Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Bluetooth 5.3 connectivity.

**$249.99**

```yaml
- id: catalog_card
  type: Card
  properties:
    title: Wireless Noise-Cancelling Headphones
    size: small
  blocks:
    - id: catalog_tags_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: catalog_new
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: NEW
            color: "#52c41a"
          style:
            .element:
              fontWeight: bold
              letterSpacing: 1px
        - id: catalog_category
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: Electronics
            icon: AiOutlineThunderbolt
            color: blue
          events:
            onClick:
              - id: catalog_cat_click
                type: Link
                params:
                  pageId: introduction
        - id: catalog_stock
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: In Stock
            icon: AiOutlineCheck
            color: success
        - id: catalog_rating
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: 4.8 Stars
            icon: AiOutlineStar
            color: gold
    - id: catalog_description
      type: Markdown
      properties:
        content: Premium over-ear headphones with active noise cancellation, 30-hour
          battery life, and Bluetooth 5.3 connectivity.
    - id: catalog_price_row
      type: Box
      layout:
        gap: 8
        align: center
      blocks:
        - id: catalog_price
          type: Markdown
          layout:
            flex: 0 0 auto
          properties:
            content: "**$249.99**"
        - id: catalog_discount
          type: Tag
          layout:
            flex: 0 0 auto
          properties:
            title: 20% OFF
            color: red
          style:
            .element:
              fontWeight: bold
        - id: catalog_add_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Add to Cart
            icon: AiOutlineShoppingCart
            color: primary
            variant: solid
            size: small
          events:
            onClick:
              - id: catalog_add_msg
                type: DisplayMessage
                params:
                  content: Added to cart!
                  status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `closable` | boolean | `false` | Allow tag to be closed. |
| `color` | string | - | Color of the Tag. Preset options are success, processing, error, warning, default, blue, cyan, geekblue, gold, green, lime, magenta, orange, purple, red, volcano, or alternatively any hex color. |
| `title` | string | - | Content title of tag - supports html. |
| `icon` | string \| object | - | Name of an Ant Design Icon or properties of an Icon block to customize alert icon. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design tag tokens](https://ant.design/components/tag#design-token). |
| `theme.defaultBg` | string | `"#fafafa"` | Default background color of the tag. |
| `theme.defaultColor` | string | `"rgba(0, 0, 0, 0.88)"` | Default text color of the tag. |
| `theme.solidTextColor` | string | `"#fff"` | Text color for solid (filled) tags, determined by background brightness. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Called when Tag is clicked. Renders a shortcut badge when a shortcut is configured. |
| `onClose` | \- | Called when Tag close icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Tag element. |
| `/icon` | The icon in the Tag. |

No slots defined.
