# Button

Button with colors, variants, sizes, shapes, icons, ghost, and block modes.

```yaml
- id: variant_solid
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: solid
    color: primary
    variant: solid
- id: variant_outlined
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: outlined
    color: primary
    variant: outlined
- id: variant_dashed
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: dashed
    color: primary
    variant: dashed
- id: variant_filled
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: filled
    color: primary
    variant: filled
- id: variant_text
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: text
    color: primary
    variant: text
- id: variant_link
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: link
    color: primary
    variant: link
```

```yaml
- id: colors_preset_row
  type: Box
  layout:
    gap: 6
    justify: flex-start
  blocks:
    - id: color_primary
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: primary
        color: primary
        variant: solid
        size: small
    - id: color_danger
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: danger
        color: danger
        variant: solid
        size: small
    - id: color_blue
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: blue
        color: blue
        variant: solid
        size: small
    - id: color_green
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: green
        color: green
        variant: solid
        size: small
    - id: color_purple
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: purple
        color: purple
        variant: solid
        size: small
- id: colors_hex_row
  type: Box
  layout:
    gap: 6
    justify: flex-start
  blocks:
    - id: hex_coral
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: "#ff6b6b"
        color: "#ff6b6b"
        variant: solid
        size: small
    - id: hex_teal
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: "#20c997"
        color: "#20c997"
        variant: solid
        size: small
    - id: hex_indigo
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: "#4c6ef5"
        color: "#4c6ef5"
        variant: solid
        size: small
- id: colors_outlined_row
  type: Box
  layout:
    gap: 6
    justify: flex-start
  blocks:
    - id: co_primary
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: primary
        color: primary
        variant: outlined
        size: small
    - id: co_danger
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: danger
        color: danger
        variant: outlined
        size: small
    - id: co_hex_pink
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: "#e64980"
        color: "#e64980"
        variant: outlined
        size: small
```

```yaml
- id: size_small
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Small
    size: small
    color: primary
    variant: solid
- id: size_default
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Default
    color: primary
    variant: solid
- id: size_large
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Large
    size: large
    color: primary
    variant: solid
```

```yaml
- id: shape_square
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Square (default)
    color: primary
    variant: solid
- id: shape_round
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Round
    shape: round
    color: primary
    variant: solid
- id: shape_circle
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    icon: AiOutlineSearch
    shape: circle
    color: primary
    variant: solid
    hideTitle: true
- id: shape_circle_outlined
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    icon: AiOutlinePlus
    shape: circle
    color: primary
    variant: outlined
    hideTitle: true
```

```yaml
- id: icon_download
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Download
    icon: AiOutlineDownload
    color: primary
    variant: solid
- id: icon_search
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Search
    icon: AiOutlineSearch
    color: primary
    variant: outlined
- id: icon_delete
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Delete
    icon: AiOutlineDelete
    color: danger
    variant: solid
- id: icon_only
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    icon: AiOutlineStar
    color: gold
    variant: filled
    hideTitle: true
- id: icon_custom
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Custom
    icon:
      name: AiOutlineThunderbolt
      color: "#faad14"
    color: primary
    variant: outlined
```

```yaml
- id: ghost_bg
  type: Box
  class: bg-gradient-to-br from-teal-300 to-purple-400 p-4 rounded-lg
  layout:
    gap: 8
  blocks:
    - id: ghost_primary
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Primary
        ghost: true
        color: primary
        variant: solid
    - id: ghost_default
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Default
        ghost: true
        color: default
        variant: solid
    - id: ghost_danger
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Danger
        ghost: true
        color: danger
        variant: solid
```

```yaml
- id: block_primary
  type: Button
  properties:
    title: Full Width Primary
    block: true
    color: primary
    variant: solid
    icon: AiOutlineArrowRight
- id: block_outlined
  type: Button
  properties:
    title: Full Width Outlined
    block: true
    color: primary
    variant: outlined
- id: block_danger
  type: Button
  properties:
    title: Full Width Danger
    block: true
    color: danger
    variant: solid
    icon: AiOutlineWarning
```

