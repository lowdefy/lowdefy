# MultipleSelector

Multi-select dropdown with tags, search, and custom rendering.

```yaml
- id: basic_multi
  type: MultipleSelector
  properties:
    title: Select Fruits
    options:
      - label: Apple
        value: apple
      - label: Banana
        value: banana
      - label: Cherry
        value: cherry
      - label: Dragonfruit
        value: dragonfruit
      - label: Elderberry
        value: elderberry
      - label: Fig
        value: fig
- id: basic_placeholder
  type: MultipleSelector
  properties:
    title: Select Languages
    placeholder: Choose languages...
    options:
      - label: English
        value: en
      - label: Spanish
        value: es
      - label: French
        value: fr
      - label: German
        value: de
      - label: Japanese
        value: ja
      - label: Mandarin
        value: zh
```

```yaml
basic_multi:
  _state: basic_multi
basic_placeholder:
  _state: basic_placeholder
```

```yaml
- id: prim_strings
  type: MultipleSelector
  properties:
    title: String Options
    options:
      - Red
      - Green
      - Blue
      - Yellow
      - Purple
      - Orange
- id: prim_numbers
  type: MultipleSelector
  properties:
    title: Number Options
    options:
      - 10
      - 20
      - 30
      - 40
      - 50
```

```yaml
prim_strings:
  _state: prim_strings
prim_numbers:
  _state: prim_numbers
```

```yaml
- id: size_small
  type: MultipleSelector
  properties:
    title: Small
    size: small
    options:
      - Red
      - Green
      - Blue
      - Yellow
- id: size_default
  type: MultipleSelector
  properties:
    title: Default
    options:
      - Red
      - Green
      - Blue
      - Yellow
- id: size_large
  type: MultipleSelector
  properties:
    title: Large
    size: large
    options:
      - Red
      - Green
      - Blue
      - Yellow
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
- id: toggle_allow_clear
  type: MultipleSelector
  properties:
    title: Allow Clear (default)
    allowClear: true
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: toggle_no_arrow
  type: MultipleSelector
  properties:
    title: No Arrow
    showArrow: false
    options:
      - label: Cat
        value: cat
      - label: Dog
        value: dog
      - label: Bird
        value: bird
- id: toggle_auto_focus
  type: MultipleSelector
  properties:
    title: Auto Focus
    autoFocus: true
    options:
      - label: React
        value: react
      - label: Vue
        value: vue
      - label: Angular
        value: angular
```

```yaml
toggle_allow_clear:
  _state: toggle_allow_clear
toggle_no_arrow:
  _state: toggle_no_arrow
toggle_auto_focus:
  _state: toggle_auto_focus
```

```yaml
- id: bordered_true
  type: MultipleSelector
  properties:
    title: Bordered (default)
    bordered: true
    options:
      - label: React
        value: react
      - label: Vue
        value: vue
      - label: Angular
        value: angular
- id: bordered_false
  type: MultipleSelector
  properties:
    title: Borderless
    bordered: false
    options:
      - label: React
        value: react
      - label: Vue
        value: vue
      - label: Angular
        value: angular
```

```yaml
bordered_true:
  _state: bordered_true
bordered_false:
  _state: bordered_false
```

```yaml
- id: max_tags_3
  type: MultipleSelector
  properties:
    title: Max 3 Tags Shown
    maxTagCount: 3
    options:
      - label: React
        value: react
      - label: Vue
        value: vue
      - label: Angular
        value: angular
      - label: Svelte
        value: svelte
      - label: Ember
        value: ember
      - label: Solid
        value: solid
      - label: Preact
        value: preact
- id: max_tags_2
  type: MultipleSelector
  properties:
    title: Max 2 Tags Shown
    maxTagCount: 2
    options:
      - label: React
        value: react
      - label: Vue
        value: vue
      - label: Angular
        value: angular
      - label: Svelte
        value: svelte
      - label: Ember
        value: ember
- id: max_tags_1
  type: MultipleSelector
  properties:
    title: Max 1 Tag Shown
    maxTagCount: 1
    options:
      - label: North America
        value: na
      - label: South America
        value: sa
      - label: Europe
        value: eu
      - label: Asia
        value: asia
      - label: Africa
        value: af
```

