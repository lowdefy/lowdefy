# PasswordInput

Password input with visibility toggle.

```yaml
- id: size_small
  type: PasswordInput
  properties:
    title: Small
    size: small
    placeholder: Enter password
- id: size_default
  type: PasswordInput
  properties:
    title: Default
    placeholder: Enter password
- id: size_large
  type: PasswordInput
  properties:
    title: Large
    size: large
    placeholder: Enter password
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
- id: toggle_on
  type: PasswordInput
  properties:
    title: With Visibility Toggle (default)
    visibilityToggle: true
    placeholder: Click the eye icon to reveal
- id: toggle_off
  type: PasswordInput
  properties:
    title: Without Visibility Toggle
    visibilityToggle: false
    placeholder: Password cannot be revealed
- id: toggle_disabled
  type: PasswordInput
  properties:
    title: Disabled With Toggle
    disabled: true
    visibilityToggle: true
    placeholder: Toggle also disabled
```

```yaml
toggle_on:
  _state: toggle_on
toggle_off:
  _state: toggle_off
toggle_disabled:
  _state: toggle_disabled
```

```yaml
- id: placeholder_default
  type: PasswordInput
  properties:
    title: Default Placeholder
    placeholder: Enter your password
- id: placeholder_hint
  type: PasswordInput
  properties:
    title: Descriptive Placeholder
    placeholder: Must be at least 8 characters
- id: placeholder_none
  type: PasswordInput
  properties:
    title: No Placeholder
```

```yaml
placeholder_default:
  _state: placeholder_default
placeholder_hint:
  _state: placeholder_hint
placeholder_none:
  _state: placeholder_none
```

```yaml
- id: disabled_empty
  type: PasswordInput
  properties:
    title: Disabled (empty)
    disabled: true
    placeholder: Cannot edit
- id: disabled_no_toggle
  type: PasswordInput
  properties:
    title: Disabled Without Toggle
    disabled: true
    visibilityToggle: false
    placeholder: No toggle, no edit
```

```yaml
disabled_empty:
  _state: disabled_empty
disabled_no_toggle:
  _state: disabled_no_toggle
```

```yaml
- id: borderless_default
  type: PasswordInput
  properties:
    title: Borderless
    bordered: false
    placeholder: No border style
- id: borderless_disabled
  type: PasswordInput
  properties:
    title: Disabled + Borderless
    disabled: true
    bordered: false
    placeholder: Disabled and borderless
```

```yaml
borderless_default:
  _state: borderless_default
borderless_disabled:
  _state: borderless_disabled
```

```yaml
- id: autofocus_on
  type: PasswordInput
  properties:
    title: AutoFocus Enabled
    autoFocus: true
    placeholder: This input is focused on load
- id: autofocus_off
  type: PasswordInput
  properties:
    title: AutoFocus Disabled (default)
    autoFocus: false
    placeholder: Normal focus behavior
```

```yaml
autofocus_on:
  _state: autofocus_on
autofocus_off:
  _state: autofocus_off
```

```yaml
- id: label_default
  type: PasswordInput
  properties:
    title: Default Label
    placeholder: Default label above
- id: label_custom_title
  type: PasswordInput
  properties:
    title: <b>Bold</b> Label Title
    placeholder: Label supports html
- id: label_no_colon
  type: PasswordInput
  properties:
    title: No Colon
    label:
      colon: false
    placeholder: Label without colon
- id: label_right_align
  type: PasswordInput
  properties:
    title: Right Aligned
    label:
      align: right
      inline: true
      span: 8
    placeholder: Label aligned right
- id: label_disabled
  type: PasswordInput
  properties:
    title: Hidden Label
    label:
      disabled: true
    placeholder: Label is hidden
```

```yaml
label_default:
  _state: label_default
label_custom_title:
  _state: label_custom_title
label_no_colon:
  _state: label_no_colon
label_right_align:
  _state: label_right_align
label_disabled:
  _state: label_disabled
```

```yaml
- id: inline_default
  type: PasswordInput
  properties:
    title: Inline Label
    label:
      inline: true
      span: 6
    placeholder: Inline layout
- id: inline_right
  type: PasswordInput
  properties:
    title: Inline Right
    label:
      inline: true
      span: 6
      align: right
    placeholder: Label aligned right
- id: inline_wide
  type: PasswordInput
  properties:
    title: Wide Label Span
    label:
      inline: true
      span: 10
    placeholder: Wider label column
```

