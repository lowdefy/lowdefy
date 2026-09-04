# TextArea

Multi-line text input with auto-sizing, character count, and clear button.

```yaml
- id: size_small
  type: TextArea
  properties:
    title: Small
    size: small
    placeholder: Small textarea
- id: size_middle
  type: TextArea
  properties:
    title: Middle (Default)
    size: middle
    placeholder: Middle textarea
- id: size_large
  type: TextArea
  properties:
    title: Large
    size: large
    placeholder: Large textarea
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
- id: placeholder_default
  type: TextArea
  properties:
    title: With Placeholder
    placeholder: Enter your comments here...
- id: placeholder_long
  type: TextArea
  properties:
    title: Descriptive Placeholder
    placeholder: Please provide a detailed description of the issue you encountered,
      including steps to reproduce, expected behavior, and actual behavior.
- id: placeholder_none
  type: TextArea
  properties:
    title: No Placeholder
    label:
      extra: TextArea with no placeholder text.
```

```yaml
placeholder_default:
  _state: placeholder_default
placeholder_long:
  _state: placeholder_long
placeholder_none:
  _state: placeholder_none
```

```yaml
- id: rows_1
  type: TextArea
  properties:
    title: 1 Row
    rows: 1
    placeholder: Single row
- id: rows_2
  type: TextArea
  properties:
    title: 2 Rows
    rows: 2
    placeholder: Two rows
- id: rows_3
  type: TextArea
  properties:
    title: 3 Rows (Default)
    placeholder: Three rows (default when no rows or autoSize specified)
- id: rows_4
  type: TextArea
  properties:
    title: 4 Rows
    rows: 4
    placeholder: Four rows
- id: rows_6
  type: TextArea
  properties:
    title: 6 Rows
    rows: 6
    placeholder: Six rows
- id: rows_10
  type: TextArea
  properties:
    title: 10 Rows
    rows: 10
    placeholder: Ten rows - suitable for large text content
```

```yaml
rows_1:
  _state: rows_1
rows_2:
  _state: rows_2
rows_3:
  _state: rows_3
rows_4:
  _state: rows_4
rows_6:
  _state: rows_6
rows_10:
  _state: rows_10
```

```yaml
- id: auto_size_true
  type: TextArea
  properties:
    title: Auto Size Enabled
    autoSize: true
    placeholder: Start typing and the textarea will grow automatically as you add
      more lines of text
- id: auto_size_false
  type: TextArea
  properties:
    title: Auto Size Disabled (Default)
    autoSize: false
    placeholder: Fixed height, does not grow
```

```yaml
auto_size_true:
  _state: auto_size_true
auto_size_false:
  _state: auto_size_false
```

```yaml
- id: auto_size_min2_max4
  type: TextArea
  properties:
    title: Min 2, Max 4 Rows
    autoSize:
      minRows: 2
      maxRows: 4
    placeholder: Grows from 2 to 4 rows
- id: auto_size_min3_max6
  type: TextArea
  properties:
    title: Min 3, Max 6 Rows
    autoSize:
      minRows: 3
      maxRows: 6
    placeholder: Grows from 3 to 6 rows
- id: auto_size_min1_max10
  type: TextArea
  properties:
    title: Min 1, Max 10 Rows
    autoSize:
      minRows: 1
      maxRows: 10
    placeholder: Compact start, generous max
- id: auto_size_min5_max5
  type: TextArea
  properties:
    title: Min 5, Max 5 Rows (Fixed via autoSize)
    autoSize:
      minRows: 5
      maxRows: 5
    placeholder: Fixed at exactly 5 rows using autoSize object
- id: auto_size_min_only
  type: TextArea
  properties:
    title: Min 2 Rows (No Max)
    autoSize:
      minRows: 2
    placeholder: Starts at 2 rows, grows indefinitely
```

```yaml
auto_size_min2_max4:
  _state: auto_size_min2_max4
auto_size_min3_max6:
  _state: auto_size_min3_max6
auto_size_min1_max10:
  _state: auto_size_min1_max10
auto_size_min5_max5:
  _state: auto_size_min5_max5
auto_size_min_only:
  _state: auto_size_min_only
```