```yaml
max_tags_3:
  _state: max_tags_3
max_tags_2:
  _state: max_tags_2
max_tags_1:
  _state: max_tags_1
```

```yaml
- id: custom_placeholder
  type: MultipleSelector
  properties:
    title: Custom Placeholder
    placeholder: Pick your favorite colors...
    options:
      - label: Crimson
        value: crimson
      - label: Teal
        value: teal
      - label: Indigo
        value: indigo
- id: custom_not_found
  type: MultipleSelector
  properties:
    title: Custom Not Found Content
    notFoundContent: No matching items available
    options: []
- id: custom_loading_placeholder
  type: MultipleSelector
  properties:
    title: Custom Loading Placeholder
    loadingPlaceholder: Fetching results...
    options:
      - label: Item A
        value: a
      - label: Item B
        value: b
```

```yaml
custom_placeholder:
  _state: custom_placeholder
custom_not_found:
  _state: custom_not_found
custom_loading_placeholder:
  _state: custom_loading_placeholder
```

```yaml
- id: auto_clear_true
  type: MultipleSelector
  properties:
    title: Auto Clear Search (default)
    autoClearSearchValue: true
    options:
      - label: JavaScript
        value: js
      - label: TypeScript
        value: ts
      - label: Python
        value: py
      - label: Ruby
        value: rb
      - label: Go
        value: go
- id: auto_clear_false
  type: MultipleSelector
  properties:
    title: Keep Search on Select
    autoClearSearchValue: false
    options:
      - label: JavaScript
        value: js
      - label: TypeScript
        value: ts
      - label: Python
        value: py
      - label: Ruby
        value: rb
      - label: Go
        value: go
```

```yaml
auto_clear_true:
  _state: auto_clear_true
auto_clear_false:
  _state: auto_clear_false
```

```yaml
- id: custom_suffix_icon
  type: MultipleSelector
  properties:
    title: Custom Suffix Icon
    suffixIcon: AiOutlineSearch
    options:
      - label: Tokyo
        value: tokyo
      - label: Paris
        value: paris
      - label: London
        value: london
      - label: New York
        value: new_york
- id: custom_suffix_icon_object
  type: MultipleSelector
  properties:
    title: Colored Suffix Icon
    suffixIcon:
      name: AiOutlineGlobal
      color: "#1677ff"
    options:
      - label: Tokyo
        value: tokyo
      - label: Paris
        value: paris
      - label: London
        value: london
- id: custom_clear_icon
  type: MultipleSelector
  properties:
    title: Custom Clear Icon
    clearIcon: AiOutlineDelete
    options:
      - label: File A
        value: a
      - label: File B
        value: b
      - label: File C
        value: c
- id: custom_selected_icon
  type: MultipleSelector
  properties:
    title: Custom Selected Icon
    selectedIcon: AiOutlineStar
    options:
      - label: Gold Plan
        value: gold
      - label: Silver Plan
        value: silver
      - label: Bronze Plan
        value: bronze
```

```yaml
custom_suffix_icon:
  _state: custom_suffix_icon
custom_suffix_icon_object:
  _state: custom_suffix_icon_object
custom_clear_icon:
  _state: custom_clear_icon
custom_selected_icon:
  _state: custom_selected_icon
```

