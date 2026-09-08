# ColorSelector

Color picker with presets, format selection, and alpha channel.

ColorSelector is externally controlled — use an `onMount` event with `SetState` to set an initial color. Without it, the picker starts empty. The other examples on this page are initialized via the page `onInit` event.

```yaml
- id: init_desc
  type: Markdown
  properties:
    content: ColorSelector is externally controlled — use an `onMount` event with
      `SetState` to set an initial color. Without it, the picker starts empty.
      The other examples on this page are initialized via the page `onInit`
      event.
- id: init_empty
  type: ColorSelector
  properties:
    title: Empty Picker
    showText: true
- id: init_with_value
  type: ColorSelector
  properties:
    title: Initialized Picker
    showText: true
  events:
    onMount:
      - id: set_init_with_value
        type: SetState
        params:
          init_with_value: "#1677ff"
```

```yaml
- id: size_small
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    size: small
- id: size_middle
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    size: middle
- id: size_large
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    size: large
```

```yaml
- id: size_text_small
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    size: small
    showText: true
- id: size_text_middle
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    size: middle
    showText: true
- id: size_text_large
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    size: large
    showText: true
```

**Hex format:**

**RGB format:**

**HSB format:**

```yaml
- id: format_hex_label
  type: Markdown
  properties:
    content: "**Hex format:**"
- id: format_hex
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    format: hex
    showText: true
- id: format_rgb_label
  type: Markdown
  properties:
    content: "**RGB format:**"
- id: format_rgb
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    format: rgb
    showText: true
- id: format_hsb_label
  type: Markdown
  properties:
    content: "**HSB format:**"
- id: format_hsb
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    format: hsb
    showText: true
```

```yaml
- id: allow_clear_red
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    allowClear: true
    showText: true
- id: allow_clear_blue
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    allowClear: true
    showText: true
- id: allow_clear_green
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    allowClear: true
    showText: true
```

```yaml
- id: toggle_arrow_hidden
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    arrow: false
    showText: true
- id: toggle_alpha_disabled
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    disabledAlpha: true
    showText: true
- id: toggle_format_disabled
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    disabledFormat: true
    showText: true
- id: toggle_all_disabled
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    arrow: false
    disabledAlpha: true
    disabledFormat: true
    showText: true
```

```yaml
- id: mode_default
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
- id: mode_single
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    mode: single
    showText: true
- id: mode_gradient
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    mode: gradient
    showText: true
```

**Top:**

**Top Left:**

**Top Right:**

**Bottom:**

**Bottom Left:**

```yaml
- id: placement_top_label
  type: Markdown
  properties:
    content: "**Top:**"
- id: placement_top
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    placement: top
- id: placement_topLeft_label
  type: Markdown
  properties:
    content: "**Top Left:**"
- id: placement_topLeft
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    placement: topLeft
- id: placement_topRight_label
  type: Markdown
  properties:
    content: "**Top Right:**"
- id: placement_topRight
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    placement: topRight
- id: placement_bottom_label
  type: Markdown
  properties:
    content: "**Bottom:**"
- id: placement_bottom
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    placement: bottom
- id: placement_bottomLeft_label
  type: Markdown
  properties:
    content: "**Bottom Left:**"
- id: placement_bottomLeft
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    placement: bottomLeft
```

```yaml
- id: presets_brand
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    presets:
      - label: Brand
        colors:
          - "#1677ff"
          - "#13c2c2"
          - "#52c41a"
          - "#faad14"
          - "#f5222d"
          - "#722ed1"
      - label: Neutral
        colors:
          - "#000000"
          - "#333333"
          - "#666666"
          - "#999999"
          - "#cccccc"
          - "#ffffff"
- id: presets_extended
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    presets:
      - label: Red
        colors:
          - "#fff1f0"
          - "#ffa39e"
          - "#ff4d4f"
          - "#cf1322"
          - "#820014"
      - label: Blue
        colors:
          - "#e6f4ff"
          - "#91caff"
          - "#4096ff"
          - "#0958d9"
          - "#002c8c"
      - label: Green
        colors:
          - "#f6ffed"
          - "#b7eb8f"
          - "#52c41a"
          - "#389e0d"
          - "#135200"
      - label: Gold
        colors:
          - "#fffbe6"
          - "#ffe58f"
          - "#faad14"
          - "#d48806"
          - "#874d00"
      - label: Purple
        colors:
          - "#f9f0ff"
          - "#d3adf7"
          - "#722ed1"
          - "#531dab"
          - "#22075e"
- id: presets_status
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    presets:
      - label: Status
        colors:
          - "#52c41a"
          - "#faad14"
          - "#f5222d"
          - "#1677ff"
          - "#722ed1"
          - "#eb2f96"
```

