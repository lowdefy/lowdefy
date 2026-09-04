# Label

Form label wrapper with title, description, and validation feedback.

```yaml
- id: label_basic
  type: Label
  properties:
    title: Field Label
  blocks:
    - id: label_basic_input
      type: TextInput
- id: label_no_title
  type: Label
  blocks:
    - id: label_no_title_input
      type: TextInput
```

```yaml
- id: label_html_title
  type: Label
  properties:
    title: '<span style="color: #1677ff;">Blue Label</span>'
  blocks:
    - id: label_html_title_input
      type: TextInput
- id: label_html_bold
  type: Label
  properties:
    title: <b>Bold</b> with <i>italic</i>
  blocks:
    - id: label_html_bold_input
      type: TextInput
```

```yaml
- id: label_colon_true
  type: Label
  properties:
    title: With Colon (default)
    colon: true
  blocks:
    - id: label_colon_true_input
      type: TextInput
- id: label_colon_false
  type: Label
  properties:
    title: Without Colon
    colon: false
  blocks:
    - id: label_colon_false_input
      type: TextInput
```

```yaml
- id: label_disabled
  type: Label
  properties:
    title: This title is hidden
    disabled: true
  blocks:
    - id: label_disabled_input
      type: TextInput
- id: label_disabled_extra
  type: Label
  properties:
    title: Also hidden
    disabled: true
    extra: Extra text still appears when label is disabled.
  blocks:
    - id: label_disabled_extra_input
      type: TextInput
```

```yaml
- id: label_extra_short
  type: Label
  properties:
    title: Username
    extra: Must be between 3 and 20 characters.
  blocks:
    - id: label_extra_short_input
      type: TextInput
- id: label_extra_html
  type: Label
  properties:
    title: Website
    extra: Enter a full URL, e.g. <b>https://example.com</b>
  blocks:
    - id: label_extra_html_input
      type: TextInput
```

```yaml
- id: label_required
  type: Label
  required: true
  properties:
    title: Email Address
  blocks:
    - id: label_required_input
      type: TextInput
- id: label_required_extra
  type: Label
  required: true
  properties:
    title: Password
    extra: Minimum 8 characters.
  blocks:
    - id: label_required_extra_input
      type: TextInput
```

```yaml
- id: label_size_small
  type: Label
  properties:
    title: Small
    size: small
  blocks:
    - id: label_size_small_input
      type: TextInput
      properties:
        size: small
- id: label_size_default
  type: Label
  properties:
    title: Default
    size: default
  blocks:
    - id: label_size_default_input
      type: TextInput
- id: label_size_large
  type: Label
  properties:
    title: Large
    size: large
  blocks:
    - id: label_size_large_input
      type: TextInput
      properties:
        size: large
```

```yaml
- id: label_align_left
  type: Label
  properties:
    title: Left Aligned (default)
    align: left
    inline: true
    span: 6
  blocks:
    - id: label_align_left_input
      type: TextInput
- id: label_align_right
  type: Label
  properties:
    title: Right Aligned
    align: right
    inline: true
    span: 6
  blocks:
    - id: label_align_right_input
      type: TextInput
```

```yaml
- id: label_inline
  type: Label
  properties:
    title: Inline Label
    inline: true
  blocks:
    - id: label_inline_input
      type: TextInput
- id: label_inline_span4
  type: Label
  properties:
    title: Span 4
    inline: true
    span: 4
  blocks:
    - id: label_inline_span4_input
      type: TextInput
- id: label_inline_span8
  type: Label
  properties:
    title: Span 8
    inline: true
    span: 8
  blocks:
    - id: label_inline_span8_input
      type: TextInput
- id: label_inline_extra
  type: Label
  properties:
    title: Inline with Extra
    inline: true
    span: 6
    extra: Helper text shown below the input.
  blocks:
    - id: label_inline_extra_input
      type: TextInput
```

```yaml
- id: label_inline_small
  type: Label
  properties:
    title: Small Inline
    size: small
    inline: true
    span: 6
  blocks:
    - id: label_inline_small_input
      type: TextInput
      properties:
        size: small
- id: label_inline_default
  type: Label
  properties:
    title: Default Inline
    size: default
    inline: true
    span: 6
  blocks:
    - id: label_inline_default_input
      type: TextInput
- id: label_inline_large
  type: Label
  properties:
    title: Large Inline
    size: large
    inline: true
    span: 6
  blocks:
    - id: label_inline_large_input
      type: TextInput
      properties:
        size: large
```

```yaml
- id: label_wrap_number
  type: Label
  properties:
    title: Quantity
  blocks:
    - id: label_wrap_number_input
      type: NumberInput
      properties:
        min: 0
        max: 100
- id: label_wrap_switch
  type: Label
  properties:
    title: Enable Notifications
  blocks:
    - id: label_wrap_switch_input
      type: Switch
- id: label_wrap_select
  type: Label
  properties:
    title: Country
  blocks:
    - id: label_wrap_select_input
      type: Selector
      properties:
        options:
          - label: United States
            value: us
          - label: United Kingdom
            value: uk
          - label: Germany
            value: de
```

