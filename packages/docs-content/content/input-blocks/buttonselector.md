# ButtonSelector

Radio group styled as toggle buttons.

```yaml
- id: style_solid
  type: ButtonSelector
  properties:
    title: Solid Style (default)
    variant: solid
    options:
      - label: Daily
        value: daily
      - label: Weekly
        value: weekly
      - label: Monthly
        value: monthly
- id: style_outline
  type: ButtonSelector
  properties:
    title: Outline Style
    variant: outlined
    options:
      - label: Daily
        value: daily
      - label: Weekly
        value: weekly
      - label: Monthly
        value: monthly
- id: solid_outline_alignment
  type: ButtonSelector
  properties:
    title: Solid - filled background on selected
    variant: solid
    options:
      - label: Left
        value: left
      - label: Center
        value: center
      - label: Right
        value: right
      - label: Justify
        value: justify
```

```yaml
style_solid:
  _state: style_solid
style_outline:
  _state: style_outline
solid_outline_alignment:
  _state: solid_outline_alignment
```

```yaml
- id: string_options
  type: ButtonSelector
  properties:
    title: Simple String Array
    variant: solid
    options:
      - Red
      - Green
      - Blue
- id: status_options
  type: ButtonSelector
  properties:
    title: Object Options with Labels
    variant: solid
    options:
      - label: Active
        value: active
      - label: Pending
        value: pending
      - label: Archived
        value: archived
- id: html_labels
  type: ButtonSelector
  properties:
    title: HTML in Option Labels
    variant: solid
    options:
      - label: <b>Bold</b>
        value: bold
      - label: <i>Italic</i>
        value: italic
      - label: <u>Underline</u>
        value: underline
- id: html_emoji_labels
  type: ButtonSelector
  properties:
    title: Emoji Labels
    variant: solid
    options:
      - label: "&#x2705; Approved"
        value: approved
      - label: "&#x23F3; Pending"
        value: pending
      - label: "&#x274C; Rejected"
        value: rejected
```

```yaml
string_options:
  _state: string_options
status_options:
  _state: status_options
html_labels:
  _state: html_labels
html_emoji_labels:
  _state: html_emoji_labels
```

```yaml
- id: size_small
  type: ButtonSelector
  properties:
    title: Small
    size: small
    variant: solid
    options:
      - Small
      - Medium
      - Large
- id: size_default
  type: ButtonSelector
  properties:
    title: Default
    variant: solid
    options:
      - Small
      - Medium
      - Large
- id: size_large
  type: ButtonSelector
  properties:
    title: Large
    size: large
    variant: solid
    options:
      - Small
      - Medium
      - Large
```

```yaml
size_small:
  _state: size_small
size_default:
  _state: size_default
size_large:
  _state: size_large
```

```yaml
- id: size_small_outline
  type: ButtonSelector
  properties:
    title: Small Outline
    size: small
    variant: outlined
    options:
      - Option A
      - Option B
      - Option C
- id: size_default_outline
  type: ButtonSelector
  properties:
    title: Default Outline
    variant: outlined
    options:
      - Option A
      - Option B
      - Option C
- id: size_large_outline
  type: ButtonSelector
  properties:
    title: Large Outline
    size: large
    variant: outlined
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
size_small_outline:
  _state: size_small_outline
size_default_outline:
  _state: size_default_outline
size_large_outline:
  _state: size_large_outline
```

```yaml
- id: many_options
  type: ButtonSelector
  properties:
    title: Day of the Week
    variant: solid
    size: small
    options:
      - label: Mon
        value: monday
      - label: Tue
        value: tuesday
      - label: Wed
        value: wednesday
      - label: Thu
        value: thursday
      - label: Fri
        value: friday
      - label: Sat
        value: saturday
      - label: Sun
        value: sunday
- id: two_options
  type: ButtonSelector
  properties:
    title: Toggle
    variant: solid
    options:
      - label: Yes
        value: true
      - label: No
        value: false
```

```yaml
many_options:
  _state: many_options
two_options:
  _state: two_options
```

