# CheckboxSwitch

Single checkbox for boolean input.

```yaml
- id: basic_default
  type: CheckboxSwitch
  properties:
    title: Accept Terms
- id: basic_with_desc
  type: CheckboxSwitch
  properties:
    title: Notifications
    description: Enable email notifications
- id: basic_simple
  type: CheckboxSwitch
  properties:
    title: Remember Me
    description: Keep me signed in on this device
```

```yaml
basic_default:
  _state: basic_default
basic_with_desc:
  _state: basic_with_desc
basic_simple:
  _state: basic_simple
```

```yaml
- id: desc_terms
  type: CheckboxSwitch
  properties:
    title: Terms & Conditions
    description: I agree to the Terms of Service and Privacy Policy
- id: desc_marketing
  type: CheckboxSwitch
  properties:
    title: Marketing
    description: Send me promotional emails and newsletters
- id: desc_html
  type: CheckboxSwitch
  properties:
    title: Agreement
    description: I accept the <b>Terms</b> and <i>Privacy Policy</i>
```

```yaml
desc_terms:
  _state: desc_terms
desc_marketing:
  _state: desc_marketing
desc_html:
  _state: desc_html
```

```yaml
- id: label_default
  type: CheckboxSwitch
  properties:
    title: Enable Notifications
    description: Receive updates via email
- id: label_colon
  type: CheckboxSwitch
  properties:
    title: Auto-save
    description: Save changes automatically
    label:
      colon: true
- id: label_no_colon
  type: CheckboxSwitch
  properties:
    title: Status
    description: Set active status
    label:
      colon: false
```

```yaml
label_default:
  _state: label_default
label_colon:
  _state: label_colon
label_no_colon:
  _state: label_no_colon
```

```yaml
- id: inline_basic
  type: CheckboxSwitch
  properties:
    title: Dark mode
    description: Enable dark theme
    label:
      inline: true
      span: 8
- id: inline_right
  type: CheckboxSwitch
  properties:
    title: Auto-save
    description: Save changes automatically
    label:
      inline: true
      span: 8
      align: right
- id: inline_wide_span
  type: CheckboxSwitch
  properties:
    title: Enable feature
    description: Activate the new experimental feature
    label:
      inline: true
      span: 12
```

```yaml
inline_basic:
  _state: inline_basic
inline_right:
  _state: inline_right
inline_wide_span:
  _state: inline_wide_span
```

```yaml
- id: extra_basic
  type: CheckboxSwitch
  properties:
    title: Notifications
    description: Enable push notifications
    label:
      extra: Push notifications will be sent to your registered device.
- id: extra_html
  type: CheckboxSwitch
  properties:
    title: Terms
    description: I agree to the terms
    label:
      extra: Read the full <b>Terms of Service</b> before agreeing.
- id: extra_inline
  type: CheckboxSwitch
  properties:
    title: Marketing Emails
    description: Receive promotional content
    label:
      inline: true
      span: 10
      extra: You can unsubscribe at any time from your account settings.
```

```yaml
extra_basic:
  _state: extra_basic
extra_html:
  _state: extra_html
extra_inline:
  _state: extra_inline
```

```yaml
- id: feedback_on
  type: CheckboxSwitch
  properties:
    title: With Feedback
    description: This checkbox shows validation feedback
    label:
      hasFeedback: true
- id: feedback_off
  type: CheckboxSwitch
  properties:
    title: Without Feedback
    description: Validation feedback is hidden
    label:
      hasFeedback: false
```

```yaml
feedback_on:
  _state: feedback_on
feedback_off:
  _state: feedback_off
```

```yaml
- id: disabled_unchecked
  type: CheckboxSwitch
  properties:
    title: Disabled (Unchecked)
    description: This checkbox is disabled
    disabled: true
    label:
      disabled: true
- id: disabled_with_label
  type: CheckboxSwitch
  properties:
    title: Disabled with Label
    description: Cannot be toggled
    disabled: true
```