```yaml
- id: allow_clear_true
  type: TextArea
  properties:
    title: Allow Clear Enabled
    allowClear: true
    placeholder: Type something then click the clear icon
- id: allow_clear_false
  type: TextArea
  properties:
    title: Allow Clear Disabled (Default)
    allowClear: false
    placeholder: No clear icon will appear
- id: allow_clear_with_rows
  type: TextArea
  properties:
    title: Allow Clear with 4 Rows
    allowClear: true
    rows: 4
    placeholder: Clearable with 4 rows
```

```yaml
allow_clear_true:
  _state: allow_clear_true
allow_clear_false:
  _state: allow_clear_false
allow_clear_with_rows:
  _state: allow_clear_with_rows
```

```yaml
- id: show_count_basic
  type: TextArea
  properties:
    title: Show Count
    showCount: true
    placeholder: Character count displayed below
- id: show_count_with_max
  type: TextArea
  properties:
    title: Show Count with Max Length (100)
    showCount: true
    maxLength: 100
    placeholder: Max 100 characters
- id: show_count_max_200
  type: TextArea
  properties:
    title: Show Count with Max Length (200)
    showCount: true
    maxLength: 200
    placeholder: Max 200 characters
- id: show_count_max_50
  type: TextArea
  properties:
    title: Show Count with Max Length (50)
    showCount: true
    maxLength: 50
    placeholder: Short limit - 50 characters
- id: show_count_false
  type: TextArea
  properties:
    title: Show Count Disabled (Default)
    showCount: false
    placeholder: No character count
```

```yaml
show_count_basic:
  _state: show_count_basic
show_count_with_max:
  _state: show_count_with_max
show_count_max_200:
  _state: show_count_max_200
show_count_max_50:
  _state: show_count_max_50
show_count_false:
  _state: show_count_false
```

```yaml
- id: max_length_20
  type: TextArea
  properties:
    title: Max 20 Characters
    maxLength: 20
    placeholder: Limited to 20 characters
- id: max_length_500
  type: TextArea
  properties:
    title: Max 500 Characters
    maxLength: 500
    placeholder: Limited to 500 characters
- id: max_length_with_count
  type: TextArea
  properties:
    title: Max 150 with Count
    maxLength: 150
    showCount: true
    placeholder: Shows count and limits input
```

```yaml
max_length_20:
  _state: max_length_20
max_length_500:
  _state: max_length_500
max_length_with_count:
  _state: max_length_with_count
```

```yaml
- id: bordered_true
  type: TextArea
  properties:
    title: Bordered (Default)
    bordered: true
    placeholder: Standard bordered textarea
- id: bordered_false
  type: TextArea
  properties:
    title: Borderless
    bordered: false
    placeholder: No border style
- id: borderless_with_rows
  type: TextArea
  properties:
    title: Borderless with 6 Rows
    bordered: false
    rows: 6
    placeholder: Larger borderless textarea
```

```yaml
bordered_true:
  _state: bordered_true
bordered_false:
  _state: bordered_false
borderless_with_rows:
  _state: borderless_with_rows
```

```yaml
- id: disabled_empty
  type: TextArea
  properties:
    title: Disabled (Empty)
    disabled: true
    placeholder: Cannot edit this field
- id: disabled_with_value
  type: TextArea
  properties:
    title: Disabled (With Value)
    disabled: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_with_value: This textarea is disabled and contains pre-filled content
            that cannot be edited.
- id: disabled_with_rows
  type: TextArea
  properties:
    title: Disabled with 6 Rows
    disabled: true
    rows: 6
    placeholder: Cannot edit
- id: disabled_borderless
  type: TextArea
  properties:
    title: Disabled & Borderless
    disabled: true
    bordered: false
    placeholder: Disabled without border
```

```yaml
disabled_empty:
  _state: disabled_empty
disabled_with_value:
  _state: disabled_with_value
disabled_with_rows:
  _state: disabled_with_rows
disabled_borderless:
  _state: disabled_borderless
```

