# PhoneNumberInput

Phone number input with international country code selector.

```yaml
- id: basic_default
  type: PhoneNumberInput
  properties:
    title: Default PhoneNumberInput
- id: basic_with_placeholder
  type: PhoneNumberInput
  properties:
    title: With Placeholder
    placeholder: Enter phone number
- id: basic_with_title
  type: PhoneNumberInput
  properties:
    title: Contact Number
    placeholder: Enter your contact number
```

```yaml
basic_default:
  _state: basic_default
basic_with_placeholder:
  _state: basic_with_placeholder
basic_with_title:
  _state: basic_with_title
```

```yaml
- id: region_us
  type: PhoneNumberInput
  properties:
    title: United States
    defaultRegion: US
    placeholder: (555) 123-4567
- id: region_gb
  type: PhoneNumberInput
  properties:
    title: United Kingdom
    defaultRegion: GB
    placeholder: 20 7946 0958
- id: region_za
  type: PhoneNumberInput
  properties:
    title: South Africa
    defaultRegion: ZA
    placeholder: 21 123 4567
- id: region_jp
  type: PhoneNumberInput
  properties:
    title: Japan
    defaultRegion: JP
    placeholder: 3-1234-5678
```

```yaml
region_us:
  _state: region_us
region_gb:
  _state: region_gb
region_za:
  _state: region_za
region_jp:
  _state: region_jp
```

```yaml
- id: regions_north_america
  type: PhoneNumberInput
  properties:
    title: North America Only
    allowedRegions:
      - US
      - CA
      - MX
    defaultRegion: US
    placeholder: Enter number
- id: regions_europe
  type: PhoneNumberInput
  properties:
    title: European Countries
    allowedRegions:
      - GB
      - DE
      - FR
      - ES
      - IT
      - NL
    defaultRegion: GB
    placeholder: Enter number
- id: regions_asia_pacific
  type: PhoneNumberInput
  properties:
    title: Asia Pacific
    allowedRegions:
      - JP
      - CN
      - KR
      - AU
      - IN
    defaultRegion: JP
    placeholder: Enter number
- id: regions_single
  type: PhoneNumberInput
  properties:
    title: Single Country (ZA)
    allowedRegions:
      - ZA
    defaultRegion: ZA
    placeholder: Enter South African number
```

```yaml
regions_north_america:
  _state: regions_north_america
regions_europe:
  _state: regions_europe
regions_asia_pacific:
  _state: regions_asia_pacific
regions_single:
  _state: regions_single
```

```yaml
- id: size_small
  type: PhoneNumberInput
  properties:
    title: Small
    size: small
    placeholder: Small input
- id: size_middle
  type: PhoneNumberInput
  properties:
    title: Middle (Default)
    size: middle
    placeholder: Middle input
- id: size_large
  type: PhoneNumberInput
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
- id: toggle_disabled
  type: PhoneNumberInput
  properties:
    title: Disabled
    disabled: true
    defaultRegion: US
    placeholder: Cannot edit
- id: toggle_borderless
  type: PhoneNumberInput
  properties:
    title: Borderless
    bordered: false
    defaultRegion: GB
    placeholder: No border style
- id: toggle_allow_clear
  type: PhoneNumberInput
  properties:
    title: Allow Clear
    allowClear: true
    placeholder: Type then clear
- id: toggle_arrow_hidden
  type: PhoneNumberInput
  properties:
    title: Arrow Hidden
    showArrow: false
    placeholder: Selector without arrow
```

```yaml
toggle_disabled:
  _state: toggle_disabled
toggle_borderless:
  _state: toggle_borderless
toggle_allow_clear:
  _state: toggle_allow_clear
toggle_arrow_hidden:
  _state: toggle_arrow_hidden
```

```yaml
- id: maxlength_10
  type: PhoneNumberInput
  properties:
    title: Max 10 Characters
    maxLength: 10
    placeholder: Up to 10 digits
- id: maxlength_15
  type: PhoneNumberInput
  properties:
    title: Max 15 Characters
    maxLength: 15
    placeholder: Up to 15 characters
- id: maxlength_7
  type: PhoneNumberInput
  properties:
    title: Max 7 Characters
    maxLength: 7
    placeholder: Short number
```

