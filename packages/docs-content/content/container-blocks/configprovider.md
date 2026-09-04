# ConfigProvider

Global configuration provider for antd theme and locale settings.

```yaml
- id: cp_primary_color
  type: ConfigProvider
  properties:
    token:
      colorPrimary: "#722ed1"
  blocks:
    - id: cp_primary_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_primary_btn_solid
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Solid
            color: primary
            variant: solid
        - id: cp_primary_btn_outlined
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Outlined
            color: primary
            variant: outlined
        - id: cp_primary_btn_dashed
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Dashed
            color: primary
            variant: dashed
        - id: cp_primary_btn_text
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Text
            color: primary
            variant: text
        - id: cp_primary_btn_link
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Link
            color: primary
            variant: link
    - id: cp_primary_switch
      type: Switch
      properties:
        label:
          title: Purple themed switch
          colon: false
    - id: cp_primary_progress
      type: Progress
      properties:
        percent: 65
```

Dark Mode

The dark algorithm inverts the color scheme for all child components. Backgrounds become dark and text becomes light automatically.

```yaml
- id: cp_dark
  type: ConfigProvider
  properties:
    algorithm: dark
  blocks:
    - id: cp_dark_box
      type: Box
      style:
        padding: 24px
        background: "#141414"
        borderRadius: 8px
      layout:
        gap: 12
      blocks:
        - id: cp_dark_title
          type: Title
          properties:
            content: Dark Mode
            level: 4
        - id: cp_dark_text
          type: Paragraph
          properties:
            content: The dark algorithm inverts the color scheme for all child components.
              Backgrounds become dark and text becomes light automatically.
        - id: cp_dark_btn_row
          type: Box
          layout:
            gap: 8
          blocks:
            - id: cp_dark_btn1
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Primary
                color: primary
                variant: solid
            - id: cp_dark_btn2
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Default
                color: default
                variant: outlined
            - id: cp_dark_btn3
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Danger
                color: danger
                variant: solid
        - id: cp_dark_switch
          type: Switch
          properties:
            label:
              title: Dark switch
              colon: false
```

The compact algorithm reduces padding and margins for denser layouts. Useful for data-heavy dashboards and admin panels.

```yaml
- id: cp_compact
  type: ConfigProvider
  properties:
    algorithm: compact
  blocks:
    - id: cp_compact_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_compact_btn1
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Compact Solid
            color: primary
            variant: solid
        - id: cp_compact_btn2
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Compact Outlined
            color: primary
            variant: outlined
    - id: cp_compact_input
      type: TextInput
      properties:
        label:
          title: Compact input
          colon: false
        placeholder: Compact sized input
    - id: cp_compact_text
      type: Paragraph
      properties:
        content: The compact algorithm reduces padding and margins for denser layouts.
          Useful for data-heavy dashboards and admin panels.
```

Dark + Compact

Multiple algorithms can be combined by passing an array. Here dark and compact are used together for a dense dark-themed layout.

```yaml
- id: cp_combined
  type: ConfigProvider
  properties:
    algorithm:
      - dark
      - compact
  blocks:
    - id: cp_combined_box
      type: Box
      style:
        padding: 24px
        background: "#141414"
        borderRadius: 8px
      layout:
        gap: 12
      blocks:
        - id: cp_combined_title
          type: Title
          properties:
            content: Dark + Compact
            level: 4
        - id: cp_combined_text
          type: Paragraph
          properties:
            content: Multiple algorithms can be combined by passing an array. Here dark and
              compact are used together for a dense dark-themed layout.
        - id: cp_combined_btn_row
          type: Box
          layout:
            gap: 8
          blocks:
            - id: cp_combined_btn1
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Action
                color: primary
                variant: solid
            - id: cp_combined_btn2
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Cancel
                color: default
                variant: outlined
```

**Small:**

**Middle (default):**

**Large:**

