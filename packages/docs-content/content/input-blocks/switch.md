# Switch

Toggle switch with optional text and icon labels.

```yaml
- id: basic_default
  type: Switch
  properties:
    title: Default Switch
    label:
      disabled: true
- id: basic_small
  type: Switch
  properties:
    title: Small Size
    size: small
    label:
      disabled: true
- id: basic_autofocus
  type: Switch
  properties:
    title: AutoFocus Switch
    autoFocus: true
    label:
      disabled: true
```

```yaml
basic_default:
  _state: basic_default
basic_small:
  _state: basic_small
basic_autofocus:
  _state: basic_autofocus
```

```yaml
- id: text_on_off
  type: Switch
  properties:
    title: On / Off
    checkedText: ON
    uncheckedText: OFF
    label:
      disabled: true
- id: text_yes_no
  type: Switch
  properties:
    title: Yes / No
    checkedText: Yes
    uncheckedText: No
    label:
      disabled: true
- id: text_long
  type: Switch
  properties:
    title: Longer Labels
    checkedText: Enabled
    uncheckedText: Disabled
    label:
      disabled: true
- id: text_numbers
  type: Switch
  properties:
    title: Numeric Labels
    checkedText: "1"
    uncheckedText: "0"
    label:
      disabled: true
- id: text_small_on_off
  type: Switch
  properties:
    title: Small with Text
    checkedText: ON
    uncheckedText: OFF
    size: small
    label:
      disabled: true
```

```yaml
text_on_off:
  _state: text_on_off
text_yes_no:
  _state: text_yes_no
text_long:
  _state: text_long
text_numbers:
  _state: text_numbers
text_small_on_off:
  _state: text_small_on_off
```

```yaml
- id: icon_custom_check
  type: Switch
  properties:
    title: Custom Checked Icon
    checkedIcon: AiOutlineLike
    uncheckedIcon: AiOutlineDislike
    label:
      disabled: true
- id: icon_lock
  type: Switch
  properties:
    title: Lock / Unlock
    checkedIcon: AiOutlineLock
    uncheckedIcon: AiOutlineUnlock
    label:
      disabled: true
- id: icon_sound
  type: Switch
  properties:
    title: Sound On / Off
    checkedIcon: AiOutlineSound
    uncheckedIcon:
      name: AiOutlineStop
      color: "#999"
    label:
      disabled: true
- id: icon_visibility
  type: Switch
  properties:
    title: Visibility Toggle
    checkedIcon: AiOutlineEye
    uncheckedIcon: AiOutlineEyeInvisible
    label:
      disabled: true
- id: icon_power
  type: Switch
  properties:
    title: Power Toggle
    checkedIcon: AiOutlineThunderbolt
    uncheckedIcon: AiOutlinePoweroff
    label:
      disabled: true
```

```yaml
icon_custom_check:
  _state: icon_custom_check
icon_lock:
  _state: icon_lock
icon_sound:
  _state: icon_sound
icon_visibility:
  _state: icon_visibility
icon_power:
  _state: icon_power
```

```yaml
- id: color_green
  type: Switch
  properties:
    title: Green
    color: "#52c41a"
    label:
      disabled: true
- id: color_orange
  type: Switch
  properties:
    title: Orange
    color: "#fa8c16"
    label:
      disabled: true
- id: color_purple
  type: Switch
  properties:
    title: Purple
    color: "#722ed1"
    label:
      disabled: true
- id: color_red
  type: Switch
  properties:
    title: Red
    color: "#f5222d"
    label:
      disabled: true
- id: color_cyan
  type: Switch
  properties:
    title: Cyan
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
- id: color_text_green
  type: Switch
  properties:
    title: Active / Inactive
    color: "#52c41a"
    checkedText: Active
    uncheckedText: Inactive
    label:
      disabled: true
- id: color_text_red
  type: Switch
  properties:
    title: Allow / Deny
    color: "#f5222d"
    checkedText: Allow
    uncheckedText: Deny
    label:
      disabled: true
- id: color_text_purple
  type: Switch
  properties:
    title: Public / Private
    color: "#722ed1"
    checkedText: Public
    uncheckedText: Private
    label:
      disabled: true
```

```yaml
color_text_green:
  _state: color_text_green
color_text_red:
  _state: color_text_red
color_text_purple:
  _state: color_text_purple
```

```yaml
- id: disabled_off
  type: Switch
  properties:
    title: Disabled (Off)
    disabled: true
    label:
      disabled: true
- id: disabled_text
  type: Switch
  properties:
    title: Disabled with Text
    disabled: true
    checkedText: ON
    uncheckedText: OFF
    label:
      disabled: true
- id: disabled_small
  type: Switch
  properties:
    title: Disabled Small
    disabled: true
    size: small
    label:
      disabled: true
- id: disabled_color
  type: Switch
  properties:
    title: Disabled with Color
    disabled: true
    color: "#52c41a"
    label:
      disabled: true
- id: disabled_icons
  type: Switch
  properties:
    title: Disabled with Icons
    disabled: true
    checkedIcon: AiOutlineLike
    uncheckedIcon: AiOutlineDislike
    label:
      disabled: true
```