```yaml
maxlength_10:
  _state: maxlength_10
maxlength_15:
  _state: maxlength_15
maxlength_7:
  _state: maxlength_7
```

```yaml
- id: icon_prefix_phone
  type: PhoneNumberInput
  properties:
    title: Prefix Phone Icon
    prefixIcon: AiOutlinePhone
    placeholder: Enter phone number
- id: icon_suffix_check
  type: PhoneNumberInput
  properties:
    title: Suffix Check Icon
    suffixIcon: AiOutlineCheckCircle
    placeholder: Verified number
- id: icon_both
  type: PhoneNumberInput
  properties:
    title: Both Icons
    prefixIcon: AiOutlinePhone
    suffixIcon: AiOutlineInfoCircle
    placeholder: Enter number
- id: icon_custom_color
  type: PhoneNumberInput
  properties:
    title: Custom Icon Color
    prefixIcon:
      name: AiOutlinePhone
      color: "#1677ff"
    placeholder: Blue phone icon
```

```yaml
icon_prefix_phone:
  _state: icon_prefix_phone
icon_suffix_check:
  _state: icon_suffix_check
icon_both:
  _state: icon_both
icon_custom_color:
  _state: icon_custom_color
```

```yaml
- id: label_colon_false
  type: PhoneNumberInput
  properties:
    title: Without Colon
    placeholder: No colon
    label:
      colon: false
- id: label_align_right
  type: PhoneNumberInput
  properties:
    title: Right Aligned
    placeholder: Label aligned right
    label:
      inline: true
      align: right
      span: 8
- id: label_extra
  type: PhoneNumberInput
  properties:
    title: With Extra Text
    placeholder: Enter phone number
    label:
      extra: Include area code. We will not share your number.
- id: label_disabled
  type: PhoneNumberInput
  properties:
    title: Label Hidden
    placeholder: Label is hidden
    label:
      disabled: true
- id: label_feedback_off
  type: PhoneNumberInput
  properties:
    title: No Feedback
    placeholder: Feedback hidden
    label:
      hasFeedback: false
```

```yaml
label_colon_false:
  _state: label_colon_false
label_align_right:
  _state: label_align_right
label_extra:
  _state: label_extra
label_disabled:
  _state: label_disabled
label_feedback_off:
  _state: label_feedback_off
```

```yaml
- id: inline_span_4
  type: PhoneNumberInput
  properties:
    title: Span 4
    placeholder: Narrow label
    label:
      inline: true
      span: 4
- id: inline_span_8
  type: PhoneNumberInput
  properties:
    title: Span 8
    placeholder: Medium label
    label:
      inline: true
      span: 8
- id: inline_span_12
  type: PhoneNumberInput
  properties:
    title: Span 12
    placeholder: Wide label
    label:
      inline: true
      span: 12
```

```yaml
inline_span_4:
  _state: inline_span_4
inline_span_8:
  _state: inline_span_8
inline_span_12:
  _state: inline_span_12
```

```yaml
- id: replace_digits_only
  type: PhoneNumberInput
  properties:
    title: Digits Only
    placeholder: Only digits allowed
    replaceInput:
      pattern: "[^0-9]"
      flags: g
      replacement: ""
- id: replace_digits_spaces_dashes
  type: PhoneNumberInput
  properties:
    title: Digits, Spaces & Dashes
    placeholder: Digits, spaces and dashes
    replaceInput:
      pattern: "[^0-9\\s\\-]"
      flags: g
      replacement: ""
- id: replace_digits_parens
  type: PhoneNumberInput
  properties:
    title: US Format Characters
    placeholder: (555) 123-4567
    replaceInput:
      pattern: "[^0-9()\\-\\s]"
      flags: g
      replacement: ""
```

```yaml
replace_digits_only:
  _state: replace_digits_only
replace_digits_spaces_dashes:
  _state: replace_digits_spaces_dashes
replace_digits_parens:
  _state: replace_digits_parens
```