```yaml
- id: cp_size_small_label
  type: Markdown
  properties:
    content: "**Small:**"
- id: cp_size_small
  type: ConfigProvider
  properties:
    componentSize: small
  blocks:
    - id: cp_small_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_small_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Small Button
            color: primary
            variant: solid
        - id: cp_small_input
          type: TextInput
          layout:
            flex: 0 1 200px
          properties:
            placeholder: Small input
            label:
              disabled: true
- id: cp_size_middle_label
  type: Markdown
  properties:
    content: "**Middle (default):**"
- id: cp_size_middle
  type: ConfigProvider
  properties:
    componentSize: middle
  blocks:
    - id: cp_middle_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_middle_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Middle Button
            color: primary
            variant: solid
        - id: cp_middle_input
          type: TextInput
          layout:
            flex: 0 1 200px
          properties:
            placeholder: Middle input
            label:
              disabled: true
- id: cp_size_large_label
  type: Markdown
  properties:
    content: "**Large:**"
- id: cp_size_large
  type: ConfigProvider
  properties:
    componentSize: large
  blocks:
    - id: cp_large_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_large_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Large Button
            color: primary
            variant: solid
        - id: cp_large_input
          type: TextInput
          layout:
            flex: 0 1 200px
          properties:
            placeholder: Large input
            label:
              disabled: true
```

Setting componentDisabled to true disables all interactive child components at once, without needing to set disabled on each individual component.

```yaml
- id: cp_disabled
  type: ConfigProvider
  properties:
    componentDisabled: true
  blocks:
    - id: cp_disabled_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_disabled_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Disabled Button
            color: primary
            variant: solid
        - id: cp_disabled_btn2
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Also Disabled
            color: default
            variant: outlined
    - id: cp_disabled_switch
      type: Switch
      properties:
        label:
          title: Disabled switch
          colon: false
    - id: cp_disabled_input
      type: TextInput
      properties:
        placeholder: Disabled input
        label:
          title: Disabled input
          colon: false
    - id: cp_disabled_text
      type: Paragraph
      properties:
        content: Setting componentDisabled to true disables all interactive child
          components at once, without needing to set disabled on each individual
          component.
```

Setting direction to rtl enables right-to-left layout for all child components. This is essential for languages like Arabic and Hebrew.

```yaml
- id: cp_rtl
  type: ConfigProvider
  properties:
    direction: rtl
  blocks:
    - id: cp_rtl_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_rtl_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Right-to-Left
            color: primary
            variant: solid
            icon: AiOutlineArrowLeft
    - id: cp_rtl_input
      type: TextInput
      properties:
        placeholder: RTL text input
        label:
          title: RTL Input
          colon: false
    - id: cp_rtl_text
      type: Paragraph
      properties:
        content: Setting direction to rtl enables right-to-left layout for all child
          components. This is essential for languages like Arabic and Hebrew.
```

**Outlined (default):**

**Filled:**

**Borderless:**

**Underlined:**

```yaml
- id: cp_variant_outlined_label
  type: Markdown
  properties:
    content: "**Outlined (default):**"
- id: cp_variant_outlined
  type: ConfigProvider
  properties:
    variant: outlined
  blocks:
    - id: cp_vo_input
      type: TextInput
      properties:
        placeholder: Outlined input
        label:
          title: Name
          colon: false
- id: cp_variant_filled_label
  type: Markdown
  properties:
    content: "**Filled:**"
- id: cp_variant_filled
  type: ConfigProvider
  properties:
    variant: filled
  blocks:
    - id: cp_vf_input
      type: TextInput
      properties:
        placeholder: Filled input
        label:
          title: Name
          colon: false
- id: cp_variant_borderless_label
  type: Markdown
  properties:
    content: "**Borderless:**"
- id: cp_variant_borderless
  type: ConfigProvider
  properties:
    variant: borderless
  blocks:
    - id: cp_vb_input
      type: TextInput
      properties:
        placeholder: Borderless input
        label:
          title: Name
          colon: false
- id: cp_variant_underlined_label
  type: Markdown
  properties:
    content: "**Underlined:**"
- id: cp_variant_underlined
  type: ConfigProvider
  properties:
    variant: underlined
  blocks:
    - id: cp_vu_input
      type: TextInput
      properties:
        placeholder: Underlined input
        label:
          title: Name
          colon: false
```

