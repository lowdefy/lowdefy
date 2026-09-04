# AutoComplete

Text input with auto-complete suggestions from a list of options.

```yaml
- id: basic
  type: AutoComplete
  properties:
    title: Fruit
    placeholder: Type a fruit name
    options:
      - Apple
      - Apricot
      - Avocado
      - Banana
      - Blueberry
      - Cherry
      - Grape
      - Mango
      - Orange
      - Peach
- id: basic_countries
  type: AutoComplete
  properties:
    title: Country
    placeholder: Search countries
    options:
      - Australia
      - Austria
      - Belgium
      - Brazil
      - Canada
      - Denmark
      - France
      - Germany
      - Japan
      - United Kingdom
      - United States
```

```yaml
basic:
  _state: basic
basic_countries:
  _state: basic_countries
```

```yaml
- id: size_small
  type: AutoComplete
  properties:
    title: Small
    size: small
    placeholder: Type to search
    options:
      - Apple
      - Banana
      - Cherry
- id: size_default
  type: AutoComplete
  properties:
    title: Default
    placeholder: Type to search
    options:
      - Apple
      - Banana
      - Cherry
- id: size_large
  type: AutoComplete
  properties:
    title: Large
    size: large
    placeholder: Type to search
    options:
      - Apple
      - Banana
      - Cherry
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
- id: allow_clear_true
  type: AutoComplete
  properties:
    title: With Clear Button (default)
    allowClear: true
    placeholder: Select and clear
    options:
      - Option A
      - Option B
      - Option C
- id: allow_clear_false
  type: AutoComplete
  properties:
    title: Without Clear Button
    allowClear: false
    placeholder: No clear button
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
allow_clear_true:
  _state: allow_clear_true
allow_clear_false:
  _state: allow_clear_false
```

```yaml
- id: backfill_enabled
  type: AutoComplete
  properties:
    title: Backfill Enabled
    backfill: true
    placeholder: Use arrow keys to backfill
    options:
      - JavaScript
      - TypeScript
      - Python
      - Ruby
      - Go
      - Rust
- id: backfill_disabled
  type: AutoComplete
  properties:
    title: Backfill Disabled (default)
    backfill: false
    placeholder: Arrow keys highlight only
    options:
      - JavaScript
      - TypeScript
      - Python
      - Ruby
      - Go
      - Rust
```

```yaml
backfill_enabled:
  _state: backfill_enabled
backfill_disabled:
  _state: backfill_disabled
```

```yaml
- id: default_open_true
  type: AutoComplete
  properties:
    title: Dropdown Open on Render
    defaultOpen: true
    placeholder: Dropdown visible immediately
    options:
      - Red
      - Green
      - Blue
      - Yellow
      - Purple
```

```yaml
default_open_true:
  _state: default_open_true
```

```yaml
- id: placeholder_custom
  type: AutoComplete
  properties:
    title: Custom Placeholder
    placeholder: Start typing to search languages...
    options:
      - JavaScript
      - TypeScript
      - Python
      - Ruby
      - Java
      - C++
- id: placeholder_default
  type: AutoComplete
  properties:
    title: Default Placeholder
    options:
      - Alpha
      - Beta
      - Gamma
      - Delta
```

```yaml
placeholder_custom:
  _state: placeholder_custom
placeholder_default:
  _state: placeholder_default
```

```yaml
- id: variant_outlined
  type: AutoComplete
  properties:
    title: Outlined (default)
    variant: outlined
    placeholder: Standard border
    options:
      - Option A
      - Option B
      - Option C
- id: variant_filled
  type: AutoComplete
  properties:
    title: Filled
    variant: filled
    placeholder: Filled background
    options:
      - Option A
      - Option B
      - Option C
- id: variant_borderless
  type: AutoComplete
  properties:
    title: Borderless
    variant: borderless
    placeholder: No border style
    options:
      - Option A
      - Option B
      - Option C
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
- id: disabled_true
  type: AutoComplete
  properties:
    title: Disabled
    disabled: true
    placeholder: Cannot interact
    options:
      - Option A
      - Option B
      - Option C
- id: disabled_false
  type: AutoComplete
  properties:
    title: Enabled (default)
    disabled: false
    placeholder: Can interact
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
disabled_true:
  _state: disabled_true
disabled_false:
  _state: disabled_false
```

```yaml
- id: autofocus_true
  type: AutoComplete
  properties:
    title: AutoFocus Enabled
    autoFocus: true
    placeholder: Focused on page load
    options:
      - Mercury
      - Venus
      - Earth
      - Mars
      - Jupiter
      - Saturn
```

```yaml
autofocus_true:
  _state: autofocus_true
```