```yaml
disabled_off:
  _state: disabled_off
disabled_text:
  _state: disabled_text
disabled_small:
  _state: disabled_small
disabled_color:
  _state: disabled_color
disabled_icons:
  _state: disabled_icons
```

```yaml
- id: label_default
  type: Switch
  properties:
    title: Enable notifications
- id: label_extra
  type: Switch
  properties:
    title: Notifications
    label:
      extra: Enable push notifications on this device.
- id: label_no_colon
  type: Switch
  properties:
    title: Status
    label:
      colon: false
- id: label_hidden
  type: Switch
  properties:
    title: Hidden Label
    label:
      disabled: true
- id: label_feedback
  type: Switch
  properties:
    title: With Feedback
    label:
      hasFeedback: true
```

```yaml
label_default:
  _state: label_default
label_extra:
  _state: label_extra
label_no_colon:
  _state: label_no_colon
label_hidden:
  _state: label_hidden
label_feedback:
  _state: label_feedback
```

```yaml
- id: label_inline
  type: Switch
  properties:
    title: Dark mode
    label:
      inline: true
      span: 8
- id: label_inline_right
  type: Switch
  properties:
    title: Auto-save
    label:
      inline: true
      span: 8
      align: right
- id: label_inline_small
  type: Switch
  properties:
    title: Compact mode
    size: small
    label:
      inline: true
      span: 8
```

```yaml
label_inline:
  _state: label_inline
label_inline_right:
  _state: label_inline_right
label_inline_small:
  _state: label_inline_small
```

```yaml
- id: style_margin
  type: Switch
  style:
    .element:
      marginTop: 8
  properties:
    title: Styled Element
    label:
      disabled: true
- id: style_label
  type: Switch
  style:
    .label:
      fontWeight: bold
      color: "#1677ff"
  properties:
    title: Styled Label
- id: class_tailwind
  type: Switch
  class: p-2 border border-border rounded
  properties:
    title: Tailwind Classes
    label:
      disabled: true
```

```yaml
style_margin:
  _state: style_margin
style_label:
  _state: style_label
class_tailwind:
  _state: class_tailwind
```

```yaml
- id: theme_large_track
  type: Switch
  properties:
    title: Large Track
    checkedText: ON
    uncheckedText: OFF
    label:
      disabled: true
    theme:
      trackHeight: 30
      trackMinWidth: 60
      handleSize: 26
- id: theme_small_track
  type: Switch
  properties:
    title: Tiny Track
    size: small
    label:
      disabled: true
    theme:
      trackHeightSM: 12
      trackMinWidthSM: 20
      handleSizeSM: 8
- id: theme_no_shadow
  type: Switch
  properties:
    title: No Handle Shadow
    label:
      disabled: true
    theme:
      handleShadow: 0 0 0 0 transparent
- id: theme_colored_handle
  type: Switch
  properties:
    title: Colored Handle
    label:
      disabled: true
- id: theme_primary_color
  type: Switch
  properties:
    title: Custom Primary Color
    label:
      disabled: true
    theme:
      colorPrimary: "#eb2f96"
      colorPrimaryHover: "#f759ab"
```

```yaml
theme_large_track:
  _state: theme_large_track
theme_small_track:
  _state: theme_small_track
theme_no_shadow:
  _state: theme_no_shadow
theme_colored_handle:
  _state: theme_colored_handle
theme_primary_color:
  _state: theme_primary_color
```

```yaml
- id: comp_settings_card
  type: Card
  properties:
    title: Settings
    size: small
  blocks:
    - id: comp_notifications
      type: Switch
      properties:
        title: Notifications
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: comp_notifications_action
            type: SetState
            params:
              notifications_enabled:
                _state: comp_notifications
    - id: comp_auto_update
      type: Switch
      properties:
        title: Auto-update
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: comp_auto_update_action
            type: SetState
            params:
              auto_update_enabled:
                _state: comp_auto_update
    - id: comp_dark_mode
      type: Switch
      properties:
        title: Dark mode
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: comp_dark_mode_action
            type: DisplayMessage
            params:
              content: Dark mode toggled.
              duration: 2
    - id: comp_analytics
      type: Switch
      properties:
        title: Analytics
        label:
          inline: true
          span: 16
          extra: Allow anonymous usage data collection.
      events:
        onChange:
          - id: comp_analytics_action
            type: SetState
            params:
              analytics_enabled:
                _state: comp_analytics
```