**Click trigger (default):**

**Hover trigger:**

```yaml
- id: trigger_click_label
  type: Markdown
  properties:
    content: "**Click trigger (default):**"
- id: trigger_click
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    trigger: click
    showText: true
- id: trigger_hover_label
  type: Markdown
  properties:
    content: "**Hover trigger:**"
- id: trigger_hover
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    trigger: hover
    showText: true
```

```yaml
- id: disabled_basic
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    disabled: true
- id: disabled_with_text
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    disabled: true
    showText: true
- id: disabled_small
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    disabled: true
    size: small
- id: disabled_large
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    disabled: true
    size: large
```

```yaml
- id: label_basic
  type: ColorSelector
  properties:
    label:
      title: Pick a color
- id: label_inline
  type: ColorSelector
  properties:
    label:
      title: Theme color
      inline: true
    showText: true
- id: label_colon
  type: ColorSelector
  properties:
    label:
      title: Background
      colon: true
    showText: true
- id: label_extra
  type: ColorSelector
  properties:
    label:
      title: Brand primary
      extra: Select your primary brand color
    showText: true
- id: label_disabled
  type: ColorSelector
  properties:
    label:
      title: Disabled picker
      disabled: true
    disabled: true
    showText: true
```

```yaml
- id: style_border
  type: ColorSelector
  layout:
    flex: 0 0 auto
  style:
    .element:
      border: 2px solid
      borderRadius: 8px
  properties:
    showText: true
- id: style_shadow
  type: ColorSelector
  layout:
    flex: 0 0 auto
  style:
    .element:
      boxShadow: 0 2px 8px rgba(0, 0, 0, 0.15)
      borderRadius: 8px
  properties:
    showText: true
- id: style_tailwind
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    class: rounded-lg shadow-sm
- id: style_large_swatch
  type: ColorSelector
  layout:
    flex: 0 0 auto
  style:
    .element:
      transform: scale(1.5)
      transformOrigin: left center
```

**Full-featured picker:**

**Minimal picker:**

**Text with no alpha:**

**Gradient mode with presets:**

```yaml
- id: combined_full_label
  type: Markdown
  properties:
    content: "**Full-featured picker:**"
- id: combined_full
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    format: hex
    allowClear: true
    size: large
    presets:
      - label: Recommended
        colors:
          - "#1677ff"
          - "#52c41a"
          - "#faad14"
          - "#f5222d"
          - "#722ed1"
          - "#13c2c2"
- id: combined_minimal_label
  type: Markdown
  properties:
    content: "**Minimal picker:**"
- id: combined_minimal
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    size: small
    disabledAlpha: true
    disabledFormat: true
    arrow: false
- id: combined_text_no_alpha_label
  type: Markdown
  properties:
    content: "**Text with no alpha:**"
- id: combined_text_no_alpha
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    format: rgb
    disabledAlpha: true
- id: combined_gradient_presets_label
  type: Markdown
  properties:
    content: "**Gradient mode with presets:**"
- id: combined_gradient_presets
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    mode: gradient
    showText: true
    size: large
    presets:
      - label: Gradients
        colors:
          - "#ff4d4f"
          - "#ff7a45"
          - "#ffa940"
          - "#ffc53d"
          - "#ffec3d"
          - "#bae637"
          - "#73d13d"
          - "#36cfc9"
          - "#40a9ff"
          - "#597ef7"
          - "#9254de"
          - "#f759ab"
```