```yaml
- id: many_options
  type: AutoComplete
  properties:
    title: Programming Languages
    placeholder: Type to filter languages
    options:
      - Assembly
      - Bash
      - C
      - C++
      - C#
      - Clojure
      - COBOL
      - Dart
      - Elixir
      - Erlang
      - F#
      - Fortran
      - Go
      - Groovy
      - Haskell
      - Java
      - JavaScript
      - Julia
      - Kotlin
      - Lisp
      - Lua
      - MATLAB
      - Objective-C
      - OCaml
      - Pascal
      - Perl
      - PHP
      - PowerShell
      - Python
      - R
      - Ruby
      - Rust
      - Scala
      - Shell
      - SQL
      - Swift
      - TypeScript
      - VBA
      - Zig
```

```yaml
many_options:
  _state: many_options
```

```yaml
- id: label_title
  type: AutoComplete
  properties:
    title: Custom Label Title
    label:
      title: Choose a color
    placeholder: Type a color
    options:
      - Red
      - Green
      - Blue
      - Yellow
- id: label_extra
  type: AutoComplete
  properties:
    title: Label with Extra
    label:
      title: City
      extra: Select the city you live in
    placeholder: Type a city name
    options:
      - New York
      - London
      - Tokyo
      - Paris
      - Berlin
      - Sydney
- id: label_no_colon
  type: AutoComplete
  properties:
    title: Label without Colon
    label:
      title: Animal
      colon: false
    placeholder: Type an animal
    options:
      - Cat
      - Dog
      - Elephant
      - Giraffe
      - Lion
- id: label_inline
  type: AutoComplete
  properties:
    title: Inline Label
    label:
      title: Framework
      inline: true
      span: 8
    placeholder: Type to search
    options:
      - React
      - Vue
      - Angular
      - Svelte
      - Solid
- id: label_inline_right
  type: AutoComplete
  properties:
    title: Inline Label Right Aligned
    label:
      title: Database
      inline: true
      span: 8
      align: right
    placeholder: Type to search
    options:
      - PostgreSQL
      - MySQL
      - MongoDB
      - Redis
      - SQLite
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
label_inline_right:
  _state: label_inline_right
```

```yaml
- id: label_hidden
  type: AutoComplete
  properties:
    label:
      disabled: true
    placeholder: No label displayed
    options:
      - Option A
      - Option B
      - Option C
- id: label_hidden_large
  type: AutoComplete
  properties:
    label:
      disabled: true
    size: large
    placeholder: Large with no label
    options:
      - First
      - Second
      - Third
```

```yaml
label_hidden:
  _state: label_hidden
label_hidden_large:
  _state: label_hidden_large
```

```yaml
- id: style_element
  type: AutoComplete
  style:
    .element:
      borderColor: "#722ed1"
  properties:
    title: Custom Border Color
    placeholder: Purple border
    options:
      - Option A
      - Option B
      - Option C
- id: style_background
  type: AutoComplete
  style:
    .element: null
  properties:
    title: Custom Background
    placeholder: Light green background
    options:
      - Option A
      - Option B
      - Option C
- id: style_label
  type: AutoComplete
  style:
    .label:
      fontWeight: bold
      color: "#1677ff"
  properties:
    title: Styled Label
    placeholder: Blue bold label
    options:
      - Option A
      - Option B
      - Option C
```

```yaml
style_element:
  _state: style_element
style_background:
  _state: style_background
style_label:
  _state: style_label
```

```yaml
- id: class_element
  type: AutoComplete
  class:
    element: rounded-lg shadow-sm
  properties:
    title: Custom Class
    placeholder: Tailwind classes applied
    options:
      - JavaScript
      - TypeScript
      - Python
```

```yaml
class_element:
  _state: class_element
```

```yaml
- id: theme_border_radius
  type: AutoComplete
  properties:
    title: Large Border Radius
    placeholder: Rounded corners
    options:
      - Option A
      - Option B
      - Option C
    theme:
      borderRadius: 16
- id: theme_font_size
  type: AutoComplete
  properties:
    title: Large Font Size
    placeholder: Bigger text
    options:
      - Option A
      - Option B
      - Option C
    theme:
      fontSize: 18
- id: theme_custom_colors
  type: AutoComplete
  properties:
    title: Custom Colors
    placeholder: Styled with theme tokens
    options:
      - Red
      - Green
      - Blue
    theme:
      colorPrimary: "#722ed1"
      colorPrimaryHover: "#9254de"
- id: theme_option_selected
  type: AutoComplete
  properties:
    title: Custom Selected Option Style
    placeholder: Custom option highlight
    options:
      - Apple
      - Banana
      - Cherry
      - Dragonfruit
    theme:
      optionSelectedColor: "#531dab"
      optionSelectedFontWeight: 700
- id: theme_option_height
  type: AutoComplete
  properties:
    title: Taller Options
    placeholder: Taller dropdown items
    options:
      - First Item
      - Second Item
      - Third Item
    theme:
      optionHeight: 44
      optionFontSize: 16
- id: theme_control_height
  type: AutoComplete
  properties:
    title: Custom Control Height
    placeholder: Taller input
    options:
      - Option A
      - Option B
      - Option C
    theme:
      controlHeight: 44
      controlHeightLG: 52
- id: theme_combined
  type: AutoComplete
  properties:
    title: Combined Token Overrides
    placeholder: Multiple tokens combined
    options:
      - React
      - Vue
      - Angular
      - Svelte
    theme:
      borderRadius: 12
      colorPrimary: "#52c41a"
      colorPrimaryHover: "#73d13d"
      fontSize: 15
      controlHeight: 40
```