```yaml
- id: comp_settings_card
  type: Card
  properties:
    title: Settings
    size: small
  blocks:
    - id: comp_notifications
      type: Switch
      properties:
        title: Notifications
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: comp_notifications_action
            type: SetState
            params:
              notifications_enabled:
                _state: comp_notifications
    - id: comp_auto_update
      type: Switch
      properties:
        title: Auto-update
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: comp_auto_update_action
            type: SetState
            params:
              auto_update_enabled:
                _state: comp_auto_update
    - id: comp_dark_mode
      type: Switch
      properties:
        title: Dark mode
        label:
          inline: true
          span: 16
      events:
        onChange:
          - id: comp_dark_mode_action
            type: DisplayMessage
            params:
              content: Dark mode toggled.
              duration: 2
    - id: comp_analytics
      type: Switch
      properties:
        title: Analytics
        label:
          inline: true
          span: 16
          extra: Allow anonymous usage data collection.
      events:
        onChange:
          - id: comp_analytics_action
            type: SetState
            params:
              analytics_enabled:
                _state: comp_analytics
```

```yaml
comp_settings_card:
  _state: comp_settings_card
```

```yaml
- id: applied2_privacy_card
  type: Card
  properties:
    title: Privacy Settings
  blocks:
    - id: applied2_privacy_profile_visible
      type: Switch
      properties:
        title: Public Profile
        checkedText: Visible
        uncheckedText: Hidden
        color: "#1677ff"
        label:
          inline: true
          span: 16
          extra: Allow other users to view your profile.
    - id: applied2_privacy_activity_status
      type: Switch
      properties:
        title: Activity Status
        checkedText: ON
        uncheckedText: OFF
        color: "#52c41a"
        label:
          inline: true
          span: 16
          extra: Show when you are online.
    - id: applied2_privacy_search_indexing
      type: Switch
      properties:
        title: Search Engine Indexing
        checkedText: Allow
        uncheckedText: Block
        color: "#fa8c16"
        label:
          inline: true
          span: 16
          extra: Allow search engines to index your profile.
    - id: applied2_privacy_data_sharing
      type: Switch
      properties:
        title: Data Sharing
        checkedText: Yes
        uncheckedText: No
        color: "#722ed1"
        label:
          inline: true
          span: 16
          extra: Share anonymous usage data to help improve the service.
    - id: applied2_privacy_save_btn
      type: Button
      properties:
        title: Save Privacy Settings
        icon: AiOutlineSave
        type: primary
        block: true
      events:
        onClick:
          - id: save_privacy_action
            type: DisplayMessage
            params:
              content: Privacy settings updated successfully.
              duration: 3
```

```yaml
applied2_privacy_card:
  _state: applied2_privacy_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `checkedIcon` | string \| object | `"AiOutlineCheck"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to shown when switch is checked (true). |
| `checkedText` | string | - | Text to shown when switch is checked (true). |
| `color` | string | - | Switch checked color. |
| `disabled` | boolean | `false` | Disable the block if true. |
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
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `uncheckedIcon` | string \| object | `"AiOutlineClose"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to shown when switch is unchecked (false). |
| `uncheckedText` | string | - | Text to shown when switch is not checked (false). |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design switch tokens](https://ant.design/components/switch#design-token). |
| `theme.trackHeight` | number | `22` | Height of the switch track. |
| `theme.trackHeightSM` | number | `16` | Height of the switch track for small size. |
| `theme.trackMinWidth` | number | `44` | Minimum width of the switch track. |
| `theme.trackMinWidthSM` | number | `28` | Minimum width of the switch track for small size. |
| `theme.trackPadding` | number | `2` | Internal padding of the switch track. |
| `theme.handleBg` | string | `"#fff"` | Background color of the switch handle. |
| `theme.handleSize` | number | `18` | Diameter of the switch handle. |
| `theme.handleSizeSM` | number | `12` | Diameter of the switch handle for small size. |
| `theme.handleShadow` | string | `"0 2px 4px 0 rgba(0,35,11,0.2)"` | Box shadow of the switch handle. |
| `theme.innerMinMargin` | number | `9` | Minimum margin for inner content (text/icon) of the switch. |
| `theme.innerMaxMargin` | number | `24` | Maximum margin for inner content (text/icon) of the switch. |
| `theme.innerMinMarginSM` | number | `6` | Minimum margin for inner content for small size. |
| `theme.innerMaxMarginSM` | number | `18` | Maximum margin for inner content for small size. |
| `theme.colorPrimary` | string | - | Primary color when the switch is checked. |
| `theme.colorPrimaryHover` | string | - | Primary color on hover when the switch is checked. |
| `theme.colorTextQuaternary` | string | - | Background color when the switch is unchecked. |
| `theme.colorTextTertiary` | string | - | Background color on hover when the switch is unchecked. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: boolean }` | Trigger action when switch is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Switch element. |
| `/checkedIcon` | The checked icon in the Switch. |
| `/label` | The Switch label. |
| `/extra` | The Switch extra content. |
| `/feedback` | The Switch validation feedback. |
| `/uncheckedIcon` | The unchecked icon in the Switch. |

No slots defined.