The components property allows overriding design tokens at the component level. Here, Button and Input components have custom borderRadius applied without affecting other components.

```yaml
- id: cp_components
  type: ConfigProvider
  properties:
    components:
      Button:
        borderRadius: 20
        controlHeight: 40
      Input:
        borderRadius: 20
  blocks:
    - id: cp_components_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_comp_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Pill Button
            color: primary
            variant: solid
        - id: cp_comp_btn2
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Also Pill
            color: default
            variant: outlined
    - id: cp_comp_input
      type: TextInput
      properties:
        placeholder: Rounded input
        label:
          title: Rounded input
          colon: false
    - id: cp_comp_text
      type: Paragraph
      properties:
        content: The components property allows overriding design tokens at the
          component level. Here, Button and Input components have custom
          borderRadius applied without affecting other components.
```

Global design tokens customize the look of all child components. This section uses a custom primary color (orange), larger font size, rounded borders, and a warm background color.

```yaml
- id: cp_tokens
  type: ConfigProvider
  properties:
    token:
      colorPrimary: "#fa541c"
      fontSize: 16
      borderRadius: 8
  blocks:
    - id: cp_tokens_card
      type: Card
      properties:
        title: Custom Themed Card
      blocks:
        - id: cp_tokens_text
          type: Paragraph
          properties:
            content: Global design tokens customize the look of all child components. This
              section uses a custom primary color (orange), larger font size,
              rounded borders, and a warm background color.
        - id: cp_tokens_btn_row
          type: Box
          layout:
            gap: 8
          blocks:
            - id: cp_tokens_btn1
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Primary
                color: primary
                variant: solid
            - id: cp_tokens_btn2
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Outlined
                color: primary
                variant: outlined
        - id: cp_tokens_input
          type: TextInput
          properties:
            placeholder: Themed input
            label:
              title: Themed Input
              colon: false
```

Styled Wrapper

Tailwind CSS classes can be applied to the ConfigProvider wrapper div using the class property. Here a gradient background with rounded corners wraps all themed children.

Elevated Section

A ConfigProvider with shadow and padding classes creates a visually distinct themed section on the page.

```yaml
- id: cp_styled_gradient
  type: ConfigProvider
  class: bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border
    border-border
  properties:
    token:
      colorPrimary: "#6366f1"
  blocks:
    - id: cp_styled_gradient_title
      type: Title
      properties:
        content: Styled Wrapper
        level: 4
    - id: cp_styled_gradient_text
      type: Paragraph
      properties:
        content: Tailwind CSS classes can be applied to the ConfigProvider wrapper div
          using the class property. Here a gradient background with rounded
          corners wraps all themed children.
    - id: cp_styled_gradient_row
      type: Box
      layout:
        gap: 8
      blocks:
        - id: cp_styled_gradient_btn1
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Indigo Action
            color: primary
            variant: solid
        - id: cp_styled_gradient_btn2
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Cancel
            color: default
            variant: outlined
- id: cp_styled_shadow
  type: ConfigProvider
  class: shadow-lg p-8 rounded-2xl bg-bg-container
  properties:
    token:
      colorPrimary: "#059669"
  blocks:
    - id: cp_styled_shadow_title
      type: Title
      properties:
        content: Elevated Section
        level: 4
    - id: cp_styled_shadow_text
      type: Paragraph
      properties:
        content: A ConfigProvider with shadow and padding classes creates a visually
          distinct themed section on the page.
    - id: cp_styled_shadow_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Confirm
        color: primary
        variant: solid
```