```yaml
- id: label_theme_purple
  type: Label
  required: true
  properties:
    title: Purple Label Theme
    extra: Extra text inherits theme
    theme:
      labelColor: "#722ed1"
      labelFontSize: 16
      labelRequiredMarkColor: "#722ed1"
  blocks:
    - id: label_theme_purple_input
      type: TextInput
- id: label_theme_green_mark
  type: Label
  required: true
  properties:
    title: Green Required Mark
    theme:
      labelRequiredMarkColor: "#52c41a"
  blocks:
    - id: label_theme_green_mark_input
      type: TextInput
- id: label_theme_colon_spacing
  type: Label
  properties:
    title: Wide Colon Spacing
    theme:
      labelColonMarginInlineStart: 8
      labelColonMarginInlineEnd: 16
  blocks:
    - id: label_theme_colon_input
      type: TextInput
- id: label_theme_error_colors
  type: Label
  properties:
    title: Custom Feedback Colors
    theme:
      colorError: "#cf1322"
      colorWarning: "#d48806"
      colorSuccess: "#389e0d"
  blocks:
    - id: label_theme_error_colors_input
      type: TextInput
- id: label_theme_description
  type: Label
  properties:
    title: Custom Description Color
    extra: This extra text uses a custom description color.
    theme:
      colorTextDescription: "#722ed1"
      fontSize: 13
  blocks:
    - id: label_theme_description_input
      type: TextInput
```

```yaml
- id: label_css_label
  type: Label
  properties:
    title: Styled Label Text
    extra: Styled extra text
  class:
    label: text-purple-600 font-bold
    extra: text-purple-400 italic
  blocks:
    - id: label_css_label_input
      type: TextInput
- id: label_css_element
  type: Label
  properties:
    title: Bordered Container
  class:
    element: border border-border p-3 rounded-lg
  blocks:
    - id: label_css_element_input
      type: TextInput
- id: label_css_feedback
  type: Label
  properties:
    title: Feedback Styling
  class:
    feedback: font-semibold text-xs
  blocks:
    - id: label_css_feedback_input
      type: TextInput
- id: label_style_inline
  type: Label
  properties:
    title: Inline Style Overrides
    extra: Styled with inline CSS
  style:
    .label:
      color: "#d46b08"
      fontWeight: bold
      fontSize: 16px
    .extra:
      color: "#d48806"
      fontStyle: italic
    .element:
      border: 1px solid
      padding: 12px
      borderRadius: 8px
  blocks:
    - id: label_style_inline_input
      type: TextInput
```

```yaml
- id: label_reg_card
  type: Card
  properties:
    title: Create Account
  blocks:
    - id: label_reg_name
      type: Label
      required: true
      properties:
        title: Full Name
      blocks:
        - id: label_reg_name_input
          type: TextInput
    - id: label_reg_email
      type: Label
      required: true
      properties:
        title: Email Address
        extra: We will never share your email with anyone.
      blocks:
        - id: label_reg_email_input
          type: TextInput
    - id: label_reg_password
      type: Label
      required: true
      properties:
        title: Password
        extra: Minimum 8 characters with at least one number.
      blocks:
        - id: label_reg_password_input
          type: PasswordInput
    - id: label_reg_age
      type: Label
      properties:
        title: Age
      blocks:
        - id: label_reg_age_input
          type: NumberInput
          properties:
            min: 18
            max: 120
    - id: label_reg_bio
      type: Label
      properties:
        title: Bio
        extra: Optional short description about yourself.
        colon: false
      blocks:
        - id: label_reg_bio_input
          type: TextArea
          properties:
            rows: 3
    - id: label_reg_actions_row
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: label_reg_cancel
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Cancel
            color: default
            variant: outlined
          events:
            onClick:
              - id: label_reg_cancel_link
                type: Link
                params:
                  home: true
        - id: label_reg_submit
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Register
            color: primary
            variant: solid
          events:
            onClick:
              - id: label_reg_submit_validate
                type: Validate
                params:
                  - label_reg_name
                  - label_reg_email
                  - label_reg_password
              - id: label_reg_submit_msg
                type: DisplayMessage
                params:
                  content: Account created successfully!
                  status: success
```

```yaml
- id: label_settings_card
  type: Card
  properties:
    title: Notification Settings
    size: small
  blocks:
    - id: label_settings_email_notif
      type: Label
      properties:
        title: Email Notifications
        inline: true
        span: 8
        align: right
        extra: Receive updates about your account activity.
      blocks:
        - id: label_settings_email_notif_input
          type: Switch
    - id: label_settings_frequency
      type: Label
      properties:
        title: Frequency
        inline: true
        span: 8
        align: right
      blocks:
        - id: label_settings_frequency_input
          type: Selector
          properties:
            options:
              - label: Immediately
                value: immediate
              - label: Daily Digest
                value: daily
              - label: Weekly Summary
                value: weekly
    - id: label_settings_sms
      type: Label
      properties:
        title: SMS Alerts
        inline: true
        span: 8
        align: right
        extra: Standard messaging rates may apply.
      blocks:
        - id: label_settings_sms_input
          type: Switch
    - id: label_settings_phone
      type: Label
      properties:
        title: Phone Number
        inline: true
        span: 8
        align: right
      blocks:
        - id: label_settings_phone_input
          type: PhoneNumberInput
    - id: label_settings_save_row
      type: Box
      layout:
        justify: flex-end
        gap: 8
      blocks:
        - id: label_settings_save
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Save Preferences
            color: primary
            variant: solid
          events:
            onClick:
              - id: label_settings_save_state
                type: SetState
                params:
                  settingsSaved: true
              - id: label_settings_save_msg
                type: DisplayMessage
                params:
                  content: Preferences saved.
                  status: success
```