```yaml
- id: tags_preset_colors
  type: MultipleSelector
  properties:
    title: Preset Tag Colors
    renderTags: true
    options:
      - label: Success
        value: success
        tag:
          color: success
      - label: Processing
        value: processing
        tag:
          color: processing
      - label: Error
        value: error
        tag:
          color: error
      - label: Warning
        value: warning
        tag:
          color: warning
      - label: Default
        value: default
        tag:
          color: default
- id: tags_named_colors
  type: MultipleSelector
  properties:
    title: Named Tag Colors
    renderTags: true
    options:
      - label: Blue
        value: blue
        tag:
          color: blue
      - label: Cyan
        value: cyan
        tag:
          color: cyan
      - label: Geekblue
        value: geekblue
        tag:
          color: geekblue
      - label: Gold
        value: gold
        tag:
          color: gold
      - label: Green
        value: green
        tag:
          color: green
      - label: Lime
        value: lime
        tag:
          color: lime
      - label: Magenta
        value: magenta
        tag:
          color: magenta
      - label: Orange
        value: orange
        tag:
          color: orange
      - label: Purple
        value: purple
        tag:
          color: purple
      - label: Red
        value: red
        tag:
          color: red
      - label: Volcano
        value: volcano
        tag:
          color: volcano
- id: tags_hex_colors
  type: MultipleSelector
  properties:
    title: Custom Hex Tag Colors
    renderTags: true
    options:
      - label: Coral
        value: coral
        tag:
          color: "#ff6b6b"
      - label: Teal
        value: teal
        tag:
          color: "#20c997"
      - label: Indigo
        value: indigo
        tag:
          color: "#4c6ef5"
      - label: Amber
        value: amber
        tag:
          color: "#fab005"
      - label: Pink
        value: pink
        tag:
          color: "#e64980"
- id: tags_custom_titles
  type: MultipleSelector
  properties:
    title: Tags with Custom Titles
    renderTags: true
    options:
      - label: Frontend Developer
        value: frontend
        tag:
          title: FE
          color: blue
      - label: Backend Developer
        value: backend
        tag:
          title: BE
          color: green
      - label: DevOps Engineer
        value: devops
        tag:
          title: Ops
          color: volcano
      - label: QA Engineer
        value: qa
        tag:
          title: QA
          color: purple
      - label: Designer
        value: designer
        tag:
          title: UX
          color: magenta
- id: render_tags_false
  type: MultipleSelector
  properties:
    title: Tags Rendering Off (default)
    renderTags: false
    options:
      - label: Alpha
        value: alpha
        tag:
          color: blue
      - label: Beta
        value: beta
        tag:
          color: green
      - label: Gamma
        value: gamma
        tag:
          color: red
```

```yaml
tags_preset_colors:
  _state: tags_preset_colors
tags_named_colors:
  _state: tags_named_colors
tags_hex_colors:
  _state: tags_hex_colors
tags_custom_titles:
  _state: tags_custom_titles
render_tags_false:
  _state: render_tags_false
```

```yaml
- id: tags_with_icons
  type: MultipleSelector
  properties:
    title: Tags with Icons
    renderTags: true
    options:
      - label: Approved
        value: approved
        tag:
          icon: AiOutlineCheck
          color: success
      - label: Pending
        value: pending
        tag:
          icon: AiOutlineClockCircle
          color: processing
      - label: Rejected
        value: rejected
        tag:
          icon: AiOutlineClose
          color: error
      - label: Draft
        value: draft
        tag:
          icon: AiOutlineEdit
          color: default
- id: tags_icons_colors_titles
  type: MultipleSelector
  properties:
    title: Tags with Icons, Colors, and Titles
    renderTags: true
    options:
      - label: High Priority
        value: high
        tag:
          title: High
          icon: AiOutlineArrowUp
          color: red
      - label: Medium Priority
        value: medium
        tag:
          title: Med
          icon: AiOutlineMinus
          color: orange
      - label: Low Priority
        value: low
        tag:
          title: Low
          icon: AiOutlineArrowDown
          color: green
```

```yaml
tags_with_icons:
  _state: tags_with_icons
tags_icons_colors_titles:
  _state: tags_icons_colors_titles
```

```yaml
- id: disabled_multi
  type: MultipleSelector
  properties:
    title: Disabled Selector
    disabled: true
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: disabled_options
  type: MultipleSelector
  properties:
    title: Disabled Options
    options:
      - label: Available
        value: available
      - label: Sold Out
        value: sold_out
        disabled: true
      - label: In Stock
        value: in_stock
      - label: Backordered
        value: backordered
        disabled: true
      - label: Pre-order
        value: preorder
```

```yaml
disabled_multi:
  _state: disabled_multi
disabled_options:
  _state: disabled_options
```