```yaml
disabled_unchecked:
  _state: disabled_unchecked
disabled_with_label:
  _state: disabled_with_label
```

```yaml
- id: color_green
  type: CheckboxSwitch
  properties:
    title: Green
    description: Success color checkbox
    color: "#52c41a"
    label:
      disabled: true
- id: color_orange
  type: CheckboxSwitch
  properties:
    title: Orange
    description: Warning color checkbox
    color: "#fa8c16"
    label:
      disabled: true
- id: color_purple
  type: CheckboxSwitch
  properties:
    title: Purple
    description: Custom purple checkbox
    color: "#722ed1"
    label:
      disabled: true
- id: color_red
  type: CheckboxSwitch
  properties:
    title: Red
    description: Danger color checkbox
    color: "#f5222d"
    label:
      disabled: true
- id: color_cyan
  type: CheckboxSwitch
  properties:
    title: Cyan
    description: Info color checkbox
    color: "#13c2c2"
    label:
      disabled: true
```

```yaml
color_green:
  _state: color_green
color_orange:
  _state: color_orange
color_purple:
  _state: color_purple
color_red:
  _state: color_red
color_cyan:
  _state: color_cyan
```

```yaml
- id: no_label_desc
  type: CheckboxSwitch
  properties:
    description: Accept cookies for a better browsing experience
    label:
      disabled: true
- id: no_label_plain
  type: CheckboxSwitch
  properties:
    label:
      disabled: true
- id: no_label_html
  type: CheckboxSwitch
  properties:
    description: I agree to the <b>Community Guidelines</b> and <i>Code of Conduct</i>
    label:
      disabled: true
```

```yaml
no_label_desc:
  _state: no_label_desc
no_label_plain:
  _state: no_label_plain
no_label_html:
  _state: no_label_html
```

```yaml
- id: style_background
  type: CheckboxSwitch
  style:
    .element:
      padding: 12px
      borderRadius: 8px
      border: "1px solid #b7eb8f"
  properties:
    title: Styled Background
    description: Checkbox with a custom background style
    label:
      disabled: true
- id: style_warning_bg
  type: CheckboxSwitch
  style:
    .element:
      padding: 10px
      borderRadius: 6px
      border: "1px solid #ffd591"
  properties:
    title: Warning Style
    description: Styled with a warning background
    label:
      disabled: true
- id: style_bold_label
  type: CheckboxSwitch
  style:
    .label:
      fontWeight: bold
      color: "#1677ff"
  properties:
    title: Styled Label
    description: Label text is bold and colored
```

```yaml
style_background:
  _state: style_background
style_warning_bg:
  _state: style_warning_bg
style_bold_label:
  _state: style_bold_label
```

```yaml
- id: class_blue
  type: CheckboxSwitch
  class: p-2 rounded-lg border border-border bg-bg-layout
  properties:
    title: Blue Card
    description: Using Tailwind CSS classes for a blue card style
    label:
      disabled: true
- id: class_green
  type: CheckboxSwitch
  class: p-3 rounded-xl border border-border bg-bg-layout
  properties:
    title: Green Card
    description: Tailwind green card styling
    label:
      disabled: true
- id: class_shadow
  type: CheckboxSwitch
  class: p-3 rounded-lg shadow-md bg-bg-container
  properties:
    title: Shadow Card
    description: Elevated card with a box shadow
    label:
      disabled: true
```

```yaml
class_blue:
  _state: class_blue
class_green:
  _state: class_green
class_shadow:
  _state: class_shadow
```