```yaml
- id: label_default
  type: TextArea
  properties:
    title: Default Label
    placeholder: Standard label above
- id: label_custom_title
  type: TextArea
  properties:
    title: Custom Title
    label:
      title: <b>Bold Label</b> with HTML
    placeholder: Label supports HTML content
- id: label_with_extra
  type: TextArea
  properties:
    title: Label with Extra
    label:
      extra: This is extra helper text below the textarea.
    placeholder: Extra text appears below
- id: label_with_colon
  type: TextArea
  properties:
    title: With Colon
    label:
      colon: true
    placeholder: Colon appended to label
- id: label_no_colon
  type: TextArea
  properties:
    title: Without Colon
    label:
      colon: false
    placeholder: No colon on label
```

```yaml
label_default:
  _state: label_default
label_custom_title:
  _state: label_custom_title
label_with_extra:
  _state: label_with_extra
label_with_colon:
  _state: label_with_colon
label_no_colon:
  _state: label_no_colon
```

```yaml
- id: label_inline
  type: TextArea
  properties:
    title: Inline Label
    label:
      inline: true
    placeholder: Label and input on the same line
- id: label_inline_right
  type: TextArea
  properties:
    title: Inline Right Aligned
    label:
      inline: true
      align: right
    placeholder: Right-aligned inline label
- id: label_inline_span
  type: TextArea
  properties:
    title: Inline with Span
    label:
      inline: true
      span: 8
    placeholder: Custom label span width
- id: label_inline_extra
  type: TextArea
  properties:
    title: Inline with Extra
    label:
      inline: true
      extra: Helper text beneath inline textarea.
    placeholder: Inline with extra text
```

```yaml
label_inline:
  _state: label_inline
label_inline_right:
  _state: label_inline_right
label_inline_span:
  _state: label_inline_span
label_inline_extra:
  _state: label_inline_extra
```

```yaml
- id: label_disabled
  type: TextArea
  properties:
    title: Hidden Label
    label:
      disabled: true
    placeholder: Label is hidden but title still set
- id: label_feedback_disabled
  type: TextArea
  properties:
    title: No Feedback
    label:
      hasFeedback: false
    placeholder: Validation feedback text will not appear
```

```yaml
label_disabled:
  _state: label_disabled
label_feedback_disabled:
  _state: label_feedback_disabled
```

```yaml
- id: combo_count_autosize
  type: TextArea
  properties:
    title: Count + Auto Size
    showCount: true
    maxLength: 300
    autoSize:
      minRows: 2
      maxRows: 8
    placeholder: Auto-growing textarea with character count
- id: combo_count_autosize_clear
  type: TextArea
  properties:
    title: Count + Auto Size + Clear
    showCount: true
    maxLength: 500
    autoSize:
      minRows: 3
      maxRows: 10
    allowClear: true
    placeholder: All features combined
```

```yaml
combo_count_autosize:
  _state: combo_count_autosize
combo_count_autosize_clear:
  _state: combo_count_autosize_clear
```

```yaml
- id: combo_small_2rows
  type: TextArea
  properties:
    title: Small with 2 Rows
    size: small
    rows: 2
    placeholder: Compact small textarea
- id: combo_large_6rows
  type: TextArea
  properties:
    title: Large with 6 Rows
    size: large
    rows: 6
    placeholder: Spacious large textarea
- id: combo_large_autosize
  type: TextArea
  properties:
    title: Large with Auto Size
    size: large
    autoSize:
      minRows: 2
      maxRows: 6
    placeholder: Large auto-growing textarea
```

```yaml
combo_small_2rows:
  _state: combo_small_2rows
combo_large_6rows:
  _state: combo_large_6rows
combo_large_autosize:
  _state: combo_large_autosize
```

```yaml
- id: combo_disabled_count
  type: TextArea
  properties:
    title: Disabled with Count
    disabled: true
    showCount: true
    maxLength: 200
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combo_disabled_count: Pre-filled disabled text
- id: combo_disabled_clear
  type: TextArea
  properties:
    title: Disabled with Allow Clear
    disabled: true
    allowClear: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combo_disabled_clear: You cannot clear this
- id: combo_disabled_borderless_value
  type: TextArea
  properties:
    title: Disabled Borderless with Value
    disabled: true
    bordered: false
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combo_disabled_borderless_value: Disabled borderless text content that is read-only.
```