Acme Commerce

This demonstrates using ConfigProvider to apply a brand theme across an entire section. The rose primary color, pill-shaped buttons, and custom font size create a cohesive brand identity for all child components.

```yaml
- id: cp_brand_wrapper
  type: ConfigProvider
  properties:
    token:
      colorPrimary: "#e11d48"
      colorInfo: "#0ea5e9"
      borderRadius: 6
      fontSize: 14
    components:
      Button:
        borderRadius: 20
  blocks:
    - id: cp_brand_header
      type: Box
      class: bg-bg-layout p-6 rounded-lg border border-border
      layout:
        gap: 16
      blocks:
        - id: cp_brand_title_row
          type: Box
          layout:
            gap: 12
            align: center
          blocks:
            - id: cp_brand_avatar
              type: Avatar
              layout:
                flex: 0 0 auto
              properties:
                icon: AiOutlineShop
                size: 48
                color: "#e11d48"
            - id: cp_brand_title
              type: Title
              layout:
                flex: 1 1 0
              properties:
                content: Acme Commerce
                level: 3
        - id: cp_brand_description
          type: Paragraph
          properties:
            content: This demonstrates using ConfigProvider to apply a brand theme across an
              entire section. The rose primary color, pill-shaped buttons, and
              custom font size create a cohesive brand identity for all child
              components.
        - id: cp_brand_form_row
          type: Box
          layout:
            gap: 12
          blocks:
            - id: cp_brand_search_input
              type: TextInput
              layout:
                flex: 1 1 0
              properties:
                placeholder: Search products...
                label:
                  disabled: true
                suffixIcon: AiOutlineSearch
            - id: cp_brand_search_btn
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Search
                color: primary
                variant: solid
            - id: cp_brand_cart_btn
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Cart
                icon: AiOutlineShoppingCart
                color: default
                variant: outlined
        - id: cp_brand_stats_row
          type: Box
          layout:
            gap: 16
          blocks:
            - id: cp_brand_stat1
              type: Statistic
              layout:
                flex: 1 1 0
              properties:
                title: Products
                value: 1240
            - id: cp_brand_stat2
              type: Statistic
              layout:
                flex: 1 1 0
              properties:
                title: Orders Today
                value: 87
            - id: cp_brand_stat3
              type: Statistic
              layout:
                flex: 1 1 0
              properties:
                title: Revenue
                value: 12480
                prefix: $
```

System Metrics

```yaml
- id: cp_dashboard_wrapper
  type: ConfigProvider
  properties:
    algorithm:
      - compact
    componentSize: small
    token:
      colorPrimary: "#1677ff"
      fontSize: 12
    variant: filled
  blocks:
    - id: cp_dashboard_title
      type: Title
      properties:
        content: System Metrics
        level: 4
    - id: cp_dashboard_cards_row
      type: Box
      layout:
        gap: 12
      blocks:
        - id: cp_dashboard_card1
          type: Card
          layout:
            flex: 1 1 0
          properties:
            title: CPU Usage
            size: small
          blocks:
            - id: cp_dashboard_progress1
              type: Progress
              properties:
                percent: 72
            - id: cp_dashboard_tag1
              type: Tag
              properties:
                title: Normal
                color: success
        - id: cp_dashboard_card2
          type: Card
          layout:
            flex: 1 1 0
          properties:
            title: Memory
            size: small
          blocks:
            - id: cp_dashboard_progress2
              type: Progress
              properties:
                percent: 89
            - id: cp_dashboard_tag2
              type: Tag
              properties:
                title: High
                color: warning
        - id: cp_dashboard_card3
          type: Card
          layout:
            flex: 1 1 0
          properties:
            title: Disk I/O
            size: small
          blocks:
            - id: cp_dashboard_progress3
              type: Progress
              properties:
                percent: 34
            - id: cp_dashboard_tag3
              type: Tag
              properties:
                title: Low
                color: blue
    - id: cp_dashboard_filter_row
      type: Box
      layout:
        gap: 8
        align: center
      blocks:
        - id: cp_dashboard_filter_input
          type: TextInput
          layout:
            flex: 0 1 200px
          properties:
            placeholder: Filter services...
            label:
              disabled: true
        - id: cp_dashboard_selector
          type: Selector
          layout:
            flex: 0 1 150px
          properties:
            placeholder: Region
            label:
              disabled: true
            options:
              - label: US East
                value: us-east
              - label: US West
                value: us-west
              - label: EU West
                value: eu-west
        - id: cp_dashboard_refresh_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Refresh
            icon: AiOutlineReload
            color: primary
            variant: solid
```

