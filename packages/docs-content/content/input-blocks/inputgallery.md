# Input Gallery

A visual reference of every input block available in Lowdefy. Each section shows representative examples with their config.

```yaml
- id: ig_text_default
  type: TextInput
  properties:
    label:
      title: TextInput
    placeholder: Type something...
- id: ig_text_prefix
  type: TextInput
  properties:
    label:
      title: With prefix icon
    prefixIcon: AiOutlineUser
    placeholder: Username
- id: ig_text_count
  type: TextInput
  properties:
    label:
      title: With character count
    showCount: true
    maxLength: 50
- id: ig_password
  type: PasswordInput
  properties:
    label:
      title: PasswordInput
    placeholder: Enter password
- id: ig_number
  type: NumberInput
  properties:
    label:
      title: NumberInput
    placeholder: Enter a number
    min: 0
    max: 100
    step: 1
- id: ig_number_no_controls
  type: NumberInput
  properties:
    label:
      title: NumberInput (no controls)
    controls: false
    placeholder: "0.00"
    precision: 2
- id: ig_textarea
  type: TextArea
  properties:
    label:
      title: TextArea
    placeholder: Write a longer message...
    rows: 3
- id: ig_textarea_auto
  type: TextArea
  properties:
    label:
      title: TextArea (auto-size)
    autoSize:
      minRows: 2
      maxRows: 6
    placeholder: Auto-expanding text area
- id: ig_autocomplete
  type: AutoComplete
  properties:
    label:
      title: AutoComplete
    placeholder: Type or select item
    options:
      - Apple
      - Banana
      - Cherry
      - Date
      - Elderberry
- id: ig_phone
  type: PhoneNumberInput
  properties:
    label:
      title: PhoneNumberInput
    placeholder: Phone number
```

```yaml
ig_text_default:
  _state: ig_text_default
ig_text_prefix:
  _state: ig_text_prefix
ig_text_count:
  _state: ig_text_count
ig_password:
  _state: ig_password
ig_number:
  _state: ig_number
ig_number_no_controls:
  _state: ig_number_no_controls
ig_textarea:
  _state: ig_textarea
ig_textarea_auto:
  _state: ig_textarea_auto
ig_autocomplete:
  _state: ig_autocomplete
ig_phone:
  _state: ig_phone
```

```yaml
- id: ig_selector
  type: Selector
  properties:
    label:
      title: Selector
    placeholder: Select an item
    options:
      - Option A
      - Option B
      - Option C
- id: ig_selector_search
  type: Selector
  properties:
    label:
      title: Selector (searchable)
    showSearch: true
    placeholder: Search items...
    options:
      - label: United States
        value: us
      - label: United Kingdom
        value: uk
      - label: Germany
        value: de
      - label: France
        value: fr
      - label: Japan
        value: jp
- id: ig_multi
  type: MultipleSelector
  properties:
    label:
      title: MultipleSelector
    placeholder: Select multiple items
    options:
      - React
      - Vue
      - Angular
      - Svelte
      - Solid
- id: ig_multi_tags
  type: MultipleSelector
  properties:
    label:
      title: MultipleSelector (tags)
    placeholder: Select tags
    options:
      - label: Bug
        value: bug
        tag:
          color: red
      - label: Feature
        value: feature
        tag:
          color: blue
      - label: Enhancement
        value: enhancement
        tag:
          color: green
      - label: Documentation
        value: docs
        tag:
          color: orange
- id: ig_tree
  type: TreeInput
  properties:
    primaryKey: value
    parentKey: parent
    defaultExpandAll: true
    options:
      - value: eng
        label: Engineering
      - value: fe
        label: Frontend
        parent: eng
      - value: be
        label: Backend
        parent: eng
      - value: design
        label: Design
      - value: ux
        label: UX
        parent: design
      - value: ui
        label: UI
        parent: design
```

```yaml
ig_selector:
  _state: ig_selector
ig_selector_search:
  _state: ig_selector_search
ig_multi:
  _state: ig_multi
ig_multi_tags:
  _state: ig_multi_tags
ig_tree:
  _state: ig_tree
```