```yaml
- id: label_data_card
  type: Card
  properties:
    title: Add Product
  blocks:
    - id: label_data_name
      type: Label
      required: true
      properties:
        title: Product Name
        size: large
      blocks:
        - id: label_data_name_input
          type: TextInput
          properties:
            size: large
    - id: label_data_row
      type: Box
      layout:
        gap: 16
      blocks:
        - id: label_data_price
          type: Label
          layout:
            flex: 1 1 0
          required: true
          properties:
            title: Price
          blocks:
            - id: label_data_price_input
              type: NumberInput
              properties:
                min: 0
        - id: label_data_category
          type: Label
          layout:
            flex: 1 1 0
          required: true
          properties:
            title: Category
          blocks:
            - id: label_data_category_input
              type: Selector
              properties:
                options:
                  - label: Electronics
                    value: electronics
                  - label: Clothing
                    value: clothing
                  - label: Home & Garden
                    value: home
        - id: label_data_stock
          type: Label
          layout:
            flex: 1 1 0
          properties:
            title: Stock Quantity
          blocks:
            - id: label_data_stock_input
              type: NumberInput
              properties:
                min: 0
    - id: label_data_desc
      type: Label
      properties:
        title: Description
        extra: <i>Markdown formatting is supported.</i>
        colon: false
      blocks:
        - id: label_data_desc_input
          type: TextArea
          properties:
            rows: 4
    - id: label_data_active
      type: Label
      properties:
        title: Active Listing
        inline: true
        span: 6
        extra: Toggle off to save as draft.
      blocks:
        - id: label_data_active_input
          type: Switch
    - id: label_data_actions_row
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: label_data_save_draft
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Save Draft
            color: default
            variant: outlined
          events:
            onClick:
              - id: label_data_draft_msg
                type: DisplayMessage
                params:
                  content: Draft saved.
                  status: info
        - id: label_data_publish
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Publish Product
            color: primary
            variant: solid
          events:
            onClick:
              - id: label_data_publish_validate
                type: Validate
                params:
                  - label_data_name
                  - label_data_price
                  - label_data_category
              - id: label_data_publish_msg
                type: DisplayMessage
                params:
                  content: Product published successfully!
                  status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `align` | string | `"left"` | Align label left or right when inline. Enum: `left`, `right`. |
| `colon` | boolean | `true` | Append label with colon. |
| `disabled` | boolean | `false` | Disable to not render a label title. |
| `extra` | string | - | Extra text to display beneath the content - supports html. |
| `hasFeedback` | boolean | `true` | Display feedback extra from validation, this does not disable validation. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `title` | string | - | Label title - supports html. |
| `tooltip` | string \| object | - | Help tooltip shown via an icon beside the label. A string sets the tooltip text (supports html), or an object to also customize the icon and color. Use the block's onTooltipClick event to respond to clicks on the icon. |
| `tooltip.title` | string | - | Tooltip text shown on hover - supports html. |
| `tooltip.icon` | string | `"AiOutlineQuestionCircle"` | Name of the icon to show beside the label. |
| `tooltip.color` | string | - | Color of the tooltip icon. |
| `span` | number | - | Label inline span. |
| `inline` | boolean | `false` | Render input and label inline. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design form tokens](https://ant.design/components/form#design-token). |
| `theme.labelFontSize` | number | `14` | Font size of the label text. |
| `theme.labelColor` | string | `"rgba(0,0,0,0.88)"` | Text color of the label. |
| `theme.labelRequiredMarkColor` | string | `"#ff4d4f"` | Color of the required asterisk mark. |
| `theme.labelColonMarginInlineStart` | number | `2` | Inline start margin of the colon after the label. |
| `theme.labelColonMarginInlineEnd` | number | `8` | Inline end margin of the colon after the label. |
| `theme.colorError` | string | `"#ff4d4f"` | Color used for error validation feedback. |
| `theme.colorWarning` | string | `"#faad14"` | Color used for warning validation feedback. |
| `theme.colorSuccess` | string | `"#52c41a"` | Color used for success validation feedback. |
| `theme.colorText` | string | - | Text color for the extra and feedback text. |
| `theme.colorTextDescription` | string | - | Color for the extra description text. |
| `theme.fontSize` | number | `14` | Base font size. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Label element. |
| `/label` | The Label label. |
| `/extra` | The Label extra content. |
| `/feedback` | The Label validation feedback. |

| Slot | Description |
| --- | --- |
| `content` | The labeled input or content blocks. |