```yaml
- id: dis_solid
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Solid
    disabled: true
    color: primary
    variant: solid
- id: dis_outlined
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Outlined
    disabled: true
    color: primary
    variant: outlined
- id: dis_text
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Text
    disabled: true
    color: primary
    variant: text
```

```yaml
- id: href_link
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Visit Lowdefy
    href: https://lowdefy.com
    color: primary
    variant: link
- id: href_solid
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Go to Docs
    href: https://docs.lowdefy.com
    color: primary
    variant: solid
    icon: AiOutlineLink
- id: href_text
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Learn more
    href: https://lowdefy.com
    color: default
    variant: text
```

```yaml
- id: html_bold
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: <b>Bold</b> text
    color: primary
    variant: solid
- id: html_emoji
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Launch &#x1F680;
    color: purple
    variant: solid
- id: html_styled
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: '<span style="letter-spacing: 2px">SUBMIT</span>'
    color: green
    variant: solid
```

```yaml
- id: shortcut_save
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Save
    icon: AiOutlineSave
    color: primary
    variant: solid
  events:
    onClick:
      shortcut: mod+shift+s
      try:
        - id: save_msg
          type: DisplayMessage
          params:
            content: Saved!
            status: success
- id: shortcut_new
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: New Item
    icon: AiOutlinePlus
    color: primary
    variant: outlined
  events:
    onClick:
      shortcut: alt+n
      try:
        - id: new_msg
          type: DisplayMessage
          params:
            content: Creating new item...
            status: info
- id: shortcut_delete
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Delete
    icon: AiOutlineDelete
    color: danger
    variant: solid
  events:
    onClick:
      shortcut: mod+shift+d
      try:
        - id: delete_msg
          type: DisplayMessage
          params:
            content: Item deleted
            status: warning
```

```yaml
- id: css_shadow
  type: Button
  layout:
    flex: 0 0 auto
  class: shadow-lg
  properties:
    title: Shadow
    color: primary
    variant: solid
- id: css_rounded
  type: Button
  layout:
    flex: 0 0 auto
  class: rounded-full
  properties:
    title: Rounded Full
    color: purple
    variant: solid
- id: css_gradient_bg
  type: Box
  class: bg-gradient-to-r from-slate-900 to-slate-700 p-4 rounded-lg
  layout:
    gap: 8
  blocks:
    - id: css_on_dark_solid
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: On Dark
        color: primary
        variant: solid
    - id: css_on_dark_ghost
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Ghost
        ghost: true
        color: primary
        variant: outlined
```

```yaml
- id: theme_radius
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Large Radius
    color: primary
    variant: solid
    theme:
      borderRadius: 20
- id: theme_font
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Large Font
    color: primary
    variant: solid
    theme:
      fontSize: 18
- id: theme_pill
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Pill Button
    color: green
    variant: solid
    size: large
    theme:
      borderRadius: 40
      controlHeight: 48
```

```yaml
- id: contact_card
  type: Card
  properties:
    title: Contact Us
    size: small
  blocks:
    - id: contact_name
      type: TextInput
      required: true
      properties:
        label:
          title: Name
        placeholder: Your full name
    - id: contact_email
      type: TextInput
      required: true
      properties:
        label:
          title: Email
        placeholder: you@example.com
    - id: contact_message
      type: TextArea
      required: true
      properties:
        label:
          title: Message
        placeholder: How can we help?
        rows: 4
    - id: contact_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: contact_cancel
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Cancel
            color: default
            variant: outlined
          events:
            onClick:
              - id: cancel_reset
                type: ResetValidation
              - id: cancel_msg
                type: DisplayMessage
                params:
                  content: Form cleared
                  status: info
        - id: contact_submit
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Send Message
            color: primary
            variant: solid
            icon: AiOutlineSend
          events:
            onClick:
              - id: submit_validate
                type: Validate
                params:
                  - contact_name
                  - contact_email
                  - contact_message
              - id: submit_msg
                type: DisplayMessage
                params:
                  content: Message sent successfully!
                  status: success
```