```yaml
- id: ig_radio
  type: RadioSelector
  properties:
    label:
      title: RadioSelector
    options:
      - Small
      - Medium
      - Large
- id: ig_radio_vertical
  type: RadioSelector
  properties:
    label:
      title: RadioSelector (vertical)
    direction: vertical
    options:
      - Option 1
      - Option 2
      - Option 3
- id: ig_checkbox
  type: CheckboxSelector
  properties:
    label:
      title: CheckboxSelector
    options:
      - Email
      - SMS
      - Push notification
- id: ig_checkbox_vertical
  type: CheckboxSelector
  properties:
    label:
      title: CheckboxSelector (vertical)
    direction: vertical
    options:
      - Read
      - Write
      - Execute
- id: ig_button_sel
  type: ButtonSelector
  properties:
    label:
      title: ButtonSelector
    options:
      - Daily
      - Weekly
      - Monthly
- id: ig_button_sel_outline
  type: ButtonSelector
  properties:
    label:
      title: ButtonSelector (outline)
    buttonStyle: outline
    options:
      - S
      - M
      - L
      - XL
- id: ig_segmented
  type: SegmentedSelector
  properties:
    label:
      title: SegmentedSelector
    options:
      - List
      - Grid
      - Table
- id: ig_segmented_block
  type: SegmentedSelector
  properties:
    label:
      title: SegmentedSelector (block)
    block: true
    options:
      - Day
      - Week
      - Month
      - Year
```

```yaml
ig_radio:
  _state: ig_radio
ig_radio_vertical:
  _state: ig_radio_vertical
ig_checkbox:
  _state: ig_checkbox
ig_checkbox_vertical:
  _state: ig_checkbox_vertical
ig_button_sel:
  _state: ig_button_sel
ig_button_sel_outline:
  _state: ig_button_sel_outline
ig_segmented:
  _state: ig_segmented
ig_segmented_block:
  _state: ig_segmented_block
```

```yaml
- id: ig_switch
  type: Switch
  properties:
    label:
      title: Switch
- id: ig_switch_text
  type: Switch
  properties:
    label:
      title: Switch (with text)
    checkedText: ON
    uncheckedText: OFF
- id: ig_switch_icon
  type: Switch
  properties:
    label:
      title: Switch (with icons)
    checkedIcon: AiOutlineCheck
    uncheckedIcon: AiOutlineClose
- id: ig_checkbox_sw
  type: CheckboxSwitch
  properties:
    label:
      title: CheckboxSwitch
    description: I agree to the terms and conditions
```

```yaml
ig_switch:
  _state: ig_switch
ig_switch_text:
  _state: ig_switch_text
ig_switch_icon:
  _state: ig_switch_icon
ig_checkbox_sw:
  _state: ig_checkbox_sw
```

```yaml
- id: ig_date
  type: DateSelector
  properties:
    label:
      title: DateSelector
    placeholder: Select a date
- id: ig_datetime
  type: DateTimeSelector
  properties:
    label:
      title: DateTimeSelector
    placeholder: Select date & time
- id: ig_daterange
  type: DateRangeSelector
  properties:
    label:
      title: DateRangeSelector
- id: ig_month
  type: MonthSelector
  properties:
    label:
      title: MonthSelector
    placeholder: Select month
- id: ig_week
  type: WeekSelector
  properties:
    label:
      title: WeekSelector
    placeholder: Select week
```

```yaml
ig_date:
  _state: ig_date
ig_datetime:
  _state: ig_datetime
ig_daterange:
  _state: ig_daterange
ig_month:
  _state: ig_month
ig_week:
  _state: ig_week
```

```yaml
- id: ig_colorselector
  type: ColorSelector
  properties:
    label:
      title: ColorSelector
    showText: true
  events:
    onMount:
      - id: set_ig_colorselector
        type: SetState
        params:
          ig_colorselector: "#1677ff"
- id: ig_colorselector_presets
  type: ColorSelector
  properties:
    label:
      title: ColorSelector (presets)
    showText: true
    presets:
      - label: Brand
        colors:
          - "#1677ff"
          - "#13c2c2"
          - "#52c41a"
          - "#faad14"
          - "#f5222d"
      - label: Neutral
        colors:
          - "#000000"
          - "#333333"
          - "#666666"
          - "#999999"
          - "#ffffff"
  events:
    onMount:
      - id: set_ig_colorselector_presets
        type: SetState
        params:
          ig_colorselector_presets: "#1677ff"
```