```yaml
- id: options_filter_string
  type: MultipleSelector
  properties:
    title: Search by Filter String
    placeholder: Try typing "js" or "python"...
    options:
      - label: React
        value: react
        filterString: javascript js react frontend
      - label: Vue
        value: vue
        filterString: javascript js vue frontend
      - label: Django
        value: django
        filterString: python django backend
      - label: Flask
        value: flask
        filterString: python flask backend
      - label: Express
        value: express
        filterString: javascript js node express backend
- id: options_styled
  type: MultipleSelector
  properties:
    title: Styled Options
    options:
      - label: Important
        value: important
        style:
          fontWeight: bold
          color: "#ff4d4f"
      - label: Normal
        value: normal
      - label: Dimmed
        value: dimmed
        style:
          color: "#8c8c8c"
          fontStyle: italic
      - label: Highlighted
        value: highlighted
- id: options_allow_clear_false
  type: MultipleSelector
  properties:
    title: No Clear Button
    allowClear: false
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
```

```yaml
options_filter_string:
  _state: options_filter_string
options_styled:
  _state: options_styled
options_allow_clear_false:
  _state: options_allow_clear_false
```

```yaml
- id: label_with_colon
  type: MultipleSelector
  properties:
    title: Select Items
    label:
      colon: true
    options:
      - Apple
      - Banana
      - Cherry
- id: label_no_colon
  type: MultipleSelector
  properties:
    title: Select Items
    label:
      colon: false
    options:
      - Apple
      - Banana
      - Cherry
- id: label_right_align
  type: MultipleSelector
  properties:
    title: Right Aligned
    label:
      align: right
      inline: true
      span: 8
    options:
      - Apple
      - Banana
      - Cherry
- id: label_left_align
  type: MultipleSelector
  properties:
    title: Left Aligned
    label:
      align: left
      inline: true
      span: 8
    options:
      - Apple
      - Banana
      - Cherry
- id: label_extra
  type: MultipleSelector
  properties:
    title: Skills
    label:
      extra: Select all skills that apply to this role.
    options:
      - label: JavaScript
        value: js
      - label: Python
        value: py
      - label: SQL
        value: sql
      - label: Docker
        value: docker
- id: label_extra_html
  type: MultipleSelector
  properties:
    title: Technologies
    label:
      extra: Choose from the <b>approved</b> technology list.
    options:
      - label: React
        value: react
      - label: Node.js
        value: node
      - label: PostgreSQL
        value: pg
- id: label_no_label
  type: MultipleSelector
  properties:
    label:
      disabled: true
    placeholder: Select tags...
    options:
      - label: Frontend
        value: frontend
      - label: Backend
        value: backend
      - label: DevOps
        value: devops
      - label: Design
        value: design
      - label: QA
        value: qa
- id: label_feedback_on
  type: MultipleSelector
  properties:
    title: With Feedback
    label:
      hasFeedback: true
    options:
      - label: Valid
        value: valid
      - label: Invalid
        value: invalid
```

```yaml
label_with_colon:
  _state: label_with_colon
label_no_colon:
  _state: label_no_colon
label_right_align:
  _state: label_right_align
label_left_align:
  _state: label_left_align
label_extra:
  _state: label_extra
label_extra_html:
  _state: label_extra_html
label_no_label:
  _state: label_no_label
label_feedback_on:
  _state: label_feedback_on
```

```yaml
- id: label_inline
  type: MultipleSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 6
    options:
      - label: Option 1
        value: 1
      - label: Option 2
        value: 2
      - label: Option 3
        value: 3
- id: label_inline_wide
  type: MultipleSelector
  properties:
    title: Wide Inline Label
    label:
      inline: true
      span: 10
    options:
      - label: Option 1
        value: 1
      - label: Option 2
        value: 2
      - label: Option 3
        value: 3
```

```yaml
label_inline:
  _state: label_inline
label_inline_wide:
  _state: label_inline_wide
```

```yaml
- id: scrollable_selector
  type: MultipleSelector
  style:
    .selector:
      maxHeight: 96px
      overflowY: auto
  properties:
    title: Scrollable Selector
    label:
      extra: Cap the tag container at ~3 rows and scroll when more tags are selected.
    placeholder: Pick several tags
    renderTags: true
    options:
      - label: Alpha
        value: alpha
        tag:
          color: blue
      - label: Beta
        value: beta
        tag:
          color: green
      - label: Gamma
        value: gamma
        tag:
          color: purple
      - label: Delta
        value: delta
        tag:
          color: orange
      - label: Epsilon
        value: epsilon
        tag:
          color: cyan
      - label: Zeta
        value: zeta
        tag:
          color: magenta
      - label: Eta
        value: eta
        tag:
          color: red
      - label: Theta
        value: theta
        tag:
          color: volcano
      - label: Iota
        value: iota
        tag:
          color: gold
      - label: Kappa
        value: kappa
        tag:
          color: geekblue
```

