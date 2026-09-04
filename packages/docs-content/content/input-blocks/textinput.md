# TextInput

Single-line text input with sizes, prefix/suffix icons, character count, and clear button.

```yaml
- id: basic_default
  type: TextInput
  properties:
    title: Default TextInput
    placeholder: Enter text here
- id: basic_with_value
  type: TextInput
  properties:
    title: With Default Value
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          basic_with_value: Hello World
- id: basic_placeholder_only
  type: TextInput
  properties:
    placeholder: No label, just a placeholder
    label:
      disabled: true
```

```yaml
basic_default:
  _state: basic_default
basic_with_value:
  _state: basic_with_value
basic_placeholder_only:
  _state: basic_placeholder_only
```

```yaml
- id: size_small
  type: TextInput
  properties:
    title: Small
    size: small
    placeholder: Small input
- id: size_middle
  type: TextInput
  properties:
    title: Middle (Default)
    size: middle
    placeholder: Middle input
- id: size_large
  type: TextInput
  properties:
    title: Large
    size: large
    placeholder: Large input
```

```yaml
size_small:
  _state: size_small
size_middle:
  _state: size_middle
size_large:
  _state: size_large
```

```yaml
- id: variant_outlined
  type: TextInput
  properties:
    title: Outlined (Default)
    placeholder: Outlined variant
- id: variant_filled
  type: TextInput
  properties:
    title: Filled
    variant: filled
    placeholder: Filled variant
- id: variant_borderless
  type: TextInput
  properties:
    title: Borderless
    variant: borderless
    placeholder: Borderless variant
```

```yaml
variant_outlined:
  _state: variant_outlined
variant_filled:
  _state: variant_filled
variant_borderless:
  _state: variant_borderless
```

```yaml
- id: type_text
  type: TextInput
  properties:
    title: Text (Default)
    type: text
    placeholder: Regular text
- id: type_email
  type: TextInput
  properties:
    title: Email
    type: email
    prefixIcon: AiOutlineMail
    placeholder: user@example.com
- id: type_password
  type: TextInput
  properties:
    title: Password
    type: password
    prefixIcon: AiOutlineLock
    placeholder: Enter password
- id: type_tel
  type: TextInput
  properties:
    title: Telephone
    type: tel
    prefixIcon: AiOutlinePhone
    placeholder: +1 (555) 123-4567
- id: type_url
  type: TextInput
  properties:
    title: URL
    type: url
    prefixIcon: AiOutlineGlobal
    placeholder: https://example.com
```

```yaml
type_text:
  _state: type_text
type_email:
  _state: type_email
type_password:
  _state: type_password
type_tel:
  _state: type_tel
type_url:
  _state: type_url
```

```yaml
- id: adorn_prefix_text
  type: TextInput
  properties:
    title: Prefix Text
    prefix: https://
    placeholder: mysite.com
- id: adorn_suffix_text
  type: TextInput
  properties:
    title: Suffix Text
    suffix: "@gmail.com"
    placeholder: username
- id: adorn_both
  type: TextInput
  properties:
    title: Prefix & Suffix
    prefix: https://
    suffix: .com
    placeholder: example
- id: adorn_prefix_icon
  type: TextInput
  properties:
    title: Prefix Icon
    prefixIcon: AiOutlineUser
    placeholder: Enter username
- id: adorn_suffix_icon
  type: TextInput
  properties:
    title: Suffix Icon
    suffixIcon: AiOutlineInfoCircle
    placeholder: Enter value
```

```yaml
adorn_prefix_text:
  _state: adorn_prefix_text
adorn_suffix_text:
  _state: adorn_suffix_text
adorn_both:
  _state: adorn_both
adorn_prefix_icon:
  _state: adorn_prefix_icon
adorn_suffix_icon:
  _state: adorn_suffix_icon
```

```yaml
- id: icon_custom_color
  type: TextInput
  properties:
    title: Custom Color Icon
    prefixIcon:
      name: AiOutlineUser
      color: "#1677ff"
    placeholder: Blue user icon
- id: icon_both_custom
  type: TextInput
  properties:
    title: Both Icons
    prefixIcon: AiOutlineLink
    suffixIcon: AiOutlineArrowRight
    placeholder: Enter link
- id: icon_mixed
  type: TextInput
  properties:
    title: Icon Prefix + Text Suffix
    prefixIcon: AiOutlineGlobal
    suffix: .com
    placeholder: domain
```

```yaml
icon_custom_color:
  _state: icon_custom_color
icon_both_custom:
  _state: icon_both_custom
icon_mixed:
  _state: icon_mixed
```