```yaml
inline_default:
  _state: inline_default
inline_right:
  _state: inline_right
inline_wide:
  _state: inline_wide
```

```yaml
- id: label_extra
  type: PasswordInput
  properties:
    title: With Extra Text
    label:
      extra: Use at least 8 characters with a mix of letters, numbers & symbols.
    placeholder: Enter a strong password
- id: label_extra_html
  type: PasswordInput
  properties:
    title: Extra With HTML
    label:
      extra: '<span style="color: #888;">Tip: avoid using personal
        information.</span>'
    placeholder: Choose wisely
- id: label_no_feedback
  type: PasswordInput
  properties:
    title: No Validation Feedback
    label:
      hasFeedback: false
    placeholder: Feedback text hidden
```

```yaml
label_extra:
  _state: label_extra
label_extra_html:
  _state: label_extra_html
label_no_feedback:
  _state: label_no_feedback
```

```yaml
- id: style_element
  type: PasswordInput
  properties:
    title: Custom Element Style
    placeholder: Custom border and background
  style:
    .element:
      borderColor: "#722ed1"
- id: style_label
  type: PasswordInput
  properties:
    title: Custom Label Style
    placeholder: Styled label above
  style:
    .label:
      color: "#1677ff"
      fontWeight: bold
      fontSize: 16
- id: style_extra
  type: PasswordInput
  properties:
    title: Styled Extra
    label:
      extra: This extra text is styled.
    placeholder: Enter password
  style:
    .extra:
      color: "#fa8c16"
      fontStyle: italic
- id: style_feedback
  type: PasswordInput
  properties:
    title: Styled Feedback
    label:
      hasFeedback: true
    placeholder: Enter password
  style:
    .feedback:
      color: "#52c41a"
      fontWeight: bold
- id: class_element
  type: PasswordInput
  class: rounded-lg shadow-md
  properties:
    title: With Tailwind Classes
    placeholder: Rounded shadow input
- id: class_custom
  type: PasswordInput
  class: border-2 border-blue-400
  properties:
    title: Custom Border Class
    placeholder: Blue border class
```

```yaml
style_element:
  _state: style_element
style_label:
  _state: style_label
style_extra:
  _state: style_extra
style_feedback:
  _state: style_feedback
class_element:
  _state: class_element
class_custom:
  _state: class_custom
```

```yaml
- id: combo_large_no_toggle
  type: PasswordInput
  properties:
    title: Large + No Toggle + Borderless
    size: large
    visibilityToggle: false
    bordered: false
    placeholder: Large borderless no toggle
- id: combo_small_disabled_toggle
  type: PasswordInput
  properties:
    title: Small + Disabled + Toggle
    size: small
    disabled: true
    visibilityToggle: true
    placeholder: Small disabled with toggle
```

```yaml
combo_large_no_toggle:
  _state: combo_large_no_toggle
combo_small_disabled_toggle:
  _state: combo_small_disabled_toggle
```

```yaml
- id: theme_large_radius
  type: PasswordInput
  properties:
    title: Large Border Radius
    placeholder: Rounded corners
    theme:
      borderRadius: 16
- id: theme_purple
  type: PasswordInput
  properties:
    title: Purple Theme
    placeholder: Purple accented input
    theme:
      activeBorderColor: "#722ed1"
      hoverBorderColor: "#9254de"
      activeShadow: 0 0 0 2px rgba(114, 46, 209, 0.2)
- id: theme_large_pill
  type: PasswordInput
  properties:
    title: Pill Input
    size: large
    placeholder: Pill shaped password input
    theme:
      borderRadius: 32
      borderRadiusLG: 32
      paddingInlineLG: 20
- id: theme_font_padding
  type: PasswordInput
  properties:
    title: Large Font & Extra Padding
    placeholder: More spacious input
    theme:
      fontSize: 18
      paddingBlock: 8
      paddingInline: 16
- id: theme_inline_pink
  type: PasswordInput
  properties:
    title: Themed Inline
    label:
      inline: true
      span: 6
    placeholder: Themed inline input
    theme:
      activeBorderColor: "#eb2f96"
      activeShadow: 0 0 0 2px rgba(235, 47, 150, 0.2)
      borderRadius: 12
```

```yaml
theme_large_radius:
  _state: theme_large_radius
theme_purple:
  _state: theme_purple
theme_large_pill:
  _state: theme_large_pill
theme_font_padding:
  _state: theme_font_padding
theme_inline_pink:
  _state: theme_inline_pink
```