```yaml
scrollable_selector:
  _state: scrollable_selector
```

```yaml
- id: style_border
  type: MultipleSelector
  style:
    .element:
      border: 2px solid '#1677ff'
      borderRadius: 8
  properties:
    title: Custom Border Style
    label:
      disabled: true
    options:
      - label: Alpha
        value: alpha
      - label: Beta
        value: beta
      - label: Gamma
        value: gamma
- id: style_background
  type: MultipleSelector
  style:
    .element: null
  properties:
    title: Custom Background
    label:
      disabled: true
    options:
      - label: Option 1
        value: 1
      - label: Option 2
        value: 2
      - label: Option 3
        value: 3
- id: class_tailwind_element
  type: MultipleSelector
  properties:
    title: Tailwind Element Class
    label:
      disabled: true
    options:
      - label: One
        value: 1
      - label: Two
        value: 2
      - label: Three
        value: 3
  class:
    element: rounded-lg shadow-sm
- id: class_tailwind_label
  type: MultipleSelector
  properties:
    title: Styled Label
    options:
      - label: Alpha
        value: alpha
      - label: Beta
        value: beta
  class:
    label: text-blue-600 font-semibold
```

```yaml
style_border:
  _state: style_border
style_background:
  _state: style_background
class_tailwind_element:
  _state: class_tailwind_element
class_tailwind_label:
  _state: class_tailwind_label
```

```yaml
- id: theme_custom_colors
  type: MultipleSelector
  properties:
    title: Custom Selection Colors
    renderTags: true
    theme:
      optionSelectedColor: "#389e0d"
      optionSelectedFontWeight: 700
    options:
      - label: Organic
        value: organic
        tag:
          color: green
      - label: Local
        value: local
        tag:
          color: lime
      - label: Imported
        value: imported
        tag:
          color: gold
- id: theme_hover_active
  type: MultipleSelector
  properties:
    title: Custom Hover and Active Colors
    theme:
      hoverBorderColor: "#722ed1"
      activeBorderColor: "#531dab"
      activeOutlineColor: rgba(114, 46, 209, 0.1)
    options:
      - label: Design
        value: design
      - label: Engineering
        value: engineering
      - label: Marketing
        value: marketing
- id: theme_multiple_item
  type: MultipleSelector
  properties:
    title: Custom Tag Appearance
    theme:
      multipleItemBorderColor: "#91caff"
      multipleItemHeight: 28
    options:
      - label: Small
        value: small
      - label: Medium
        value: medium
      - label: Large
        value: large
      - label: Extra Large
        value: xl
- id: theme_large_tags
  type: MultipleSelector
  properties:
    title: Large Multiple Items
    size: large
    theme:
      multipleItemHeightLG: 36
    options:
      - label: Category A
        value: a
      - label: Category B
        value: b
      - label: Category C
        value: c
- id: theme_small_tags
  type: MultipleSelector
  properties:
    title: Small Multiple Items
    size: small
    theme:
      multipleItemHeightSM: 18
    options:
      - label: Tag 1
        value: 1
      - label: Tag 2
        value: 2
      - label: Tag 3
        value: 3
```

```yaml
theme_custom_colors:
  _state: theme_custom_colors
theme_hover_active:
  _state: theme_hover_active
theme_multiple_item:
  _state: theme_multiple_item
theme_large_tags:
  _state: theme_large_tags
theme_small_tags:
  _state: theme_small_tags
```