```yaml
- id: disabled_solid
  type: ButtonSelector
  properties:
    title: Disabled (Solid)
    disabled: true
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: disabled_outline
  type: ButtonSelector
  properties:
    title: Disabled (Outline)
    disabled: true
    variant: outlined
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: disabled_option_solid
  type: ButtonSelector
  properties:
    title: Disabled Individual Option (Solid)
    variant: solid
    options:
      - label: Available
        value: available
      - label: Unavailable
        value: unavailable
        disabled: true
      - label: In Stock
        value: in_stock
- id: disabled_multiple_options
  type: ButtonSelector
  properties:
    title: Multiple Disabled Options
    variant: solid
    options:
      - label: Active
        value: active
      - label: Suspended
        value: suspended
        disabled: true
      - label: Pending
        value: pending
      - label: Terminated
        value: terminated
        disabled: true
```

```yaml
disabled_solid:
  _state: disabled_solid
disabled_outline:
  _state: disabled_outline
disabled_option_solid:
  _state: disabled_option_solid
disabled_multiple_options:
  _state: disabled_multiple_options
```

```yaml
- id: option_styles
  type: ButtonSelector
  properties:
    title: Custom Option Styles
    variant: outlined
    options:
      - label: Normal
        value: normal
      - label: Highlighted
        value: highlighted
        style:
          fontWeight: bold
      - label: Subtle
        value: subtle
        style:
          fontStyle: italic
- id: option_styles_solid
  type: ButtonSelector
  properties:
    title: Styled Solid Options
    variant: solid
    options:
      - label: Default
        value: default
      - label: Emphasized
        value: emphasized
        style:
          fontWeight: bold
          letterSpacing: 1
      - label: Light
        value: light
        style:
          fontStyle: italic
          opacity: 0.8
- id: option_styles_mixed
  type: ButtonSelector
  properties:
    title: Mixed Option Styling
    variant: outlined
    options:
      - label: Regular
        value: regular
      - label: Important
        value: important
        style:
          fontWeight: bold
          textDecoration: underline
      - label: Muted
        value: muted
        style:
          opacity: 0.6
```

```yaml
option_styles:
  _state: option_styles
option_styles_solid:
  _state: option_styles_solid
option_styles_mixed:
  _state: option_styles_mixed
```

```yaml
- id: color_default
  type: ButtonSelector
  properties:
    title: Default Color (primary)
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: color_red
  type: ButtonSelector
  properties:
    title: "Color: red"
    variant: solid
    color: red
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: color_green
  type: ButtonSelector
  properties:
    title: "Color: green"
    variant: solid
    color: green
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: color_purple
  type: ButtonSelector
  properties:
    title: "Color: purple"
    variant: solid
    color: purple
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
```

```yaml
color_default:
  _state: color_default
color_red:
  _state: color_red
color_green:
  _state: color_green
color_purple:
  _state: color_purple
```

```yaml
- id: color_hex_coral
  type: ButtonSelector
  properties:
    title: Coral (#ff6b6b)
    variant: solid
    color: "#ff6b6b"
    options:
      - Low
      - Medium
      - High
- id: color_hex_teal
  type: ButtonSelector
  properties:
    title: Teal (#20c997)
    variant: solid
    color: "#20c997"
    options:
      - Low
      - Medium
      - High
- id: color_hex_indigo
  type: ButtonSelector
  properties:
    title: Indigo (#4c6ef5)
    variant: solid
    color: "#4c6ef5"
    options:
      - Low
      - Medium
      - High
- id: color_hex_light
  type: ButtonSelector
  properties:
    title: Light color (#ffe58f) — text auto-contrasts to black
    variant: solid
    color: "#ffe58f"
    options:
      - Low
      - Medium
      - High
```

```yaml
color_hex_coral:
  _state: color_hex_coral
color_hex_teal:
  _state: color_hex_teal
color_hex_indigo:
  _state: color_hex_indigo
color_hex_light:
  _state: color_hex_light
```