```yaml
- id: login_card
  type: Card
  properties:
    title: Login
  blocks:
    - id: login_username
      type: TextInput
      required: true
      properties:
        title: Username
        placeholder: Enter your username
        prefixIcon: AiOutlineUser
    - id: login_password
      type: PasswordInput
      required: true
      properties:
        title: Password
        placeholder: Enter your password
        visibilityToggle: true
        label:
          extra: Must be at least 8 characters.
    - id: login_submit_btn
      type: Button
      properties:
        title: Sign In
        icon: AiOutlineLogin
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: login_validate
            type: Validate
            params:
              - login_username
              - login_password
          - id: login_success_message
            type: DisplayMessage
            params:
              content: Login successful!
              duration: 3
```

```yaml
login_card:
  _state: login_card
```

```yaml
- id: applied2_security_card
  type: Card
  properties:
    title: Change Password
  blocks:
    - id: applied2_current_password
      type: PasswordInput
      properties:
        title: Current Password
        placeholder: Enter your current password
        visibilityToggle: true
    - id: applied2_new_password
      type: PasswordInput
      properties:
        title: New Password
        placeholder: Enter a new password
        visibilityToggle: true
        label:
          extra: Use at least 8 characters with a mix of letters, numbers, and symbols.
    - id: applied2_confirm_password
      type: PasswordInput
      properties:
        title: Confirm New Password
        placeholder: Re-enter your new password
        visibilityToggle: true
        label:
          extra: Must match the new password above.
    - id: applied2_save_password_btn
      type: Button
      properties:
        title: Update Password
        icon: AiOutlineLock
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: save_password_action
            type: DisplayMessage
            params:
              content: Your password has been updated successfully.
              duration: 3
```

```yaml
applied2_security_card:
  _state: applied2_security_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Whether or not the input has a border style. Deprecated, use variant instead. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
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
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | string | - | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`. |
| `visibilityToggle` | boolean | `true` | Show password visibility toggle button. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design input tokens](https://ant.design/components/input#design-token). |
| `theme.activeBorderColor` | string | `"#1677ff"` | Border color when the input is active (focused). |
| `theme.activeShadow` | string | `"0 0 0 2px rgba(5, 145, 255, 0.1)"` | Shadow effect when the input is active (focused). |
| `theme.addonBg` | string | `"rgba(0, 0, 0, 0.02)"` | Background color for input addon elements. |
| `theme.borderRadius` | number | `6` | Border radius of the input. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large inputs. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small inputs. |
| `theme.colorBgContainer` | string | `"#ffffff"` | Background color of the input. |
| `theme.colorBorder` | string | - | Border color of the input. |
| `theme.colorText` | string | - | Text color inside the input. |
| `theme.colorTextPlaceholder` | string | - | Placeholder text color. |
| `theme.colorTextDisabled` | string | - | Text color when the input is disabled. |
| `theme.colorBgContainerDisabled` | string | - | Background color when the input is disabled. |
| `theme.errorActiveShadow` | string | `"0 0 0 2px rgba(255, 38, 5, 0.06)"` | Shadow effect for error state when the input is active. |
| `theme.fontSize` | number | `14` | Font size of the input text. |
| `theme.fontSizeLG` | number | `16` | Font size for large inputs. |
| `theme.fontSizeSM` | number | `14` | Font size for small inputs. |
| `theme.hoverBorderColor` | string | `"#4096ff"` | Border color when hovering over the input. |
| `theme.hoverBg` | string | `"#ffffff"` | Background color when hovering over the input. |
| `theme.activeBg` | string | `"#ffffff"` | Background color when the input is active (focused). |
| `theme.paddingBlock` | number | `4` | Vertical padding of the input. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for large inputs. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for small inputs. |
| `theme.paddingInline` | number | `11` | Horizontal padding of the input. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for large inputs. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for small inputs. |
| `theme.warningActiveShadow` | string | `"0 0 0 2px rgba(255, 215, 5, 0.1)"` | Shadow effect for warning state when the input is active. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBlur` | \- | Trigger action event occurs when text input loses focus. |
| `onChange` | `{ value: string }` | Trigger action when text input is changed. |
| `onFocus` | \- | Trigger action when text input gets focus. |
| `onPressEnter` | \- | Trigger action when enter is pressed while text input is focused. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PasswordInput element. |
| `/label` | The PasswordInput label. |
| `/extra` | The PasswordInput extra content. |
| `/feedback` | The PasswordInput validation feedback. |

No slots defined.