```yaml
- id: combined_full
  type: MultipleSelector
  properties:
    title: Full Featured Selector
    placeholder: Search and select roles...
    renderTags: true
    maxTagCount: 3
    size: large
    suffixIcon: AiOutlineTeam
    selectedIcon: AiOutlineCheckCircle
    label:
      extra: Select up to 5 team roles for the project.
    options:
      - label: Project Manager
        value: pm
        tag:
          title: PM
          icon: AiOutlineCrown
          color: gold
      - label: Tech Lead
        value: lead
        tag:
          title: Lead
          icon: AiOutlineStar
          color: blue
      - label: Developer
        value: dev
        tag:
          title: Dev
          icon: AiOutlineCode
          color: green
      - label: Designer
        value: design
        tag:
          title: UX
          icon: AiOutlineBgColors
          color: magenta
      - label: QA Engineer
        value: qa
        tag:
          title: QA
          icon: AiOutlineBug
          color: volcano
      - label: DevOps
        value: devops
        tag:
          title: Ops
          icon: AiOutlineCloudServer
          color: cyan
- id: combined_themed
  type: MultipleSelector
  properties:
    title: Themed Selector
    placeholder: Choose categories...
    renderTags: true
    theme:
      optionSelectedColor: "#531dab"
      hoverBorderColor: "#b37feb"
      activeBorderColor: "#722ed1"
      activeOutlineColor: rgba(114, 46, 209, 0.1)
      multipleItemBorderColor: "#d3adf7"
    options:
      - label: Analytics
        value: analytics
        tag:
          color: purple
      - label: Monitoring
        value: monitoring
        tag:
          color: geekblue
      - label: Alerting
        value: alerting
        tag:
          color: red
      - label: Reporting
        value: reporting
        tag:
          color: cyan
```

```yaml
combined_full:
  _state: combined_full
combined_themed:
  _state: combined_themed
```

```yaml
- id: applied2_team_card
  type: Card
  properties:
    title: Assign Team Members
  blocks:
    - id: applied2_team_project_name
      type: TextInput
      properties:
        title: Project Name
        placeholder: Enter project name
        prefixIcon: AiOutlineProject
    - id: applied2_team_members
      type: MultipleSelector
      properties:
        title: Team Members
        placeholder: Select team members...
        renderTags: true
        maxTagCount: 4
        label:
          extra: Select all team members for this project.
        options:
          - label: Alice Chen
            value: alice
            tag:
              color: blue
          - label: Bob Martinez
            value: bob
            tag:
              color: green
          - label: Carol Nguyen
            value: carol
            tag:
              color: purple
          - label: David Kim
            value: david
            tag:
              color: orange
          - label: Emma Wilson
            value: emma
            tag:
              color: cyan
          - label: Frank Patel
            value: frank
            tag:
              color: magenta
    - id: applied2_team_deadline
      type: DateSelector
      properties:
        title: Project Deadline
        placeholder: Select deadline
        format: DD MMM YYYY
        suffixIcon: AiOutlineCalendar
    - id: applied2_team_assign_btn
      type: Button
      properties:
        title: Assign Team
        icon: AiOutlineTeam
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: assign_team_action
            type: DisplayMessage
            params:
              content: Team has been assigned to the project.
              duration: 3
```

```yaml
applied2_team_card:
  _state: applied2_team_card
```

```yaml
- id: applied_filter_card
  type: Card
  properties:
    title: Filter Products
  blocks:
    - id: applied_filter_categories
      type: MultipleSelector
      properties:
        title: Categories
        placeholder: Select categories to filter...
        renderTags: true
        options:
          - label: Electronics
            value: electronics
            tag:
              color: blue
          - label: Clothing
            value: clothing
            tag:
              color: green
          - label: Books
            value: books
            tag:
              color: purple
          - label: Home & Garden
            value: home
            tag:
              color: orange
          - label: Sports
            value: sports
            tag:
              color: cyan
      events:
        onChange:
          - id: filter_set_categories
            type: SetState
            params:
              selected_categories:
                _state: applied_filter_categories
    - id: applied_filter_price_range
      type: Selector
      properties:
        title: Price Range
        placeholder: Select a price range...
        options:
          - label: Under $25
            value: under_25
          - label: $25 - $50
            value: 25_50
          - label: $50 - $100
            value: 50_100
          - label: Over $100
            value: over_100
    - id: applied_filter_apply_btn
      type: Button
      properties:
        title: Apply Filters
        icon: AiOutlineFilter
        type: primary
        block: true
      events:
        onClick:
          - id: filter_apply_action
            type: DisplayMessage
            params:
              content: Filters applied successfully.
              duration: 3
```