```yaml
combo_disabled_count:
  _state: combo_disabled_count
combo_disabled_clear:
  _state: combo_disabled_clear
combo_disabled_borderless_value:
  _state: combo_disabled_borderless_value
```

```yaml
- id: usecase_feedback
  type: TextArea
  properties:
    title: Your Feedback
    placeholder: Tell us what you think about our product...
    autoSize:
      minRows: 3
      maxRows: 8
    showCount: true
    maxLength: 1000
    allowClear: true
    label:
      extra: Please be specific with your feedback. Maximum 1000 characters.
```

```yaml
usecase_feedback:
  _state: usecase_feedback
```

```yaml
- id: usecase_code
  type: TextArea
  properties:
    title: JSON Configuration
    rows: 8
    placeholder: |
      {
        "key": "value",
        "nested": {
          "property": true
        }
      }
    label:
      extra: Paste your JSON configuration here.
```

```yaml
usecase_code:
  _state: usecase_code
```

```yaml
- id: usecase_notes
  type: TextArea
  properties:
    title: Notes
    rows: 4
    placeholder: Add optional notes...
    allowClear: true
    label:
      colon: false
```

```yaml
usecase_notes:
  _state: usecase_notes
```

```yaml
- id: usecase_bio
  type: TextArea
  properties:
    title: Bio
    placeholder: Write a short bio about yourself...
    showCount: true
    maxLength: 250
    autoSize:
      minRows: 2
      maxRows: 5
    label:
      extra: A brief description shown on your profile.
```

```yaml
usecase_bio:
  _state: usecase_bio
```

```yaml
- id: css_element
  type: TextArea
  properties:
    title: Custom Element Style
    placeholder: Styled textarea element
  style:
    .element:
      borderColor: "#597ef7"
      borderRadius: 8
- id: css_label
  type: TextArea
  properties:
    title: Custom Label Style
    placeholder: Styled label text
  style:
    .label:
      color: "#531dab"
      fontWeight: bold
      fontSize: 16
- id: css_extra
  type: TextArea
  properties:
    title: Styled Extra Text
    placeholder: Extra text below is styled
    label:
      extra: This extra text has custom styling.
  style:
    .extra:
      color: "#08979c"
      fontStyle: italic
- id: css_combined
  type: TextArea
  properties:
    title: Combined CSS Styles
    placeholder: Multiple style keys applied
    label:
      extra: Custom styled textarea with extra text.
  style:
    .element:
      borderColor: "#ffa940"
    .label:
      color: "#d46b08"
      fontWeight: 600
    .extra:
      color: "#ad6800"
```

```yaml
css_element:
  _state: css_element
css_label:
  _state: css_label
css_extra:
  _state: css_extra
css_combined:
  _state: css_combined
```

```yaml
- id: class_rounded
  type: TextArea
  class: rounded-lg shadow-md
  properties:
    title: Rounded with Shadow
    placeholder: Using Tailwind classes
- id: class_border
  type: TextArea
  class: border-2 border-blue-400 rounded-md
  properties:
    title: Blue Border
    placeholder: Tailwind border classes
    label:
      disabled: true
```

```yaml
class_rounded:
  _state: class_rounded
class_border:
  _state: class_border
```

```yaml
- id: theme_active_border
  type: TextArea
  properties:
    title: Custom Active Border Color
    placeholder: Click to see custom focus color
    theme:
      colorPrimary: "#722ed1"
- id: theme_font_size
  type: TextArea
  properties:
    title: Larger Font Size
    placeholder: 18px font size
    theme:
      fontSize: 18
- id: theme_padding_combined
  type: TextArea
  properties:
    title: Custom Padding (Both)
    placeholder: Extra padding in both directions
    theme:
      paddingInline: 24
      paddingBlock: 16
- id: theme_purple
  type: TextArea
  properties:
    title: Purple Theme
    placeholder: Purple-themed textarea
    theme:
      colorPrimary: "#722ed1"
      colorPrimaryHover: "#9254de"
      colorBorder: "#d3adf7"
      borderRadius: 12
- id: theme_warm
  type: TextArea
  properties:
    title: Warm Theme
    placeholder: Warm-themed textarea
    theme:
      colorPrimary: "#d4380d"
      colorPrimaryHover: "#ff7a45"
      colorBorder: "#ffbb96"
      borderRadius: 10
      fontSize: 15
```