```yaml
- id: theme_large_checkbox
  type: CheckboxSwitch
  properties:
    title: Large Checkbox
    description: Checkbox with increased size via controlInteractiveSize
    label:
      disabled: true
    theme:
      controlInteractiveSize: 24
- id: theme_circle
  type: CheckboxSwitch
  properties:
    title: Circular Checkbox
    description: Fully rounded checkbox that appears circular
    label:
      disabled: true
    theme:
      controlInteractiveSize: 20
      borderRadiusSM: 10
- id: theme_custom_colors
  type: CheckboxSwitch
  properties:
    title: Custom Theme Colors
    description: Primary and hover colors overridden via design tokens
    label:
      disabled: true
    theme:
      colorPrimary: "#531dab"
      colorPrimaryHover: "#722ed1"
- id: theme_bold_border
  type: CheckboxSwitch
  properties:
    title: Bold Border
    description: Checkbox with a thicker border
    label:
      disabled: true
    theme:
      lineWidth: 2
- id: theme_combined
  type: CheckboxSwitch
  properties:
    title: Combined Tokens
    description: Multiple theme tokens applied together for a unique look
    label:
      disabled: true
    theme:
      controlInteractiveSize: 22
      borderRadiusSM: 6
      colorPrimary: "#08979c"
      colorPrimaryHover: "#13c2c2"
      lineWidth: 2
      colorBorder: "#87e8de"
```

```yaml
theme_large_checkbox:
  _state: theme_large_checkbox
theme_circle:
  _state: theme_circle
theme_custom_colors:
  _state: theme_custom_colors
theme_bold_border:
  _state: theme_bold_border
theme_combined:
  _state: theme_combined
```

```yaml
- id: applied_reg_card
  type: Card
  properties:
    title: Create Account
  blocks:
    - id: applied_reg_name
      type: TextInput
      properties:
        title: Full Name
        placeholder: Enter your full name
    - id: applied_reg_email
      type: TextInput
      properties:
        title: Email Address
        placeholder: you@example.com
    - id: applied_reg_terms
      type: CheckboxSwitch
      properties:
        description: I agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>
        label:
          disabled: true
      validate:
        - message: You must accept the terms to continue.
          status: error
          pass:
            _eq:
              - _state: applied_reg_terms
              - true
    - id: applied_reg_marketing
      type: CheckboxSwitch
      properties:
        description: Send me product updates and tips (optional)
        color: "#1677ff"
        label:
          disabled: true
    - id: applied_reg_submit
      type: Button
      properties:
        title: Create Account
        type: primary
        icon: AiOutlineUserAdd
        block: true
      events:
        onClick:
          - id: validate_terms
            type: Validate
            params:
              - applied_reg_terms
          - id: reg_success
            type: DisplayMessage
            params:
              content: Account created successfully!
              status: success
```

```yaml
- id: applied_reg_card
  type: Card
  properties:
    title: Create Account
  blocks:
    - id: applied_reg_name
      type: TextInput
      properties:
        title: Full Name
        placeholder: Enter your full name
    - id: applied_reg_email
      type: TextInput
      properties:
        title: Email Address
        placeholder: you@example.com
    - id: applied_reg_terms
      type: CheckboxSwitch
      properties:
        description: I agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>
        label:
          disabled: true
      validate:
        - message: You must accept the terms to continue.
          status: error
          pass:
            _eq:
              - _state: applied_reg_terms
              - true
    - id: applied_reg_marketing
      type: CheckboxSwitch
      properties:
        description: Send me product updates and tips (optional)
        color: "#1677ff"
        label:
          disabled: true
    - id: applied_reg_submit
      type: Button
      properties:
        title: Create Account
        type: primary
        icon: AiOutlineUserAdd
        block: true
      events:
        onClick:
          - id: validate_terms
            type: Validate
            params:
              - applied_reg_terms
          - id: reg_success
            type: DisplayMessage
            params:
              content: Account created successfully!
              status: success
```

```yaml
applied_reg_card:
  _state: applied_reg_card
```