```yaml
- id: applied_filter_card
  type: Card
  properties:
    title: Filter Products
  blocks:
    - id: applied_filter_categories
      type: MultipleSelector
      properties:
        title: Categories
        placeholder: Select categories to filter...
        renderTags: true
        options:
          - label: Electronics
            value: electronics
            tag:
              color: blue
          - label: Clothing
            value: clothing
            tag:
              color: green
          - label: Books
            value: books
            tag:
              color: purple
          - label: Home & Garden
            value: home
            tag:
              color: orange
          - label: Sports
            value: sports
            tag:
              color: cyan
      events:
        onChange:
          - id: filter_set_categories
            type: SetState
            params:
              selected_categories:
                _state: applied_filter_categories
    - id: applied_filter_price_range
      type: Selector
      properties:
        title: Price Range
        placeholder: Select a price range...
        options:
          - label: Under $25
            value: under_25
          - label: $25 - $50
            value: 25_50
          - label: $50 - $100
            value: 50_100
          - label: Over $100
            value: over_100
    - id: applied_filter_apply_btn
      type: Button
      properties:
        title: Apply Filters
        icon: AiOutlineFilter
        type: primary
        block: true
      events:
        onClick:
          - id: filter_apply_action
            type: DisplayMessage
            params:
              content: Filters applied successfully.
              duration: 3
```

```yaml
applied_filter_card:
  _state: applied_filter_card
```

```yaml
- id: multiple_color_solid
  type: MultipleSelector
  properties:
    title: Solid — filled colored tags
    variant: solid
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
- id: multiple_color_outlined
  type: MultipleSelector
  properties:
    title: Outlined — outlined colored tags
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
```

```yaml
multiple_color_solid:
  _state: multiple_color_solid
multiple_color_outlined:
  _state: multiple_color_outlined
```

```yaml
- id: data_multiple_selector
  type: MultipleSelector
  properties:
    title: Team
    placeholder: Add people...
    data:
      - id: 1
        name: Ada
      - id: 2
        name: Linus
      - id: 3
        name: Grace
      - id: 4
        name: Alan
    html: "{{ item.name }}"
    valueKey: id
```