```yaml
- id: color_outline_red
  type: ButtonSelector
  properties:
    title: Red Outline
    variant: outlined
    color: red
    options:
      - Option A
      - Option B
      - Option C
- id: color_outline_green
  type: ButtonSelector
  properties:
    title: Green Outline
    variant: outlined
    color: green
    options:
      - Option A
      - Option B
      - Option C
- id: color_outline_hex
  type: ButtonSelector
  properties:
    title: Custom Hex Outline (#e64980)
    variant: outlined
    color: "#e64980"
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
color_outline_red:
  _state: color_outline_red
color_outline_green:
  _state: color_outline_green
color_outline_hex:
  _state: color_outline_hex
```

```yaml
- id: dark_mode_box
  type: Box
  style:
    background: "#141414"
    padding: 24
    borderRadius: 8
  blocks:
    - id: dark_mode_provider
      type: ConfigProvider
      properties:
        algorithm: dark
      blocks:
        - id: dark_color_solid
          type: ButtonSelector
          properties:
            title: Solid color (dark)
            variant: solid
            color: "#1677ff"
            options:
              - Option A
              - Option B
              - Option C
        - id: dark_color_outline
          type: ButtonSelector
          properties:
            title: Outline color with selected tint (dark)
            variant: outlined
            color: "#1677ff"
            options:
              - Option A
              - Option B
              - Option C
```

```yaml
dark_mode_box:
  _state: dark_mode_box
```

```yaml
- id: label_title
  type: ButtonSelector
  properties:
    title: Default Label
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
- id: label_extra
  type: ButtonSelector
  properties:
    title: With Extra Text
    label:
      extra: Choose your preferred view mode.
    variant: solid
    options:
      - label: Grid
        value: grid
      - label: List
        value: list
      - label: Table
        value: table
- id: label_no_colon
  type: ButtonSelector
  properties:
    title: No Colon
    label:
      colon: false
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
- id: label_inline
  type: ButtonSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 6
    variant: solid
    options:
      - label: Left
        value: left
      - label: Center
        value: center
      - label: Right
        value: right
- id: no_label_solid
  type: ButtonSelector
  properties:
    label:
      disabled: true
    variant: solid
    options:
      - label: Left
        value: left
      - label: Center
        value: center
      - label: Right
        value: right
```

```yaml
label_title:
  _state: label_title
label_extra:
  _state: label_extra
label_no_colon:
  _state: label_no_colon
label_inline:
  _state: label_inline
no_label_solid:
  _state: no_label_solid
```

```yaml
- id: html_title
  type: ButtonSelector
  properties:
    title: <b>Bold Title</b>
    variant: solid
    options:
      - Option A
      - Option B
      - Option C
- id: html_title_colored
  type: ButtonSelector
  properties:
    title: '<span style="color: #1677ff;">Colored Title</span>'
    variant: solid
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
html_title:
  _state: html_title
html_title_colored:
  _state: html_title_colored
```

```yaml
- id: style_custom_width
  type: ButtonSelector
  properties:
    title: Custom Width
    variant: solid
    options:
      - Option A
      - Option B
      - Option C
  style:
    width: 400
```

```yaml
style_custom_width:
  _state: style_custom_width
```

```yaml
- id: class_padding
  type: ButtonSelector
  class: p-4
  properties:
    title: Tailwind Padding
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: class_shadow_rounded
  type: ButtonSelector
  class: shadow-md rounded-lg p-2
  properties:
    title: Shadow and Rounded
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: class_background
  type: ButtonSelector
  class: bg-bg-layout p-3 rounded
  properties:
    title: Background Color
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
```

```yaml
class_padding:
  _state: class_padding
class_shadow_rounded:
  _state: class_shadow_rounded
class_background:
  _state: class_background
```

```yaml
- id: theme_large_radius
  type: ButtonSelector
  properties:
    title: Large Border Radius
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
    theme:
      borderRadius: 20
- id: theme_button_bg
  type: ButtonSelector
  properties:
    title: Custom Button Background
    variant: solid
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
    theme:
      buttonSolidCheckedBg: "#531dab"
      buttonSolidCheckedHoverBg: "#722ed1"
      buttonSolidCheckedActiveBg: "#391085"
- id: theme_button_color
  type: ButtonSelector
  properties:
    title: Custom Button Text Color
    variant: outlined
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
    theme:
      buttonColor: "#531dab"
- id: theme_pill_selector
  type: ButtonSelector
  properties:
    title: Pill Style Selector
    variant: solid
    color: "#7c3aed"
    options:
      - label: Free
        value: free
      - label: Pro
        value: pro
      - label: Enterprise
        value: enterprise
    theme:
      borderRadius: 20
      controlHeight: 40
      fontSize: 15
- id: theme_compact_selector
  type: ButtonSelector
  properties:
    title: Compact Selector
    variant: solid
    size: small
    options:
      - label: XS
        value: xs
      - label: S
        value: s
      - label: M
        value: m
      - label: L
        value: l
      - label: XL
        value: xl
    theme:
      buttonPaddingInline: 6
      borderRadiusSM: 2
```