```yaml
- id: css_shadow
  type: PhoneNumberInput
  class: shadow-md
  properties:
    title: Shadow
    placeholder: Using Tailwind shadow class
- id: css_rounded
  type: PhoneNumberInput
  class: rounded-lg
  properties:
    title: Rounded
    placeholder: Using Tailwind rounded class
- id: css_custom_bg
  type: PhoneNumberInput
  style:
    .element:
      borderColor: "#adc6ff"
  properties:
    title: Custom Background
    placeholder: Light blue background via inline style
```

```yaml
css_shadow:
  _state: css_shadow
css_rounded:
  _state: css_rounded
css_custom_bg:
  _state: css_custom_bg
```

```yaml
- id: theme_active_border
  type: PhoneNumberInput
  properties:
    title: Custom Active Border
    placeholder: Focus to see green border
    theme:
      activeBorderColor: "#52c41a"
      hoverBorderColor: "#73d13d"
    label:
      disabled: true
- id: theme_addon_bg
  type: PhoneNumberInput
  properties:
    title: Custom Addon Background
    placeholder: Blue-tinted selector area
    label:
      disabled: true
- id: theme_combined_green
  type: PhoneNumberInput
  properties:
    title: Green Theme
    placeholder: Fully themed green
    defaultRegion: US
    theme:
      colorPrimary: "#52c41a"
      colorBorder: "#b7eb8f"
      hoverBorderColor: "#73d13d"
      activeBorderColor: "#389e0d"
      activeShadow: 0 0 0 2px rgba(82, 196, 26, 0.15)
    label:
      disabled: true
- id: theme_combined_purple
  type: PhoneNumberInput
  properties:
    title: Purple Theme
    placeholder: Fully themed purple
    defaultRegion: GB
    theme:
      colorPrimary: "#722ed1"
      colorBorder: "#d3adf7"
      hoverBorderColor: "#b37feb"
      activeBorderColor: "#531dab"
      activeShadow: 0 0 0 2px rgba(114, 46, 209, 0.15)
    label:
      disabled: true
- id: theme_combined_dark
  type: PhoneNumberInput
  properties:
    title: Dark Theme
    defaultRegion: JP
    theme:
      colorBgContainer: "#1f1f1f"
      colorBorder: "#434343"
      colorText: "#ffffff"
      hoverBorderColor: "#595959"
      activeBorderColor: "#177ddc"
      activeShadow: 0 0 0 2px rgba(23, 125, 220, 0.2)
    label:
      disabled: true
```

```yaml
theme_active_border:
  _state: theme_active_border
theme_addon_bg:
  _state: theme_addon_bg
theme_combined_green:
  _state: theme_combined_green
theme_combined_purple:
  _state: theme_combined_purple
theme_combined_dark:
  _state: theme_combined_dark
```

```yaml
- id: combined_full_us
  type: PhoneNumberInput
  properties:
    title: US Phone Number
    defaultRegion: US
    allowedRegions:
      - US
      - CA
    placeholder: (555) 123-4567
    allowClear: true
    size: large
    prefixIcon: AiOutlinePhone
    replaceInput:
      pattern: "[^0-9()\\-\\s]"
      flags: g
      replacement: ""
    label:
      extra: Enter a US or Canadian phone number.
      colon: false
- id: combined_international
  type: PhoneNumberInput
  properties:
    title: International Number
    defaultRegion: GB
    placeholder: Enter international number
    allowClear: true
    maxLength: 15
    suffixIcon: AiOutlineGlobal
    label:
      inline: true
      span: 8
      align: right
      colon: true
- id: combined_compact
  type: PhoneNumberInput
  properties:
    title: Compact Phone Input
    defaultRegion: ZA
    size: small
    showArrow: false
    placeholder: Number
    label:
      disabled: true
- id: combined_form_field
  type: PhoneNumberInput
  properties:
    title: Mobile Number
    defaultRegion: US
    allowClear: true
    maxLength: 10
    placeholder: Enter mobile number
    prefixIcon: AiOutlineMobile
    replaceInput:
      pattern: "[^0-9]"
      flags: g
      replacement: ""
    label:
      extra: Digits only. Maximum 10 characters.
      hasFeedback: true
- id: combined_themed_form
  type: PhoneNumberInput
  properties:
    title: Themed Phone Field
    defaultRegion: GB
    allowedRegions:
      - GB
      - IE
      - FR
      - DE
    placeholder: Enter number
    allowClear: true
    size: large
    prefixIcon:
      name: AiOutlinePhone
      color: "#52c41a"
    theme:
      colorPrimary: "#52c41a"
      colorBorder: "#b7eb8f"
      hoverBorderColor: "#73d13d"
      activeBorderColor: "#389e0d"
    label:
      extra: Select your country and enter your phone number.
      colon: false
```