```yaml
- id: applied_notif_card
  type: Card
  properties:
    title: Notification Settings
  blocks:
    - id: applied_notif_email
      type: CheckboxSwitch
      properties:
        title: Email Notifications
        description: Receive order updates and receipts via email
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: email_changed
            type: SetState
            params:
              emailEnabled:
                _state: applied_notif_email
    - id: applied_notif_sms
      type: CheckboxSwitch
      properties:
        title: SMS Alerts
        description: Get delivery status updates via text message
        label:
          inline: true
          span: 16
    - id: applied_notif_push
      type: CheckboxSwitch
      properties:
        title: Push Notifications
        description: Receive real-time alerts in your browser
        color: "#1677ff"
        label:
          inline: true
          span: 16
    - id: applied_notif_marketing
      type: CheckboxSwitch
      properties:
        title: Marketing Communications
        description: Promotional offers and new feature announcements
        color: "#722ed1"
        label:
          inline: true
          span: 16
    - id: applied_notif_save
      type: Button
      properties:
        title: Save Preferences
        type: primary
        icon: AiOutlineSave
      events:
        onClick:
          - id: save_notif
            type: DisplayMessage
            params:
              content: Notification preferences saved.
              status: success
```

```yaml
- id: applied_notif_card
  type: Card
  properties:
    title: Notification Settings
  blocks:
    - id: applied_notif_email
      type: CheckboxSwitch
      properties:
        title: Email Notifications
        description: Receive order updates and receipts via email
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: email_changed
            type: SetState
            params:
              emailEnabled:
                _state: applied_notif_email
    - id: applied_notif_sms
      type: CheckboxSwitch
      properties:
        title: SMS Alerts
        description: Get delivery status updates via text message
        label:
          inline: true
          span: 16
    - id: applied_notif_push
      type: CheckboxSwitch
      properties:
        title: Push Notifications
        description: Receive real-time alerts in your browser
        color: "#1677ff"
        label:
          inline: true
          span: 16
    - id: applied_notif_marketing
      type: CheckboxSwitch
      properties:
        title: Marketing Communications
        description: Promotional offers and new feature announcements
        color: "#722ed1"
        label:
          inline: true
          span: 16
    - id: applied_notif_save
      type: Button
      properties:
        title: Save Preferences
        type: primary
        icon: AiOutlineSave
      events:
        onClick:
          - id: save_notif
            type: DisplayMessage
            params:
              content: Notification preferences saved.
              status: success
```

```yaml
applied_notif_card:
  _state: applied_notif_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | string | - | Selected checkbox color. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `description` | string | - | Text to display next to the checkbox - supports html. |
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
| `size` | string | `"default"` | Size of the block label. Enum: `small`, `default`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design checkbox tokens](https://ant.design/components/checkbox#design-token). |
| `theme.colorPrimary` | string | - | Primary color used for the checked state background and border. |
| `theme.colorPrimaryHover` | string | - | Primary color used when hovering over a checked checkbox. |
| `theme.colorBgContainer` | string | - | Background color of the unchecked checkbox. |
| `theme.colorBgContainerDisabled` | string | - | Background color of the checkbox when disabled. |
| `theme.colorBorder` | string | - | Border color of the unchecked checkbox. |
| `theme.colorTextDisabled` | string | - | Color of the checkmark and label text when disabled. |
| `theme.colorWhite` | string | - | Color of the checkmark icon inside the checked checkbox. |
| `theme.controlInteractiveSize` | number | `16` | Size (width and height) of the checkbox. |
| `theme.borderRadiusSM` | number | `4` | Border radius of the checkbox. |
| `theme.lineWidth` | number | `1` | Border width of the checkbox. |
| `theme.lineWidthBold` | number | `2` | Width of the checkmark stroke inside the checkbox. |
| `theme.fontSizeLG` | number | `16` | Large font size token, used to derive the indeterminate indicator size. |
| `theme.paddingXS` | number | `8` | Inline padding between the checkbox and its label text. |
| `theme.marginXS` | number | `8` | Column gap between checkboxes in a Checkbox.Group. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: boolean }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The CheckboxSwitch element. |
| `/label` | The CheckboxSwitch label. |
| `/extra` | The CheckboxSwitch extra content. |
| `/feedback` | The CheckboxSwitch validation feedback. |

No slots defined.