```yaml
theme_large_radius:
  _state: theme_large_radius
theme_button_bg:
  _state: theme_button_bg
theme_button_color:
  _state: theme_button_color
theme_pill_selector:
  _state: theme_pill_selector
theme_compact_selector:
  _state: theme_compact_selector
```

```yaml
- id: applied_survey_card
  type: Card
  properties:
    title: Customer Satisfaction Survey
  blocks:
    - id: applied_survey_name
      type: TextInput
      properties:
        title: Your Name
        placeholder: Enter your full name
    - id: applied_survey_rating
      type: ButtonSelector
      properties:
        title: How satisfied are you with our service?
        variant: solid
        color: "#1677ff"
        options:
          - label: Very Unsatisfied
            value: 1
          - label: Unsatisfied
            value: 2
          - label: Neutral
            value: 3
          - label: Satisfied
            value: 4
          - label: Very Satisfied
            value: 5
    - id: applied_survey_recommend
      type: ButtonSelector
      properties:
        title: Would you recommend us to a friend?
        variant: solid
        options:
          - label: Definitely
            value: definitely
          - label: Probably
            value: probably
          - label: Not Sure
            value: not_sure
          - label: Unlikely
            value: unlikely
    - id: applied_survey_comments
      type: TextArea
      properties:
        title: Additional Comments
        placeholder: Tell us more about your experience...
    - id: applied_survey_submit
      type: Button
      properties:
        title: Submit Survey
        type: primary
        icon: AiOutlineSend
      events:
        onClick:
          - id: survey_submit_action
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Thank you for your feedback! Rating: "
                  - _state: applied_survey_rating
              status: success
```

```yaml
- id: applied_survey_card
  type: Card
  properties:
    title: Customer Satisfaction Survey
  blocks:
    - id: applied_survey_name
      type: TextInput
      properties:
        title: Your Name
        placeholder: Enter your full name
    - id: applied_survey_rating
      type: ButtonSelector
      properties:
        title: How satisfied are you with our service?
        variant: solid
        color: "#1677ff"
        options:
          - label: Very Unsatisfied
            value: 1
          - label: Unsatisfied
            value: 2
          - label: Neutral
            value: 3
          - label: Satisfied
            value: 4
          - label: Very Satisfied
            value: 5
    - id: applied_survey_recommend
      type: ButtonSelector
      properties:
        title: Would you recommend us to a friend?
        variant: solid
        options:
          - label: Definitely
            value: definitely
          - label: Probably
            value: probably
          - label: Not Sure
            value: not_sure
          - label: Unlikely
            value: unlikely
    - id: applied_survey_comments
      type: TextArea
      properties:
        title: Additional Comments
        placeholder: Tell us more about your experience...
    - id: applied_survey_submit
      type: Button
      properties:
        title: Submit Survey
        type: primary
        icon: AiOutlineSend
      events:
        onClick:
          - id: survey_submit_action
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Thank you for your feedback! Rating: "
                  - _state: applied_survey_rating
              status: success
```

```yaml
applied_survey_card:
  _state: applied_survey_card
```