```yaml
combined_full_us:
  _state: combined_full_us
combined_international:
  _state: combined_international
combined_compact:
  _state: combined_compact
combined_form_field:
  _state: combined_form_field
combined_themed_form:
  _state: combined_themed_form
```

```yaml
- id: contact_card
  type: Card
  properties:
    title: Contact Us
  blocks:
    - id: contact_name
      type: TextInput
      required: true
      properties:
        title: Full Name
        prefixIcon: AiOutlineUser
        placeholder: John Doe
        label:
          colon: false
    - id: contact_email
      type: TextInput
      required: true
      properties:
        title: Email Address
        type: email
        prefixIcon: AiOutlineMail
        placeholder: john@example.com
        label:
          colon: false
    - id: contact_phone
      type: PhoneNumberInput
      required: true
      properties:
        title: Phone Number
        defaultRegion: US
        allowClear: true
        prefixIcon: AiOutlinePhone
        placeholder: (555) 123-4567
        label:
          colon: false
          extra: Include your area code.
      events:
        onChange:
          - id: contact_phone_set
            type: SetState
            params:
              contact_phone:
                _event: value
    - id: contact_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
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
              - id: contact_validate
                type: Validate
                params:
                  - contact_name
                  - contact_email
                  - contact_phone
              - id: contact_success
                type: DisplayMessage
                params:
                  content: Message sent successfully!
                  status: success
```

```yaml
- id: contact_card
  type: Card
  properties:
    title: Contact Us
  blocks:
    - id: contact_name
      type: TextInput
      required: true
      properties:
        title: Full Name
        prefixIcon: AiOutlineUser
        placeholder: John Doe
        label:
          colon: false
    - id: contact_email
      type: TextInput
      required: true
      properties:
        title: Email Address
        type: email
        prefixIcon: AiOutlineMail
        placeholder: john@example.com
        label:
          colon: false
    - id: contact_phone
      type: PhoneNumberInput
      required: true
      properties:
        title: Phone Number
        defaultRegion: US
        allowClear: true
        prefixIcon: AiOutlinePhone
        placeholder: (555) 123-4567
        label:
          colon: false
          extra: Include your area code.
      events:
        onChange:
          - id: contact_phone_set
            type: SetState
            params:
              contact_phone:
                _event: value
    - id: contact_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
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
              - id: contact_validate
                type: Validate
                params:
                  - contact_name
                  - contact_email
                  - contact_phone
              - id: contact_success
                type: DisplayMessage
                params:
                  content: Message sent successfully!
                  status: success
```

```yaml
contact_card:
  _state: contact_card
```

```yaml
- id: register_card
  type: Card
  properties:
    title: Create Account
  blocks:
    - id: register_phone
      type: PhoneNumberInput
      required: true
      properties:
        title: Mobile Number
        defaultRegion: US
        allowClear: true
        prefixIcon: AiOutlineMobile
        placeholder: Enter mobile number
        label:
          colon: false
          extra: We will send a verification code to this number.
      events:
        onChange:
          - id: register_phone_set
            type: SetState
            params:
              register_phone:
                _event: value
    - id: register_password
      type: PasswordInput
      required: true
      properties:
        title: Password
        placeholder: At least 8 characters
        label:
          colon: false
    - id: register_terms
      type: CheckboxSwitch
      required: true
      properties:
        title: I agree to the Terms and Conditions
        label:
          disabled: true
    - id: register_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: register_submit
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
              - id: register_validate
                type: Validate
                params:
                  - register_phone
                  - register_password
                  - register_terms
              - id: register_success
                type: DisplayMessage
                params:
                  content: Account created successfully!
                  status: success
```