```yaml
theme_border_radius:
  _state: theme_border_radius
theme_font_size:
  _state: theme_font_size
theme_custom_colors:
  _state: theme_custom_colors
theme_option_selected:
  _state: theme_option_selected
theme_option_height:
  _state: theme_option_height
theme_control_height:
  _state: theme_control_height
theme_combined:
  _state: theme_combined
```

```yaml
- id: disabled_small
  type: AutoComplete
  properties:
    title: Disabled Small
    size: small
    disabled: true
    placeholder: Disabled small
    options:
      - Alpha
      - Beta
- id: disabled_default
  type: AutoComplete
  properties:
    title: Disabled Default
    disabled: true
    placeholder: Disabled default
    options:
      - Alpha
      - Beta
- id: disabled_large
  type: AutoComplete
  properties:
    title: Disabled Large
    size: large
    disabled: true
    placeholder: Disabled large
    options:
      - Alpha
      - Beta
```

```yaml
disabled_small:
  _state: disabled_small
disabled_default:
  _state: disabled_default
disabled_large:
  _state: disabled_large
```

```yaml
- id: filled_small
  type: AutoComplete
  properties:
    title: Filled Small
    size: small
    variant: filled
    placeholder: Filled small
    options:
      - One
      - Two
      - Three
- id: filled_default
  type: AutoComplete
  properties:
    title: Filled Default
    variant: filled
    placeholder: Filled default
    options:
      - One
      - Two
      - Three
- id: filled_large
  type: AutoComplete
  properties:
    title: Filled Large
    size: large
    variant: filled
    placeholder: Filled large
    options:
      - One
      - Two
      - Three
```

```yaml
filled_small:
  _state: filled_small
filled_default:
  _state: filled_default
filled_large:
  _state: filled_large
```

```yaml
- id: applied_search_form
  type: Card
  properties:
    title: Product Search
  blocks:
    - id: applied_search_input
      type: AutoComplete
      properties:
        title: Search Products
        placeholder: Start typing a product name...
        size: large
        options:
          - MacBook Pro 16"
          - MacBook Air M3
          - iPad Pro 13"
          - iPhone 16 Pro
          - Apple Watch Ultra
          - AirPods Pro
      events:
        onChange:
          - id: search_message
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Searching for: "
                  - _state: applied_search_input
              duration: 1
    - id: applied_search_button
      type: Button
      properties:
        title: Search
        icon: AiOutlineSearch
        type: primary
        size: large
      events:
        onClick:
          - id: search_action
            type: DisplayMessage
            params:
              content:
                _if:
                  test:
                    _ne:
                      - _state: applied_search_input
                      - null
                  then:
                    _string.concat:
                      - "Searching for: "
                      - _state: applied_search_input
                  else: Please enter a search term
```

```yaml
- id: applied_search_form
  type: Card
  properties:
    title: Product Search
  blocks:
    - id: applied_search_input
      type: AutoComplete
      properties:
        title: Search Products
        placeholder: Start typing a product name...
        size: large
        options:
          - MacBook Pro 16"
          - MacBook Air M3
          - iPad Pro 13"
          - iPhone 16 Pro
          - Apple Watch Ultra
          - AirPods Pro
      events:
        onChange:
          - id: search_message
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Searching for: "
                  - _state: applied_search_input
              duration: 1
    - id: applied_search_button
      type: Button
      properties:
        title: Search
        icon: AiOutlineSearch
        type: primary
        size: large
      events:
        onClick:
          - id: search_action
            type: DisplayMessage
            params:
              content:
                _if:
                  test:
                    _ne:
                      - _state: applied_search_input
                      - null
                  then:
                    _string.concat:
                      - "Searching for: "
                      - _state: applied_search_input
                  else: Please enter a search term
```

```yaml
applied_search_form:
  _state: applied_search_form
```