```yaml
- id: clear_basic
  type: TextInput
  properties:
    title: Allow Clear
    allowClear: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          clear_basic: Clearable text
- id: clear_with_icon
  type: TextInput
  properties:
    title: Allow Clear + Prefix Icon
    allowClear: true
    prefixIcon: AiOutlineUser
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          clear_with_icon: Clear with icon
- id: clear_disabled
  type: TextInput
  properties:
    title: Allow Clear (Not Set)
    allowClear: false
    placeholder: Cannot clear
```

```yaml
clear_basic:
  _state: clear_basic
clear_with_icon:
  _state: clear_with_icon
clear_disabled:
  _state: clear_disabled
```

```yaml
- id: count_with_max
  type: TextInput
  properties:
    title: Max 50 Characters
    showCount: true
    maxLength: 50
    placeholder: Up to 50 characters
- id: count_no_max
  type: TextInput
  properties:
    title: Count Without Limit
    showCount: true
    placeholder: Unlimited characters
- id: max_no_count
  type: TextInput
  properties:
    title: Max Length Without Count
    maxLength: 20
    placeholder: Max 20 (no counter shown)
```

```yaml
count_with_max:
  _state: count_with_max
count_no_max:
  _state: count_no_max
max_no_count:
  _state: max_no_count
```

```yaml
- id: replace_numbers_only
  type: TextInput
  properties:
    title: Numbers Only
    placeholder: Only digits allowed
    replaceInput:
      pattern: "[^0-9]"
      flags: g
      replacement: ""
- id: replace_alpha_only
  type: TextInput
  properties:
    title: Letters Only
    placeholder: Only letters allowed
    replaceInput:
      pattern: "[^a-zA-Z]"
      flags: g
      replacement: ""
- id: replace_no_spaces
  type: TextInput
  properties:
    title: No Spaces
    placeholder: Spaces removed automatically
    replaceInput:
      pattern: \s
      flags: g
      replacement: ""
```

```yaml
replace_numbers_only:
  _state: replace_numbers_only
replace_alpha_only:
  _state: replace_alpha_only
replace_no_spaces:
  _state: replace_no_spaces
```

```yaml
- id: label_title_html
  type: TextInput
  properties:
    title: <b>Bold</b> Title
    placeholder: HTML in title
- id: label_extra
  type: TextInput
  properties:
    title: With Extra Text
    placeholder: Enter value
    label:
      extra: Helper text provides guidance.
- id: label_inline
  type: TextInput
  properties:
    title: Inline Label
    placeholder: Label inline, aligned right
    label:
      inline: true
      align: right
      span: 8
- id: label_no_colon
  type: TextInput
  properties:
    title: Without Colon
    placeholder: No colon after label
    label:
      colon: false
- id: label_hidden
  type: TextInput
  properties:
    title: Label Hidden
    placeholder: Label hidden (label.disabled true)
    label:
      disabled: true
```

```yaml
label_title_html:
  _state: label_title_html
label_extra:
  _state: label_extra
label_inline:
  _state: label_inline
label_no_colon:
  _state: label_no_colon
label_hidden:
  _state: label_hidden
```

```yaml
- id: disabled_empty
  type: TextInput
  properties:
    title: Disabled (Empty)
    disabled: true
    placeholder: Cannot edit
- id: disabled_with_value
  type: TextInput
  properties:
    title: Disabled (With Value)
    disabled: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_with_value: Existing value
- id: disabled_with_prefix
  type: TextInput
  properties:
    title: Disabled (With Prefix)
    disabled: true
    prefixIcon: AiOutlineUser
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_with_prefix: john_doe
```

```yaml
disabled_empty:
  _state: disabled_empty
disabled_with_value:
  _state: disabled_with_value
disabled_with_prefix:
  _state: disabled_with_prefix
```

```yaml
- id: css_shadow
  type: TextInput
  class: shadow-md
  properties:
    title: Shadow
    placeholder: Using Tailwind shadow class
- id: css_rounded
  type: TextInput
  class: rounded-lg
  properties:
    title: Rounded
    placeholder: Using Tailwind rounded class
- id: css_custom_bg
  type: TextInput
  style:
    .element:
      borderColor: "#adc6ff"
  properties:
    title: Custom Background
    placeholder: Light blue background
- id: css_full_custom
  type: TextInput
  style:
    .element:
      borderColor: "#ffa940"
      borderRadius: 12
      color: "#d46b08"
  properties:
    title: Fully Customized
    placeholder: Orange theme via style
    prefixIcon:
      name: AiOutlineStar
      color: "#fa8c16"
```