```yaml
- id: confirm_card
  type: Card
  blocks:
    - id: confirm_result
      type: Result
      properties:
        status: warning
        title: Delete Project?
        subTitle: This action cannot be undone. All files, settings, and deployment
          history will be permanently removed.
    - id: confirm_actions
      type: Box
      layout:
        gap: 8
        justify: center
      blocks:
        - id: confirm_keep
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Keep Project
            color: default
            variant: outlined
          events:
            onClick:
              - id: keep_msg
                type: DisplayMessage
                params:
                  content: Project kept. No changes made.
                  status: info
        - id: confirm_delete
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Delete Permanently
            color: danger
            variant: solid
            icon: AiOutlineDelete
          events:
            onClick:
              - id: delete_msg
                type: DisplayMessage
                params:
                  content: Project deleted.
                  status: success
              - id: delete_nav
                type: Link
                params:
                  pageId: introduction
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `block` | boolean | `false` | Fit the button's span to its parent container span. |
| `color` | string | - | Button color. Preset values: default, primary, danger, blue, purple, cyan, green, magenta, pink, red, orange, yellow, volcano, geekblue, lime, gold. Also accepts custom hex color strings. |
| `danger` | boolean | `false` | Set button style to danger. |
| `disabled` | boolean | `false` | Disable the button if true. |
| `ghost` | boolean | `false` | Make the button's background transparent when true. |
| `hideTitle` | boolean | `false` | Hide the button's title. |
| `href` | string | - | The URL to redirect to when the button is clicked. Useful when used with a type link button. |
| `icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to use icon in button. |
| `shape` | string | `"square"` | Shape of the button. Enum: `circle`, `round`, `square`. |
| `iconPosition` | string | `"start"` | Position of the icon relative to the button title. Enum: `start`, `end`. |
| `size` | string | `"default"` | Size of the button. Enum: `small`, `middle`, `default`, `large`. |
| `title` | string | - | Title text on the button - supports html. |
| `type` | string | `"primary"` | Deprecated - use color and variant instead. The button type. Enum: `primary`, `default`, `dashed`, `link`, `text`. |
| `variant` | string | - | Button visual variant. When set, takes precedence over type. Enum: `solid`, `outlined`, `dashed`, `filled`, `text`, `link`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design button tokens](https://ant.design/components/button#design-token). |
| `theme.borderRadius` | number | `6` | Border radius of the button. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large buttons. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small buttons. |
| `theme.controlHeight` | number | `32` | Height of the button. |
| `theme.controlHeightLG` | number | `40` | Height for large buttons. |
| `theme.controlHeightSM` | number | `24` | Height for small buttons. |
| `theme.fontSize` | number | `14` | Font size. |
| `theme.fontSizeLG` | number | `16` | Font size for large buttons. |
| `theme.fontSizeSM` | number | `14` | Font size for small buttons. |
| `theme.lineWidth` | number | `1` | Border width. |
| `theme.paddingInline` | number | `15` | Horizontal padding. |
| `theme.paddingInlineLG` | number | `15` | Horizontal padding for large buttons. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for small buttons. |
| `theme.paddingBlock` | number | `0` | Vertical padding. |
| `theme.colorPrimary` | string | - | Primary color override. |
| `theme.colorPrimaryHover` | string | - | Primary hover color. |
| `theme.colorPrimaryActive` | string | - | Primary active color. |
| `theme.colorBgContainer` | string | - | Background color for default buttons. |
| `theme.colorText` | string | - | Text color for default buttons. |
| `theme.colorBorder` | string | - | Border color for outlined and dashed buttons. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Trigger action when button is clicked. Renders a shortcut badge when a shortcut is configured. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Button element. |
| `/icon` | The icon in the Button. |

No slots defined.