```yaml
data_multiple_selector:
  _state: data_multiple_selector
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `true` | Allow the user to clear the selected value, sets the value to null. |
| `autoClearSearchValue` | boolean | `true` | Whether the current search will be cleared on selecting an item. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Whether or not the selector has a border style. Deprecated, use variant instead. |
| `clearIcon` | string \| object | `"AiOutlineCloseCircle"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at far right position of the selector, shown when user is given option to clear input. |
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
| `data` | array | - | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string | - | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string | - | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string | - | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `options` | array | `[]` | Options can either be an array of primitive values, on an array of label, value pairs - supports html. |
| `options.$.label` | string | - | Value label shown to user - supports html. |
| `options.$.value` | string \| number \| boolean \| object \| array | - | Value selected. Can be of any type. |
| `options.$.disabled` | boolean | `false` | Disable the option if true. |
| `options.$.filterString` | string | - | String to match against when filtering selector options during. If no filterString is provided the filter method matches against options.label. |
| `options.$.style` | object | - | Css style to applied to option. |
| `options.$.color` | string | - | Color applied when this option is selected: drives the tag/pill color in the input and tints the option in the dropdown. An explicit `tag.color` takes precedence. |
| `options.$.tag` | object | - |  |
| `options.$.tag.color` | string | - | Color of the Tag. Preset options are success, processing, error, warning, default, blue, cyan, geekblue, gold, green, lime, magenta, orange, purple, red, volcano, or alternatively any hex color. |
| `options.$.tag.title` | string | - | Content title of tag - supports html. |
| `options.$.tag.icon` | string \| object | - | Name of an Ant Design Icon or properties of an Icon block to customize alert icon. |
| `maxTagCount` | number | - | Max tag count to show. |
| `placeholder` | string | `"Select item"` | Placeholder text inside the block before user selects input. |
| `loadingPlaceholder` | string | `"Loading"` | Placeholder text to show in options while the block is loading. |
| `notFoundContent` | string | `"not Found"` | Placeholder text to show when list of options are empty. |
| `selectedIcon` | string \| object | `"AiOutlineCheck"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon showing when a selection is made in the drop-down list. |
| `showArrow` | boolean | `true` | Show the suffix icon at the drop-down position of the selector. antd shows the arrow by default; `false` hides it by clearing the suffix icon. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"AiOutlineDown"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize at the drop-down position of the selector. |
| `title` | string | - | Multiple selector label title - supports html. |
| `variant` | string | - | Tag/input variant. `solid` renders filled colored tags; `outlined` renders outlined colored tags. `filled`/`borderless` are the antd input styles. Enum: `solid`, `outlined`, `filled`, `borderless`. |
| `renderTags` | boolean | - | When true, the selected option labels are rendered as tags in the selector input. This field must be true to render option tag values. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design select tokens](https://ant.design/components/select#design-token). |
| `theme.clearBg` | string | `"#ffffff"` | Background color of the clear button. |
| `theme.hoverBorderColor` | string | `"#4096ff"` | Border color when the selector is hovered. |
| `theme.activeBorderColor` | string | `"#1677ff"` | Border color when the selector is focused/active. |
| `theme.activeOutlineColor` | string | `"rgba(5, 145, 255, 0.1)"` | Outline color when the selector is focused/active. |
| `theme.selectorBg` | string | `"#ffffff"` | Background color of the selector. |
| `theme.multipleItemBg` | string | `"rgba(0, 0, 0, 0.06)"` | Background color for selected items in multiple mode. |
| `theme.multipleItemBorderColor` | string | `"transparent"` | Border color for selected items in multiple mode. |
| `theme.multipleItemHeight` | number | `24` | Height of selected items in multiple mode. |
| `theme.multipleItemHeightSM` | number | `16` | Height of selected items in small multiple mode. |
| `theme.multipleItemHeightLG` | number | `32` | Height of selected items in large multiple mode. |
| `theme.multipleSelectorBgDisabled` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of the selector when disabled in multiple mode. |
| `theme.multipleItemColorDisabled` | string | `"rgba(0, 0, 0, 0.25)"` | Text color of selected items when disabled in multiple mode. |
| `theme.multipleItemBorderColorDisabled` | string | `"transparent"` | Border color of selected items when disabled in multiple mode. |
| `theme.optionSelectedBg` | string | `"#e6f4ff"` | Background color of the selected option in the dropdown. |
| `theme.optionSelectedColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of the selected option in the dropdown. |
| `theme.optionSelectedFontWeight` | number | `600` | Font weight of the selected option in the dropdown. |
| `theme.optionActiveBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of the active/hovered option in the dropdown. |
| `theme.optionFontSize` | number | `14` | Font size of options in the dropdown. |
| `theme.optionHeight` | number | `32` | Height of each option in the dropdown. |
| `theme.optionLineHeight` | number | - | Line height of options in the dropdown. |
| `theme.optionPadding` | string | `"5px 12px"` | Padding inside each dropdown option. |
| `theme.singleItemHeightLG` | number | `40` | Height of the selector in large single mode. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the dropdown popup. |
| `theme.showArrowPaddingInlineEnd` | number | `18` | Padding at the inline end when the arrow is shown. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: array }` | Trigger actions when selection is changed. |
| `onBlur` | \- | Trigger action event occurs when selector loses focus. |
| `onFocus` | \- | Trigger action when selector gets focus. |
| `onClear` | \- | Trigger action when selector gets cleared. |
| `onSearch` | `{ value: string }` | Trigger actions when input is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The MultipleSelector element. |
| `/selector` | The inner tag/value container of the MultipleSelector (antd `content` semantic slot). Use for capping the tag area height and enabling internal scroll. |
| `/clearIcon` | The clear icon in the MultipleSelector. |
| `/label` | The MultipleSelector label. |
| `/extra` | The MultipleSelector extra content. |
| `/feedback` | The MultipleSelector validation feedback. |
| `/options` | The MultipleSelector options. |
| `/selectedIcon` | The selected item icon in the MultipleSelector. |
| `/suffixIcon` | The suffix icon in the MultipleSelector. |

No slots defined.