```yaml
css_shadow:
  _state: css_shadow
css_rounded:
  _state: css_rounded
css_custom_bg:
  _state: css_custom_bg
css_full_custom:
  _state: css_full_custom
```

```yaml
- id: theme_pill
  type: TextInput
  properties:
    title: Pill Shape
    placeholder: borderRadius 40
    theme:
      borderRadius: 40
- id: theme_green
  type: TextInput
  properties:
    title: Green Theme
    placeholder: Custom green colors
    prefixIcon: AiOutlineCheck
    theme:
      colorPrimary: "#52c41a"
      colorBorder: "#b7eb8f"
      borderRadius: 8
      hoverBorderColor: "#73d13d"
      activeBorderColor: "#389e0d"
      activeShadow: 0 0 0 2px rgba(82, 196, 26, 0.15)
- id: theme_purple
  type: TextInput
  properties:
    title: Purple Theme
    placeholder: Custom purple colors
    prefixIcon: AiOutlineStar
    theme:
      colorPrimary: "#722ed1"
      colorBorder: "#d3adf7"
      borderRadius: 12
      hoverBorderColor: "#b37feb"
      activeBorderColor: "#531dab"
      activeShadow: 0 0 0 2px rgba(114, 46, 209, 0.15)
- id: theme_filled_warm
  type: TextInput
  properties:
    title: Warm Filled
    variant: filled
    placeholder: Custom filled variant
    theme:
      colorFillTertiary: "#fff7e6"
      hoverBorderColor: "#fa8c16"
      borderRadius: 8
```

```yaml
theme_pill:
  _state: theme_pill
theme_green:
  _state: theme_green
theme_purple:
  _state: theme_purple
theme_filled_warm:
  _state: theme_filled_warm
```

```yaml
- id: reg_name
  type: TextInput
  required: true
  properties:
    title: Full Name
    prefixIcon: AiOutlineUser
    placeholder: John Doe
    label:
      colon: false
- id: reg_email
  type: TextInput
  required: true
  properties:
    title: Email Address
    type: email
    prefixIcon: AiOutlineMail
    placeholder: john@example.com
    label:
      colon: false
      extra: We will never share your email.
- id: reg_password
  type: TextInput
  required: true
  properties:
    title: Password
    type: password
    prefixIcon: AiOutlineLock
    placeholder: At least 8 characters
    showCount: true
    maxLength: 64
    label:
      colon: false
- id: reg_username
  type: TextInput
  required: true
  properties:
    title: Username
    prefix: "@"
    placeholder: username
    allowClear: true
    replaceInput:
      pattern: "[^a-z0-9_]"
      flags: g
      replacement: ""
    label:
      colon: false
      extra: Lowercase letters, numbers, and underscores only.
- id: reg_actions
  type: Box
  layout:
    gap: 8
    justify: flex-end
  blocks:
    - id: reg_cancel
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
    - id: reg_submit
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Create Account
        color: primary
        variant: solid
        icon: AiOutlineArrowRight
      events:
        onClick:
          - id: submit_validate
            type: Validate
            params:
              - reg_name
              - reg_email
              - reg_password
              - reg_username
          - id: submit_msg
            type: DisplayMessage
            params:
              content: Account created successfully!
              status: success
```

```yaml
reg_name:
  _state: reg_name
reg_email:
  _state: reg_email
reg_password:
  _state: reg_password
reg_username:
  _state: reg_username
reg_actions:
  _state: reg_actions
```

```yaml
- id: search_bar
  type: TextInput
  properties:
    prefixIcon: AiOutlineSearch
    allowClear: true
    placeholder: Search products, categories, or brands...
    size: large
    label:
      disabled: true
    theme:
      borderRadius: 20
  events:
    onPressEnter:
      - id: search_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Searching for: "
              - _state: search_bar
          status: info
- id: search_coupon
  type: TextInput
  properties:
    title: Coupon Code
    placeholder: Enter code
    showCount: true
    maxLength: 16
    size: small
    replaceInput:
      pattern: "[^A-Z0-9]"
      flags: g
      replacement: ""
    label:
      extra: Letters and numbers only.
- id: search_apply
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Apply Coupon
    color: primary
    variant: solid
    size: small
  events:
    onClick:
      - id: apply_msg
        type: DisplayMessage
        params:
          content: Coupon applied!
          status: success
```