```yaml
- id: multi_row
  type: Box
  layout:
    gap: 12
  blocks:
    - id: multi_primary
      type: ColorSelector
      layout:
        flex: 0 0 auto
    - id: multi_success
      type: ColorSelector
      layout:
        flex: 0 0 auto
    - id: multi_warning
      type: ColorSelector
      layout:
        flex: 0 0 auto
    - id: multi_error
      type: ColorSelector
      layout:
        flex: 0 0 auto
    - id: multi_info
      type: ColorSelector
      layout:
        flex: 0 0 auto
    - id: multi_purple
      type: ColorSelector
      layout:
        flex: 0 0 auto
```

```yaml
- id: theme_large_handler
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    theme:
      colorPickerHandlerSize: 24
      colorPickerSliderHeight: 12
- id: theme_wide_picker
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    theme:
      colorPickerWidth: 300
- id: theme_large_presets
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    theme:
      colorPickerPresetColorSize: 32
    presets:
      - label: Custom
        colors:
          - "#1677ff"
          - "#52c41a"
          - "#faad14"
          - "#f5222d"
          - "#722ed1"
          - "#13c2c2"
- id: theme_custom_border_radius
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    theme:
      borderRadius: 16
- id: theme_combined
  type: ColorSelector
  layout:
    flex: 0 0 auto
  properties:
    showText: true
    size: large
    theme:
      colorPickerWidth: 280
      colorPickerHandlerSize: 20
      colorPickerSliderHeight: 10
      colorPickerPresetColorSize: 28
      borderRadius: 12
```

```yaml
- id: applied_theme_editor_card
  type: Card
  properties:
    title: Brand Theme Settings
  blocks:
    - id: applied_theme_brand_name
      type: TextInput
      properties:
        title: Brand Name
        placeholder: Enter your brand name
    - id: applied_theme_primary_color
      type: ColorSelector
      properties:
        title: Primary Color
        showText: true
        format: hex
        disabledAlpha: true
        label:
          extra: Used for buttons, links, and active elements
        presets:
          - label: Popular
            colors:
              - "#1677ff"
              - "#52c41a"
              - "#faad14"
              - "#f5222d"
              - "#722ed1"
              - "#13c2c2"
      events:
        onMount:
          - id: set_primary_color
            type: SetState
            params:
              applied_theme_primary_color: "#1677ff"
        onChange:
          - id: primary_color_change
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Primary color updated to "
                  - _state: applied_theme_primary_color
              duration: 1
    - id: applied_theme_secondary_color
      type: ColorSelector
      properties:
        title: Secondary Color
        showText: true
        format: hex
        disabledAlpha: true
        label:
          extra: Used for backgrounds and secondary actions
        presets:
          - label: Popular
            colors:
              - "#f0f5ff"
              - "#f6ffed"
              - "#fffbe6"
              - "#fff2f0"
              - "#f9f0ff"
              - "#e6fffb"
      events:
        onMount:
          - id: set_secondary_color
            type: SetState
            params:
              applied_theme_secondary_color: "#f0f5ff"
    - id: applied_theme_save_btn
      type: Button
      properties:
        title: Save Theme
        type: primary
        icon: AiOutlineSave
      events:
        onClick:
          - id: theme_save_action
            type: DisplayMessage
            params:
              content: Brand theme saved successfully
              status: success
          - id: theme_set_global
            type: SetGlobal
            params:
              primaryColor:
                _state: applied_theme_primary_color
              secondaryColor:
                _state: applied_theme_secondary_color
```