Admin Panel

A dark-themed admin panel using ConfigProvider to apply the dark algorithm with a custom purple accent color. All child components inherit the dark color scheme automatically.

```yaml
- id: cp_admin_wrapper
  type: ConfigProvider
  properties:
    algorithm: dark
    token:
      colorPrimary: "#7c3aed"
      borderRadius: 8
  blocks:
    - id: cp_admin_box
      type: Box
      style:
        padding: 24px
        background: "#141414"
        borderRadius: 12px
      layout:
        gap: 16
      blocks:
        - id: cp_admin_header_row
          type: Box
          layout:
            gap: 12
            align: center
          blocks:
            - id: cp_admin_title
              type: Title
              layout:
                flex: 1 1 0
              properties:
                content: Admin Panel
                level: 3
            - id: cp_admin_status_tag
              type: Tag
              layout:
                flex: 0 0 auto
              properties:
                title: Online
                color: success
        - id: cp_admin_desc
          type: Paragraph
          properties:
            content: A dark-themed admin panel using ConfigProvider to apply the dark
              algorithm with a custom purple accent color. All child components
              inherit the dark color scheme automatically.
        - id: cp_admin_form
          type: Box
          layout:
            gap: 12
          blocks:
            - id: cp_admin_name_input
              type: TextInput
              properties:
                placeholder: Enter username
                label:
                  title: Username
                  colon: false
            - id: cp_admin_email_input
              type: TextInput
              properties:
                placeholder: Enter email address
                label:
                  title: Email
                  colon: false
            - id: cp_admin_role_selector
              type: Selector
              properties:
                placeholder: Select role
                label:
                  title: Role
                  colon: false
                options:
                  - label: Administrator
                    value: admin
                  - label: Editor
                    value: editor
                  - label: Viewer
                    value: viewer
        - id: cp_admin_btn_row
          type: Box
          layout:
            gap: 8
          blocks:
            - id: cp_admin_save_btn
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Save User
                icon: AiOutlineSave
                color: primary
                variant: solid
            - id: cp_admin_cancel_btn
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Cancel
                color: default
                variant: outlined
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `algorithm` | string \| array | - | Theme algorithm. Can be "default", "dark", "compact", or an array of these values. |
| `componentDisabled` | boolean | `false` | Set disabled state for all child components. |
| `componentSize` | string | - | Set size for all child components. Enum: `small`, `middle`, `large`. |
| `components` | object | - | Component-level token overrides. Keys are component names, values are token objects. |
| `direction` | string | `"ltr"` | Direction of layout. Enum: `ltr`, `rtl`. |
| `locale` | object | - | Antd locale object to localize built-in component strings (date pickers, pagination, modal, form validation). Pair with the _locale operator and config.i18n to keep the whole subtree in one language. |
| `token` | object | - | Theme token configuration. Customize design tokens like colorPrimary, fontSize, etc. |
| `variant` | string | - | Global input variant style for all child components. Enum: `outlined`, `filled`, `borderless`, `underlined`. |

No events defined.

No CSS keys defined.

| Slot | Description |
| --- | --- |
| `content` | Child blocks wrapped by the ConfigProvider. |