```yaml
- id: search_bar
  type: TextInput
  properties:
    prefixIcon: AiOutlineSearch
    allowClear: true
    placeholder: Search products, categories, or brands...
    size: large
    label:
      disabled: true
    theme:
      borderRadius: 20
  events:
    onPressEnter:
      - id: search_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Searching for: "
              - _state: search_bar
          status: info
- id: search_coupon
  type: TextInput
  properties:
    title: Coupon Code
    placeholder: Enter code
    showCount: true
    maxLength: 16
    size: small
    replaceInput:
      pattern: "[^A-Z0-9]"
      flags: g
      replacement: ""
    label:
      extra: Letters and numbers only.
- id: search_apply
  type: Button
  layout:
    flex: 0 0 auto
  properties:
    title: Apply Coupon
    color: primary
    variant: solid
    size: small
  events:
    onClick:
      - id: apply_msg
        type: DisplayMessage
        params:
          content: Coupon applied!
          status: success
```

```yaml
search_bar:
  _state: search_bar
search_coupon:
  _state: search_coupon
search_apply:
  _state: search_apply
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `false` | Allow the user to clear their input. |
| `type` | string | `"text"` | The type of input, (see MDN). Enum: `text`, `number`, `password`, `tel`, `email`, `url`. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Whether or not the text input has a border style. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `maxLength` | integer | - | The max number of input characters. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
| `prefix` | string | - | Prefix text for the block, priority over $prefix_con. |
| `prefixIcon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to prefix the text input. |
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
| `replaceInput` | object | - | Regex used to sanitize input. |
| `replaceInput.pattern` | string | - | The regular expression pattern to use to sanitize input. |
| `replaceInput.flags` | string | - | The regex flags to use. The default value is 'gm'. |
| `replaceInput.replacement` | string | - | The string used to replace the input that matches the pattern. The default value is ''. |
| `size` | string | `"middle"` | Size of the block. Enum: `small`, `middle`, `large`. |
| `showCount` | boolean | `false` | Show text character count |
| `suffix` | string | - | Suffix text for the block, priority over suffixIcon. |
| `suffixIcon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to suffix the text input. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | string | - | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design input tokens](https://ant.design/components/input#design-token). |
| `theme.activeBorderColor` | string | - | Border color when the input is focused. |
| `theme.activeShadow` | string | - | Box shadow when the input is focused. |
| `theme.addonBg` | string | `"rgba(0, 0, 0, 0.02)"` | Background color of addon elements. |
| `theme.borderRadius` | number | `6` | Border radius of the input. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large inputs. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small inputs. |
| `theme.colorBgContainer` | string | - | Background color of the input. |
| `theme.colorBorder` | string | - | Border color of the input. |
| `theme.colorError` | string | - | Color used for error status. |
| `theme.colorFillTertiary` | string | - | Background fill color for the filled variant. |
| `theme.colorPrimary` | string | - | Primary color override. |
| `theme.colorText` | string | - | Text color of the input value. |
| `theme.colorTextDisabled` | string | - | Text color when input is disabled. |
| `theme.colorTextPlaceholder` | string | - | Color of the placeholder text. |
| `theme.colorWarning` | string | - | Color used for warning status. |
| `theme.controlHeight` | number | `32` | Height of the input. |
| `theme.controlHeightLG` | number | `40` | Height for large inputs. |
| `theme.controlHeightSM` | number | `24` | Height for small inputs. |
| `theme.errorActiveShadow` | string | `"0 0 0 2px rgba(255, 38, 5, 0.06)"` | Box shadow when the input has error status and is focused. |
| `theme.fontSize` | number | `14` | Font size of the input. |
| `theme.fontSizeLG` | number | `16` | Font size for large inputs. |
| `theme.fontSizeSM` | number | `14` | Font size for small inputs. |
| `theme.hoverBorderColor` | string | - | Border color when the input is hovered. |
| `theme.hoverBg` | string | - | Background color when the input is hovered. |
| `theme.activeBg` | string | - | Background color when the input is focused. |
| `theme.lineWidth` | number | `1` | Border width. |
| `theme.paddingBlock` | number | `4` | Vertical padding. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for large inputs. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for small inputs. |
| `theme.paddingInline` | number | `11` | Horizontal padding. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for large inputs. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for small inputs. |
| `theme.warningActiveShadow` | string | `"0 0 0 2px rgba(255, 215, 5, 0.1)"` | Box shadow when the input has warning status and is focused. |

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
| `/element` | The TextInput element. |
| `/label` | The TextInput label. |
| `/extra` | The TextInput extra content. |
| `/feedback` | The TextInput validation feedback. |
| `/prefixIcon` | The prefix icon in the TextInput. |
| `/suffixIcon` | The suffix icon in the TextInput. |

No slots defined.