```yaml
- id: applied_profile_card
  type: Card
  properties:
    title: Profile Settings
  blocks:
    - id: applied_profile_name
      type: TextInput
      properties:
        title: Full Name
        placeholder: Enter your full name
    - id: applied_profile_role
      type: AutoComplete
      properties:
        title: Job Title
        label:
          extra: Select a common title or type your own
        placeholder: e.g. Software Engineer
        options:
          - Software Engineer
          - Senior Software Engineer
          - Staff Engineer
          - Engineering Manager
          - Product Manager
          - Designer
          - Data Scientist
          - DevOps Engineer
          - QA Engineer
          - Technical Lead
    - id: applied_profile_department
      type: AutoComplete
      properties:
        title: Department
        placeholder: Select or type department
        options:
          - Engineering
          - Product
          - Design
          - Marketing
          - Sales
          - Operations
          - Finance
          - Human Resources
    - id: applied_profile_save
      type: Button
      properties:
        title: Save Profile
        type: primary
        icon: AiOutlineSave
      events:
        onClick:
          - id: save_action
            type: DisplayMessage
            params:
              content: Profile saved successfully
              status: success
```

```yaml
applied_profile_card:
  _state: applied_profile_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `true` | Allow the user to clear the selected value, sets the value to null. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Whether or not the input has a border style. Deprecated, use variant instead. |
| `backfill` | boolean | `false` | Backfill selected item the input when using keyboard |
| `defaultOpen` | boolean | `false` | Initial open state of dropdown. |
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
| `options` | array | `[]` | Options can either be an array of string values. |
| `placeholder` | string | `"Type or select item"` | Placeholder text inside the block before user selects input. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed. |
| `variant` | string | - | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design select tokens](https://ant.design/components/select#design-token). |
| `theme.borderRadius` | number | `6` | Border radius of the input. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large size. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small size. |
| `theme.controlHeight` | number | `32` | Height of the input. |
| `theme.controlHeightLG` | number | `40` | Height for large size. |
| `theme.controlHeightSM` | number | `24` | Height for small size. |
| `theme.fontSize` | number | `14` | Font size of the input text. |
| `theme.fontSizeLG` | number | `16` | Font size for large size. |
| `theme.fontSizeSM` | number | `14` | Font size for small size. |
| `theme.colorPrimary` | string | - | Primary color, used for focus border and active state. |
| `theme.colorPrimaryHover` | string | - | Primary hover color, used for hover border state. |
| `theme.colorBgContainer` | string | `"#ffffff"` | Background color of the selector. |
| `theme.colorBgElevated` | string | `"#ffffff"` | Background color of the dropdown. |
| `theme.colorText` | string | - | Text color of the input. |
| `theme.colorTextPlaceholder` | string | - | Placeholder text color. |
| `theme.colorTextDisabled` | string | - | Text color when disabled. |
| `theme.colorBorder` | string | - | Border color of the input. |
| `theme.hoverBorderColor` | string | - | Border color when hovered. |
| `theme.activeBorderColor` | string | - | Border color when focused/active. |
| `theme.activeOutlineColor` | string | - | Outline color when focused. |
| `theme.clearBg` | string | `"#ffffff"` | Background color of the clear button. |
| `theme.optionSelectedBg` | string | `"#e6f4ff"` | Background color of the selected option. |
| `theme.optionSelectedColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of the selected option. |
| `theme.optionSelectedFontWeight` | number | `600` | Font weight of the selected option. |
| `theme.optionActiveBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of the active (hovered) option. |
| `theme.optionFontSize` | number | `14` | Font size of dropdown option text. |
| `theme.optionHeight` | number | `32` | Height of each dropdown option. |
| `theme.optionLineHeight` | number | - | Line height of dropdown option text. |
| `theme.optionPadding` | string \| number | `"5px 12px"` | Padding of each dropdown option. |
| `theme.selectorBg` | string | `"#ffffff"` | Background color of the selector input. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the dropdown popup. |
| `theme.showArrowPaddingInlineEnd` | number | `18` | Right padding when the arrow icon is shown. |
| `theme.lineWidth` | number | `1` | Border width of the input. |
| `theme.paddingInline` | number | `11` | Horizontal padding of the input. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBlur` | \- | Trigger action event occurs when selector loses focus. |
| `onChange` | `{ value: string }` | Trigger actions when selection is changed. |
| `onFocus` | \- | Trigger action when an selector gets focus. |
| `onClear` | \- | Trigger action when selector gets cleared. |
| `onSearch` | `{ value: string }` | Called when searching items. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The AutoComplete element. |
| `/selector` | The inner value container of the AutoComplete (antd `content` semantic slot). |
| `/label` | The AutoComplete label. |
| `/extra` | The AutoComplete extra content. |
| `/feedback` | The AutoComplete validation feedback. |
| `/options` | The AutoComplete options. |

No slots defined.