```yaml
- id: applied_product_card
  type: Card
  properties:
    title: Customize Your Product
  blocks:
    - id: applied_product_name
      type: TextInput
      properties:
        title: Product Name
        placeholder: e.g. Custom T-Shirt
    - id: applied_product_body_color
      type: ColorSelector
      properties:
        title: Body Color
        showText: true
        size: large
        disabledAlpha: true
        presets:
          - label: Available Colors
            colors:
              - "#ffffff"
              - "#000000"
              - "#1a3c6e"
              - "#8b0000"
              - "#2e8b57"
              - "#daa520"
      events:
        onMount:
          - id: set_body_color
            type: SetState
            params:
              applied_product_body_color: "#1a3c6e"
        onChange:
          - id: body_color_change
            type: SetState
            params:
              product_body_color:
                _state: applied_product_body_color
    - id: applied_product_accent_color
      type: ColorSelector
      properties:
        title: Accent Color
        showText: true
        size: large
        disabledAlpha: true
        presets:
          - label: Available Colors
            colors:
              - "#ff4d4f"
              - "#ff7a45"
              - "#ffc53d"
              - "#52c41a"
              - "#1677ff"
              - "#722ed1"
      events:
        onMount:
          - id: set_accent_color
            type: SetState
            params:
              applied_product_accent_color: "#ff4d4f"
    - id: applied_product_quantity
      type: NumberInput
      properties:
        title: Quantity
        min: 1
        max: 100
    - id: applied_product_add_to_cart
      type: Button
      properties:
        title: Add to Cart
        type: primary
        icon: AiOutlineShoppingCart
      events:
        onClick:
          - id: add_to_cart_action
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Added to cart with body color "
                  - _state: applied_product_body_color
                  - " and accent color "
                  - _state: applied_product_accent_color
              status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | string | - | Color format. Enum: `rgb`, `hex`, `hsb`. |
| `showText` | boolean | - | Show color text. |
| `size` | string | - | Size of the color picker. Enum: `small`, `middle`, `large`. |
| `disabled` | boolean | `false` | Disable the color picker. |
| `allowClear` | boolean | `false` | Allow the user to clear their input. |
| `arrow` | boolean | `true` | Show arrow on the color picker popup. |
| `disabledAlpha` | boolean | `false` | Disable the alpha channel slider. |
| `disabledFormat` | boolean | `false` | Disable the format selector. |
| `mode` | string | `"single"` | Color picker mode. Enum: `single`, `gradient`. |
| `open` | boolean | - | Controlled open state of the color picker popup. |
| `placement` | string | - | Placement of the color picker popup. Enum: `top`, `topLeft`, `topRight`, `bottom`, `bottomLeft`, `bottomRight`, `left`, `leftTop`, `leftBottom`, `right`, `rightTop`, `rightBottom`. |
| `presets` | array | - | Preset color palettes. |
| `trigger` | string | `"click"` | Trigger mode for the color picker popup. Enum: `hover`, `click`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design color-picker tokens](https://ant.design/components/color-picker#design-token). |
| `theme.colorPickerWidth` | number | `234` | Width of the color picker panel. |
| `theme.colorPickerHandlerSize` | number | `16` | Size of the color picker handler (drag handle). |
| `theme.colorPickerHandlerSizeSM` | number | `12` | Size of the color picker handler for small size. |
| `theme.colorPickerSliderHeight` | number | `8` | Height of the color slider bar. |
| `theme.colorPickerPreviewSize` | number | - | Size of the color preview circle. Defaults to a calculated value based on slider height. |
| `theme.colorPickerAlphaInputWidth` | number | `44` | Width of the alpha input field. |
| `theme.colorPickerInputNumberHandleWidth` | number | `16` | Width of the input number handle in the color picker. |
| `theme.colorPickerPresetColorSize` | number | `24` | Size of preset color swatches. |
| `theme.colorPickerInsetShadow` | string | - | Inset shadow style for the color picker. |
| `theme.borderRadius` | number | `6` | Border radius of the color picker trigger. |
| `theme.colorPrimary` | string | - | Primary color used in the color picker panel. |
| `theme.colorText` | string | - | Text color in the color picker panel. |
| `theme.colorBgElevated` | string | - | Background color for the elevated popup panel. |
| `theme.fontSize` | number | `14` | Font size for text in the color picker. |
| `theme.lineWidth` | number | `1` | Border width. |
| `theme.controlHeight` | number | `32` | Height of the color picker trigger. |
| `theme.controlHeightLG` | number | `40` | Height of the color picker trigger for large size. |
| `theme.controlHeightSM` | number | `24` | Height of the color picker trigger for small size. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value }` | Trigger actions when the color is changed. |
| `onChangeComplete` | `{ value }` | Trigger actions when the color change is complete. |
| `onClear` | \- | Trigger actions when the color is cleared. |
| `onFormatChange` | `{ format }` | Trigger actions when the color format is changed. |
| `onOpenChange` | `{ open }` | Trigger actions when the color picker popup open state changes. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The ColorSelector element. |
| `/label` | The ColorSelector label. |
| `/extra` | The ColorSelector extra content. |
| `/feedback` | The ColorSelector validation feedback. |

No slots defined.