```yaml
- id: register_card
  type: Card
  properties:
    title: Create Account
  blocks:
    - id: register_phone
      type: PhoneNumberInput
      required: true
      properties:
        title: Mobile Number
        defaultRegion: US
        allowClear: true
        prefixIcon: AiOutlineMobile
        placeholder: Enter mobile number
        label:
          colon: false
          extra: We will send a verification code to this number.
      events:
        onChange:
          - id: register_phone_set
            type: SetState
            params:
              register_phone:
                _event: value
    - id: register_password
      type: PasswordInput
      required: true
      properties:
        title: Password
        placeholder: At least 8 characters
        label:
          colon: false
    - id: register_terms
      type: CheckboxSwitch
      required: true
      properties:
        title: I agree to the Terms and Conditions
        label:
          disabled: true
    - id: register_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: register_submit
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
              - id: register_validate
                type: Validate
                params:
                  - register_phone
                  - register_password
                  - register_terms
              - id: register_success
                type: DisplayMessage
                params:
                  content: Account created successfully!
                  status: success
```

```yaml
register_card:
  _state: register_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `showFlags` | boolean | `true` | Show country flags in the country selector and input. |
| `allowClear` | boolean | `false` | Allow the user to clear their input. |
| `allowedRegions` | array | - | List of allowed ISO 3166-1 alpha-2 region codes. If allowedRegions is [] or null, the default list of all regions is used. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Whether or not the text input has a border style. Deprecated, use variant instead. |
| `defaultRegion` | string | - | The dial code of the default region to be used. |
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
| `showArrow` | boolean | `true` | Show the suffix icon at the drop-down position of the selector. antd shows the arrow by default; `false` hides it by clearing the suffix icon. |
| `size` | string | `"middle"` | Size of the block. Enum: `small`, `middle`, `large`. |
| `suffix` | string | - | Suffix text for the block, priority over suffixIcon. |
| `suffixIcon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to suffix the text input. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | string | - | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design input tokens](https://ant.design/components/input#design-token). |
| `theme.activeBorderColor` | string | - | Border color when the input is focused. |
| `theme.activeShadow` | string | - | Box shadow when the input is focused. |
| `theme.addonBg` | string | `"rgba(0, 0, 0, 0.02)"` | Background color of addon elements. |
| `theme.colorBgContainer` | string | - | Background color of the input. |
| `theme.colorBorder` | string | - | Border color of the input. |
| `theme.colorError` | string | - | Color used for error status. |
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
| `theme.hoverBorderColor` | string | - | Border color when the input is hovered. |
| `theme.paddingBlock` | number | `4` | Vertical padding. |
| `theme.paddingInline` | number | `11` | Horizontal padding. |
| `theme.warningActiveShadow` | string | `"0 0 0 2px rgba(255, 215, 5, 0.1)"` | Box shadow when the input has warning status and is focused. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onInputChange` | \- | Trigger action when text input is changed. |
| `onCodeChange` | \- | Trigger action when the selector is changed. |
| `onChange` | `{ value: object }` | Trigger action when the number is changed. |
| `onBlur` | \- | Trigger action event occurs when input loses focus. |
| `onFocus` | \- | Trigger action when input gets focus. |
| `onPressEnter` | \- | Trigger action when enter is pressed while text input is focused. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PhoneNumberInput element. |
| `/label` | The PhoneNumberInput label. |
| `/extra` | The PhoneNumberInput extra content. |
| `/feedback` | The PhoneNumberInput validation feedback. |
| `/options` | The PhoneNumberInput options. |
| `/prefixIcon` | The prefix icon in the PhoneNumberInput. |
| `/select` | The PhoneNumberInput select. |
| `/suffixIcon` | The suffix icon in the PhoneNumberInput. |

No slots defined.