```yaml
- id: applied_settings_card
  type: Card
  properties:
    title: Display Settings
  blocks:
    - id: applied_settings_theme
      type: ButtonSelector
      properties:
        title: Theme
        variant: solid
        options:
          - label: Light
            value: light
          - label: Dark
            value: dark
          - label: System
            value: system
      events:
        onChange:
          - id: theme_change_action
            type: SetState
            params:
              selected_theme:
                _state: applied_settings_theme
    - id: applied_settings_language
      type: ButtonSelector
      properties:
        title: Language
        variant: outlined
        options:
          - label: English
            value: en
          - label: Spanish
            value: es
          - label: French
            value: fr
          - label: German
            value: de
    - id: applied_settings_font_size
      type: ButtonSelector
      properties:
        title: Font Size
        variant: solid
        size: small
        options:
          - label: Small
            value: small
          - label: Medium
            value: medium
          - label: Large
            value: large
    - id: applied_settings_save
      type: Button
      properties:
        title: Save Settings
        type: primary
        icon: AiOutlineSave
      events:
        onClick:
          - id: settings_save_action
            type: DisplayMessage
            params:
              content: Settings saved successfully
              status: success
          - id: settings_set_global
            type: SetGlobal
            params:
              theme:
                _state: applied_settings_theme
              language:
                _state: applied_settings_language
              fontSize:
                _state: applied_settings_font_size
```

```yaml
- id: applied_settings_card
  type: Card
  properties:
    title: Display Settings
  blocks:
    - id: applied_settings_theme
      type: ButtonSelector
      properties:
        title: Theme
        variant: solid
        options:
          - label: Light
            value: light
          - label: Dark
            value: dark
          - label: System
            value: system
      events:
        onChange:
          - id: theme_change_action
            type: SetState
            params:
              selected_theme:
                _state: applied_settings_theme
    - id: applied_settings_language
      type: ButtonSelector
      properties:
        title: Language
        variant: outlined
        options:
          - label: English
            value: en
          - label: Spanish
            value: es
          - label: French
            value: fr
          - label: German
            value: de
    - id: applied_settings_font_size
      type: ButtonSelector
      properties:
        title: Font Size
        variant: solid
        size: small
        options:
          - label: Small
            value: small
          - label: Medium
            value: medium
          - label: Large
            value: large
    - id: applied_settings_save
      type: Button
      properties:
        title: Save Settings
        type: primary
        icon: AiOutlineSave
      events:
        onClick:
          - id: settings_save_action
            type: DisplayMessage
            params:
              content: Settings saved successfully
              status: success
          - id: settings_set_global
            type: SetGlobal
            params:
              theme:
                _state: applied_settings_theme
              language:
                _state: applied_settings_language
              fontSize:
                _state: applied_settings_font_size
```

```yaml
applied_settings_card:
  _state: applied_settings_card
```

```yaml
- id: per_option_color_outline
  type: ButtonSelector
  properties:
    title: Outline — color per option
    variant: outlined
    options:
      - label: Low
        value: low
        color: "#16a34a"
      - label: Medium
        value: medium
        color: "#d97706"
      - label: High
        value: high
        color: "#dc2626"
- id: per_option_color_solid
  type: ButtonSelector
  properties:
    title: Solid — color per option (selected fills in its own color)
    variant: solid
    options:
      - label: To do
        value: todo
        color: "#64748b"
      - label: Doing
        value: doing
        color: "#2563eb"
      - label: Done
        value: done
        color: "#16a34a"
```

```yaml
per_option_color_outline:
  _state: per_option_color_outline
per_option_color_solid:
  _state: per_option_color_solid
```

```yaml
- id: data_button_selector
  type: ButtonSelector
  properties:
    title: Priority
    data:
      - id: 1
        name: Low
      - id: 2
        name: Medium
      - id: 3
        name: High
    html: "{{ item.name }}"
    valueKey: id
```