```yaml
ig_colorselector:
  _state: ig_colorselector
ig_colorselector_presets:
  _state: ig_colorselector_presets
```

```yaml
- id: ig_rating
  type: RatingSlider
  properties:
    label:
      title: RatingSlider
- id: ig_rating_custom
  type: RatingSlider
  properties:
    label:
      title: RatingSlider (custom range)
    min: 1
    max: 5
    step: 1
    disableNotApplicable: true
    color: "#faad14"
- id: ig_pagination
  type: Pagination
  properties:
    total: 100
- id: ig_pagination_full
  type: Pagination
  properties:
    total: 500
    showSizeChanger: true
    showQuickJumper: true
```

```yaml
ig_rating:
  _state: ig_rating
ig_rating_custom:
  _state: ig_rating_custom
ig_pagination:
  _state: ig_pagination
ig_pagination_full:
  _state: ig_pagination_full
```

```yaml
- id: ig_title_input
  type: TitleInput
- id: ig_title_input_level
  type: TitleInput
  properties:
    level: 3
- id: ig_paragraph_input
  type: ParagraphInput
- id: ig_paragraph_copyable
  type: ParagraphInput
  properties:
    copyable: true
```

```yaml
ig_title_input:
  _state: ig_title_input
ig_title_input_level:
  _state: ig_title_input_level
ig_paragraph_input:
  _state: ig_paragraph_input
ig_paragraph_copyable:
  _state: ig_paragraph_copyable
```

```yaml
- id: ig_size_sm_text
  type: TextInput
  properties:
    label:
      title: Small TextInput
    size: small
    placeholder: Small
- id: ig_size_md_text
  type: TextInput
  properties:
    label:
      title: Default TextInput
    placeholder: Default
- id: ig_size_lg_text
  type: TextInput
  properties:
    label:
      title: Large TextInput
    size: large
    placeholder: Large
- id: ig_size_sm_sel
  type: Selector
  properties:
    label:
      title: Small Selector
    size: small
    placeholder: Small
    options:
      - A
      - B
- id: ig_size_md_sel
  type: Selector
  properties:
    label:
      title: Default Selector
    placeholder: Default
    options:
      - A
      - B
- id: ig_size_lg_sel
  type: Selector
  properties:
    label:
      title: Large Selector
    size: large
    placeholder: Large
    options:
      - A
      - B
```

```yaml
ig_size_sm_text:
  _state: ig_size_sm_text
ig_size_md_text:
  _state: ig_size_md_text
ig_size_lg_text:
  _state: ig_size_lg_text
ig_size_sm_sel:
  _state: ig_size_sm_sel
ig_size_md_sel:
  _state: ig_size_md_sel
ig_size_lg_sel:
  _state: ig_size_lg_sel
```

```yaml
- id: ig_var_outlined
  type: TextInput
  properties:
    label:
      title: Outlined (default)
    placeholder: outlined
- id: ig_var_filled
  type: DateSelector
  properties:
    label:
      title: Filled
    variant: filled
    placeholder: filled
- id: ig_var_borderless
  type: DateSelector
  properties:
    label:
      title: Borderless
    variant: borderless
    placeholder: borderless
```

```yaml
ig_var_outlined:
  _state: ig_var_outlined
ig_var_filled:
  _state: ig_var_filled
ig_var_borderless:
  _state: ig_var_borderless
```

```yaml
- id: ig_dis_text
  type: TextInput
  properties:
    label:
      title: TextInput
    disabled: true
    placeholder: Disabled
- id: ig_dis_sel
  type: Selector
  properties:
    label:
      title: Selector
    disabled: true
    placeholder: Disabled
    options:
      - A
      - B
- id: ig_dis_radio
  type: RadioSelector
  properties:
    label:
      title: RadioSelector
    disabled: true
    options:
      - Option 1
      - Option 2
- id: ig_dis_switch
  type: Switch
  properties:
    label:
      title: Switch
    disabled: true
- id: ig_dis_date
  type: DateSelector
  properties:
    label:
      title: DateSelector
    disabled: true
```

```yaml
ig_dis_text:
  _state: ig_dis_text
ig_dis_sel:
  _state: ig_dis_sel
ig_dis_radio:
  _state: ig_dis_radio
ig_dis_switch:
  _state: ig_dis_switch
ig_dis_date:
  _state: ig_dis_date
```