```yaml
theme_active_border:
  _state: theme_active_border
theme_font_size:
  _state: theme_font_size
theme_padding_combined:
  _state: theme_padding_combined
theme_purple:
  _state: theme_purple
theme_warm:
  _state: theme_warm
```

```yaml
- id: auto_focus_false
  type: TextArea
  properties:
    title: No Auto Focus (Default)
    autoFocus: false
    placeholder: Does not auto focus
```

```yaml
auto_focus_false:
  _state: auto_focus_false
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `false` | Allow the user to clear their input. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `autoSize` | boolean \| object | - | autoSize can either be a boolean value, or an object with minimum and maximum rows.  Defining autoSize disables any prefix or suffix defined. |
| `autoSize.minRows` | integer | - | Minimum number of rows the block can be. |
| `autoSize.maxRows` | integer | - | Maximum number of rows the block can be. |
| `bordered` | boolean | `true` | Whether or not the textarea has a border style. Deprecated, use variant instead. |
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
| `maxLength` | integer | - | The max number of input characters. |
| `placeholder` | string | - | Placeholder text inside the block before user types input. |
| `rows` | integer | - | Number of rows in the block, should be greater or equal to 1. Defining rows disables any prefix. |
| `size` | string | `"middle"` | Size of the block. Enum: `small`, `middle`, `large`. |
| `showCount` | boolean \| object | `false` | Show input character count. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | string | - | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design input tokens](https://ant.design/components/input#design-token). |
| `theme.activeBorderColor` | string | - | Border color when the input is active/focused. |
| `theme.hoverBorderColor` | string | - | Border color when the input is hovered. |
| `theme.activeShadow` | string | - | Box shadow when the input is active/focused. |
| `theme.errorActiveShadow` | string | - | Box shadow when the input is active in error status. |
| `theme.warningActiveShadow` | string | - | Box shadow when the input is active in warning status. |
| `theme.addonBg` | string | - | Background color of addon elements. |
| `theme.hoverBg` | string | - | Background color on hover. |
| `theme.activeBg` | string | - | Background color when active/focused. |
| `theme.paddingBlock` | number | `4` | Vertical padding for the input. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for the small input. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for the large input. |
| `theme.paddingInline` | number | `11` | Horizontal padding for the input. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for the small input. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for the large input. |
| `theme.inputFontSize` | number | `14` | Font size for the input. |
| `theme.inputFontSizeSM` | number | `14` | Font size for the small input. |
| `theme.inputFontSizeLG` | number | `16` | Font size for the large input. |
| `theme.borderRadius` | number | `6` | Border radius of the input. |
| `theme.borderRadiusLG` | number | `8` | Border radius for the large input. |
| `theme.borderRadiusSM` | number | `4` | Border radius for the small input. |
| `theme.colorPrimary` | string | - | Primary color override, affects focus border color. |
| `theme.colorPrimaryHover` | string | - | Primary hover color, affects hover border color. |
| `theme.colorBgContainer` | string | - | Background color of the input container. |
| `theme.colorText` | string | - | Text color of the input. |
| `theme.colorBorder` | string | - | Border color of the input. |
| `theme.colorTextPlaceholder` | string | - | Color of the placeholder text. |
| `theme.colorTextDisabled` | string | - | Text color when the input is disabled. |
| `theme.colorBgContainerDisabled` | string | - | Background color when the input is disabled. |
| `theme.fontSize` | number | `14` | Base font size. |
| `theme.fontSizeLG` | number | `16` | Font size for the large variant. |
| `theme.lineWidth` | number | `1` | Border width. |

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
| `/element` | The TextArea element. |
| `/label` | The TextArea label. |
| `/extra` | The TextArea extra content. |
| `/feedback` | The TextArea validation feedback. |

No slots defined.