```yaml
data_button_selector:
  _state: data_button_selector
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | string | `"solid"` | Visual variant of the selected option button, matching the Button block. Enum: `solid`, `outlined`. |
| `buttonStyle` | string | - | Deprecated — use `variant` (solid \| outlined) instead. Enum: `solid`, `outline`. |
| `color` | string | - | Color applied to the selected button. Fills the background in solid mode (with auto-contrasting text) and the border/text in outline mode. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `options` | array | `[]` | Options can either be an array of primitive values, on an array of label, value pairs - supports html. |
| `options.$.label` | string | - | Value label shown to user - supports html. |
| `options.$.value` | - | - | Option value. Can be of any type. |
| `options.$.disabled` | boolean | `false` | Disable the option if true. |
| `options.$.style` | object | - | Css style to apply to the option. |
| `options.$.color` | string | - | Color applied to this option when it is selected. Falls back to the block-level color when not set. |
| `data` | array | - | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string | - | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string | - | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string | - | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `label` | object | - | Label properties. |
| `label.align` | string | `"left"` | Align label left or right when inline. Enum: `left`, `right`. |
| `label.colon` | boolean | `true` | Append label with colon. |
| `label.extra` | string | - | Extra text to display beneath the content - supports html. |
| `label.title` | string | - | Label title - supports html. |
| `label.tooltip` | string \| object | - | Help tooltip shown via an icon beside the label. A string sets the tooltip text (supports html), or an object to also customize the icon and color. Use the block's onTooltipClick event to respond to clicks on the icon. |
| `label.tooltip.title` | string | - | Tooltip text shown on hover - supports html. |
| `label.tooltip.icon` | string | `"AiOutlineQuestionCircle"` | Name of the icon to show beside the label. |
| `label.tooltip.color` | string | - | Color of the tooltip icon. |
| `label.span` | number | - | Label inline span. |
| `label.disabled` | boolean | `false` | Hide input label. |
| `label.hasFeedback` | boolean | `true` | Display feedback extra from validation, this does not disable validation. |
| `label.inline` | boolean | `false` | Render input and label inline. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design radio tokens](https://ant.design/components/radio#design-token). |
| `theme.radioSize` | number | `16` | Size of the radio dot element. |
| `theme.dotSize` | number | `8` | Size of the inner dot when checked. |
| `theme.dotColorDisabled` | string | - | Color of the inner dot when disabled. |
| `theme.buttonSolidCheckedColor` | string | - | Text color of checked button in solid style. |
| `theme.buttonSolidCheckedBg` | string | - | Background color of checked button in solid style. |
| `theme.buttonSolidCheckedHoverBg` | string | - | Background color of checked button on hover in solid style. |
| `theme.buttonSolidCheckedActiveBg` | string | - | Background color of checked button on active in solid style. |
| `theme.buttonBg` | string | - | Background color of unchecked radio buttons. |
| `theme.buttonCheckedBg` | string | - | Background color of checked button in outline style. |
| `theme.buttonColor` | string | - | Text color of radio buttons. |
| `theme.buttonCheckedBgDisabled` | string | - | Background color of checked button when disabled. |
| `theme.buttonCheckedColorDisabled` | string | - | Text color of checked button when disabled. |
| `theme.buttonPaddingInline` | number | `15` | Horizontal padding inside radio buttons. |
| `theme.wrapperMarginInlineEnd` | number | `8` | Margin at the inline end of each radio wrapper. |
| `theme.radioColor` | string | - | Color of the radio dot when checked. |
| `theme.radioBgColor` | string | - | Background color of the radio circle when checked. |
| `theme.borderRadius` | number | `6` | Border radius for default-sized radio buttons. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large radio buttons. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small radio buttons. |
| `theme.controlHeight` | number | `32` | Height of default-sized radio buttons. |
| `theme.controlHeightLG` | number | `40` | Height of large radio buttons. |
| `theme.controlHeightSM` | number | `24` | Height of small radio buttons. |
| `theme.fontSize` | number | `14` | Font size for default-sized radio buttons. |
| `theme.fontSizeLG` | number | `16` | Font size for large radio buttons. |
| `theme.lineWidth` | number | `1` | Border width of radio buttons. |
| `theme.colorPrimary` | string | - | Primary color used for checked state border and text. |
| `theme.colorPrimaryHover` | string | - | Primary hover color for checked radio buttons. |
| `theme.colorPrimaryActive` | string | - | Primary active color for checked radio buttons. |
| `theme.colorBgContainer` | string | - | Background color for the radio button container. |
| `theme.colorText` | string | - | Default text color for radio buttons. |
| `theme.colorBorder` | string | - | Border color for radio buttons. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The ButtonSelector element. |
| `/label` | The ButtonSelector label. |
| `/extra` | The ButtonSelector extra content. |
| `/feedback` | The ButtonSelector validation feedback. |

No slots defined.
