# SegmentedSelector

Segmented control for switching between options.

```yaml
- id: basic_strings
  type: SegmentedSelector
  properties:
    title: View
    options:
      - Daily
      - Weekly
      - Monthly
- id: basic_numbers
  type: SegmentedSelector
  properties:
    title: Rating
    options:
      - "1"
      - "2"
      - "3"
      - "4"
      - "5"
- id: basic_two
  type: SegmentedSelector
  properties:
    title: Toggle
    options:
      - Yes
      - No
```

```yaml
basic_strings:
  _state: basic_strings
basic_numbers:
  _state: basic_numbers
basic_two:
  _state: basic_two
```

```yaml
- id: label_value_basic
  type: SegmentedSelector
  properties:
    title: Status Filter
    options:
      - label: All
        value: all
      - label: Active
        value: active
      - label: Inactive
        value: inactive
      - label: Archived
        value: archived
- id: label_value_roles
  type: SegmentedSelector
  properties:
    title: User Role
    options:
      - label: Admin
        value: admin
      - label: Editor
        value: editor
      - label: Viewer
        value: viewer
- id: label_value_many
  type: SegmentedSelector
  properties:
    title: Time Range
    options:
      - label: 1H
        value: 1h
      - label: 6H
        value: 6h
      - label: 1D
        value: 1d
      - label: 1W
        value: 1w
      - label: 1M
        value: 1m
      - label: 1Y
        value: 1y
```

```yaml
label_value_basic:
  _state: label_value_basic
label_value_roles:
  _state: label_value_roles
label_value_many:
  _state: label_value_many
```

```yaml
- id: size_small
  type: SegmentedSelector
  properties:
    title: Small
    size: small
    options:
      - S
      - M
      - L
      - XL
- id: size_default
  type: SegmentedSelector
  properties:
    title: Default
    options:
      - S
      - M
      - L
      - XL
- id: size_large
  type: SegmentedSelector
  properties:
    title: Large
    size: large
    options:
      - S
      - M
      - L
      - XL
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
- id: size_small_lv
  type: SegmentedSelector
  properties:
    title: Small Priority
    size: small
    options:
      - label: Low
        value: low
      - label: Medium
        value: medium
      - label: High
        value: high
      - label: Critical
        value: critical
- id: size_default_lv
  type: SegmentedSelector
  properties:
    title: Default Priority
    options:
      - label: Low
        value: low
      - label: Medium
        value: medium
      - label: High
        value: high
      - label: Critical
        value: critical
- id: size_large_lv
  type: SegmentedSelector
  properties:
    title: Large Priority
    size: large
    options:
      - label: Low
        value: low
      - label: Medium
        value: medium
      - label: High
        value: high
      - label: Critical
        value: critical
```

```yaml
size_small_lv:
  _state: size_small_lv
size_default_lv:
  _state: size_default_lv
size_large_lv:
  _state: size_large_lv
```

```yaml
- id: shape_default
  type: SegmentedSelector
  properties:
    title: Default Shape
    shape: default
    options:
      - label: List
        value: list
      - label: Grid
        value: grid
      - label: Board
        value: board
- id: shape_round
  type: SegmentedSelector
  properties:
    title: Round Shape
    shape: round
    options:
      - label: List
        value: list
      - label: Grid
        value: grid
      - label: Board
        value: board
- id: block_segmented
  type: SegmentedSelector
  properties:
    title: Full Width
    block: true
    options:
      - label: List
        value: list
      - label: Grid
        value: grid
      - label: Board
        value: board
- id: block_round
  type: SegmentedSelector
  properties:
    title: Full Width Round
    block: true
    shape: round
    options:
      - label: Newest
        value: newest
      - label: Popular
        value: popular
      - label: Trending
        value: trending
- id: block_round_large
  type: SegmentedSelector
  properties:
    title: Full Width Round Large
    block: true
    shape: round
    size: large
    options:
      - label: All
        value: all
      - label: Images
        value: images
      - label: Videos
        value: videos
      - label: Documents
        value: documents
```

```yaml
shape_default:
  _state: shape_default
shape_round:
  _state: shape_round
block_segmented:
  _state: block_segmented
block_round:
  _state: block_round
block_round_large:
  _state: block_round_large
```

```yaml
- id: icon_view_mode
  type: SegmentedSelector
  properties:
    title: View Mode
    options:
      - label: List
        value: list
        icon: AiOutlineUnorderedList
      - label: Grid
        value: grid
        icon: AiOutlineAppstore
      - label: Calendar
        value: calendar
        icon: AiOutlineCalendar
- id: icon_small
  type: SegmentedSelector
  properties:
    title: Small Icons
    size: small
    options:
      - label: Map
        value: map
        icon: AiOutlineEnvironment
      - label: Satellite
        value: satellite
        icon: AiOutlineGlobal
      - label: Terrain
        value: terrain
        icon: AiOutlineBlock
- id: icon_block
  type: SegmentedSelector
  properties:
    title: Full Width with Icons
    block: true
    options:
      - label: Home
        value: home
        icon: AiOutlineHome
      - label: Search
        value: search
        icon: AiOutlineSearch
      - label: Favorites
        value: favorites
        icon: AiOutlineHeart
      - label: Profile
        value: profile
        icon: AiOutlineUser
- id: icon_round
  type: SegmentedSelector
  properties:
    title: Round with Icons
    shape: round
    options:
      - label: Code
        value: code
        icon: AiOutlineCode
      - label: Preview
        value: preview
        icon: AiOutlineEye
      - label: Split
        value: split
        icon: AiOutlineColumnWidth
```

```yaml
icon_view_mode:
  _state: icon_view_mode
icon_small:
  _state: icon_small
icon_block:
  _state: icon_block
icon_round:
  _state: icon_round
```

```yaml
- id: vertical_basic
  type: SegmentedSelector
  properties:
    title: Vertical
    vertical: true
    options:
      - label: Overview
        value: overview
      - label: Details
        value: details
      - label: History
        value: history
- id: vertical_icons
  type: SegmentedSelector
  properties:
    title: Vertical with Icons
    vertical: true
    options:
      - label: Dashboard
        value: dashboard
        icon: AiOutlineDashboard
      - label: Analytics
        value: analytics
        icon: AiOutlineBarChart
      - label: Reports
        value: reports
        icon: AiOutlineFileText
      - label: Settings
        value: settings
        icon: AiOutlineSetting
- id: vertical_large
  type: SegmentedSelector
  properties:
    title: Large Vertical
    vertical: true
    size: large
    options:
      - Tab 1
      - Tab 2
      - Tab 3
```

```yaml
vertical_basic:
  _state: vertical_basic
vertical_icons:
  _state: vertical_icons
vertical_large:
  _state: vertical_large
```

```yaml
- id: disabled_all
  type: SegmentedSelector
  properties:
    title: Fully Disabled
    disabled: true
    options:
      - Option A
      - Option B
      - Option C
- id: disabled_multiple
  type: SegmentedSelector
  properties:
    title: Multiple Disabled Options
    options:
      - label: Free
        value: free
      - label: Basic
        value: basic
      - label: Pro (Coming Soon)
        value: pro
        disabled: true
      - label: Enterprise (Coming Soon)
        value: enterprise
        disabled: true
- id: disabled_icons
  type: SegmentedSelector
  properties:
    title: Disabled with Icons
    disabled: true
    options:
      - label: Edit
        value: edit
        icon: AiOutlineEdit
      - label: View
        value: view
        icon: AiOutlineEye
      - label: Delete
        value: delete
        icon: AiOutlineDelete
```

```yaml
disabled_all:
  _state: disabled_all
disabled_multiple:
  _state: disabled_multiple
disabled_icons:
  _state: disabled_icons
```

```yaml
- id: label_default
  type: SegmentedSelector
  properties:
    title: Default Label
    options:
      - Alpha
      - Beta
      - Gamma
- id: label_extra
  type: SegmentedSelector
  properties:
    title: With Extra Text
    label:
      extra: Select the deployment environment
    options:
      - label: Dev
        value: dev
      - label: Staging
        value: staging
      - label: Prod
        value: prod
- id: label_inline
  type: SegmentedSelector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 6
    options:
      - label: Light
        value: light
      - label: Dark
        value: dark
      - label: Auto
        value: auto
- id: label_inline_right
  type: SegmentedSelector
  properties:
    title: Inline Right
    label:
      inline: true
      span: 6
      align: right
    options:
      - label: Light
        value: light
      - label: Dark
        value: dark
      - label: Auto
        value: auto
- id: no_label_segmented
  type: SegmentedSelector
  properties:
    label:
      disabled: true
    options:
      - label: Day
        value: day
      - label: Week
        value: week
      - label: Month
        value: month
      - label: Year
        value: year
```

```yaml
label_default:
  _state: label_default
label_extra:
  _state: label_extra
label_inline:
  _state: label_inline
label_inline_right:
  _state: label_inline_right
no_label_segmented:
  _state: no_label_segmented
```

```yaml
- id: style_background
  type: SegmentedSelector
  properties:
    title: Custom Background
    options:
      - label: Tab A
        value: a
      - label: Tab B
        value: b
      - label: Tab C
        value: c
  style:
    .element:
      borderRadius: 12
- id: style_border
  type: SegmentedSelector
  properties:
    title: Custom Border
    options:
      - label: Left
        value: left
      - label: Center
        value: center
      - label: Right
        value: right
  style:
    .element:
      border: "2px solid #91caff"
      borderRadius: 8
- id: class_shadow
  type: SegmentedSelector
  class: shadow-md
  properties:
    title: With Shadow
    options:
      - label: Recent
        value: recent
      - label: Popular
        value: popular
      - label: Featured
        value: featured
```

```yaml
style_background:
  _state: style_background
style_border:
  _state: style_border
class_shadow:
  _state: class_shadow
```

```yaml
- id: theme_dark_track
  type: SegmentedSelector
  properties:
    title: Dark Track
    options:
      - label: Overview
        value: overview
      - label: Details
        value: details
      - label: Logs
        value: logs
    theme:
      trackBg: "#1f1f1f"
      itemColor: "#ffffffa6"
      itemSelectedBg: "#177ddc"
      itemSelectedColor: "#ffffff"
      itemHoverColor: "#ffffffd9"
- id: theme_green
  type: SegmentedSelector
  properties:
    title: Green Theme
    options:
      - label: Approved
        value: approved
      - label: Pending
        value: pending
      - label: Rejected
        value: rejected
    theme:
      itemSelectedBg: "#52c41a"
      itemSelectedColor: "#ffffff"
      itemHoverBg: "#b7eb8f80"
- id: theme_purple
  type: SegmentedSelector
  properties:
    title: Purple Theme
    options:
      - label: Basic
        value: basic
      - label: Premium
        value: premium
      - label: Enterprise
        value: enterprise
    theme:
      itemSelectedBg: "#722ed1"
      itemSelectedColor: "#ffffff"
- id: theme_round_dark
  type: SegmentedSelector
  properties:
    title: Round Dark Pill
    shape: round
    size: large
    options:
      - label: Light
        value: light
      - label: Dark
        value: dark
      - label: System
        value: system
    theme:
      trackBg: "#262626"
      itemColor: "#ffffffa6"
      itemSelectedBg: "#434343"
      itemSelectedColor: "#ffffff"
      itemHoverColor: "#ffffffd9"
      borderRadius: 40
      borderRadiusLG: 40
- id: theme_block_gradient
  type: SegmentedSelector
  properties:
    title: Full Width Themed
    block: true
    options:
      - label: Dashboard
        value: dashboard
      - label: Projects
        value: projects
      - label: Tasks
        value: tasks
      - label: Calendar
        value: calendar
    theme:
      itemSelectedBg: "#2f54eb"
      itemSelectedColor: "#ffffff"
      trackPadding: 4
```

```yaml
theme_dark_track:
  _state: theme_dark_track
theme_green:
  _state: theme_green
theme_purple:
  _state: theme_purple
theme_round_dark:
  _state: theme_round_dark
theme_block_gradient:
  _state: theme_block_gradient
```

```yaml
- id: applied2_dashboard_card
  type: Card
  properties:
    title: Sales Dashboard
  blocks:
    - id: applied2_dashboard_view_toggle
      type: SegmentedSelector
      properties:
        title: View
        block: true
        size: large
        label:
          disabled: true
        options:
          - label: Overview
            value: overview
            icon: AiOutlineDashboard
          - label: Charts
            value: charts
            icon: AiOutlineBarChart
          - label: Table
            value: table
            icon: AiOutlineTable
      events:
        onChange:
          - id: view_changed_action
            type: SetState
            params:
              applied2_dashboard_view:
                _state: applied2_dashboard_view_toggle
    - id: applied2_dashboard_date_range
      type: DateRangeSelector
      properties:
        title: Date Range
        placeholder:
          - From
          - To
        format: DD MMM YYYY
        label:
          disabled: true
    - id: applied2_dashboard_refresh_btn
      type: Button
      properties:
        title: Refresh Data
        icon: AiOutlineReload
        type: primary
      events:
        onClick:
          - id: refresh_action
            type: DisplayMessage
            params:
              content: Dashboard data refreshed.
              duration: 2
```

```yaml
- id: applied2_dashboard_card
  type: Card
  properties:
    title: Sales Dashboard
  blocks:
    - id: applied2_dashboard_view_toggle
      type: SegmentedSelector
      properties:
        title: View
        block: true
        size: large
        label:
          disabled: true
        options:
          - label: Overview
            value: overview
            icon: AiOutlineDashboard
          - label: Charts
            value: charts
            icon: AiOutlineBarChart
          - label: Table
            value: table
            icon: AiOutlineTable
      events:
        onChange:
          - id: view_changed_action
            type: SetState
            params:
              applied2_dashboard_view:
                _state: applied2_dashboard_view_toggle
    - id: applied2_dashboard_date_range
      type: DateRangeSelector
      properties:
        title: Date Range
        placeholder:
          - From
          - To
        format: DD MMM YYYY
        label:
          disabled: true
    - id: applied2_dashboard_refresh_btn
      type: Button
      properties:
        title: Refresh Data
        icon: AiOutlineReload
        type: primary
      events:
        onClick:
          - id: refresh_action
            type: DisplayMessage
            params:
              content: Dashboard data refreshed.
              duration: 2
```

```yaml
applied2_dashboard_card:
  _state: applied2_dashboard_card
```

```yaml
- id: applied3_settings_card
  type: Card
  properties:
    title: Application Settings
  blocks:
    - id: applied3_theme_selector
      type: SegmentedSelector
      properties:
        title: Theme
        block: true
        options:
          - label: Light
            value: light
            icon: AiOutlineBulb
          - label: Dark
            value: dark
            icon: AiOutlineEyeInvisible
          - label: System
            value: system
            icon: AiOutlineLaptop
      events:
        onChange:
          - id: theme_changed_action
            type: SetState
            params:
              applied3_theme:
                _state: applied3_theme_selector
    - id: applied3_language_selector
      type: SegmentedSelector
      properties:
        title: Language
        options:
          - label: English
            value: en
          - label: French
            value: fr
          - label: German
            value: de
      events:
        onChange:
          - id: language_changed_action
            type: SetState
            params:
              applied3_language:
                _state: applied3_language_selector
    - id: applied3_notifications_toggle
      type: SegmentedSelector
      properties:
        title: Notifications
        options:
          - label: All
            value: all
          - label: Important
            value: important
          - label: None
            value: none
      events:
        onChange:
          - id: notifications_changed_action
            type: SetState
            params:
              applied3_notifications:
                _state: applied3_notifications_toggle
    - id: applied3_save_btn
      type: Button
      properties:
        title: Save Settings
        icon: AiOutlineSave
        type: primary
      events:
        onClick:
          - id: save_settings_action
            type: DisplayMessage
            params:
              content: Settings saved successfully.
              duration: 2
```

```yaml
- id: applied3_settings_card
  type: Card
  properties:
    title: Application Settings
  blocks:
    - id: applied3_theme_selector
      type: SegmentedSelector
      properties:
        title: Theme
        block: true
        options:
          - label: Light
            value: light
            icon: AiOutlineBulb
          - label: Dark
            value: dark
            icon: AiOutlineEyeInvisible
          - label: System
            value: system
            icon: AiOutlineLaptop
      events:
        onChange:
          - id: theme_changed_action
            type: SetState
            params:
              applied3_theme:
                _state: applied3_theme_selector
    - id: applied3_language_selector
      type: SegmentedSelector
      properties:
        title: Language
        options:
          - label: English
            value: en
          - label: French
            value: fr
          - label: German
            value: de
      events:
        onChange:
          - id: language_changed_action
            type: SetState
            params:
              applied3_language:
                _state: applied3_language_selector
    - id: applied3_notifications_toggle
      type: SegmentedSelector
      properties:
        title: Notifications
        options:
          - label: All
            value: all
          - label: Important
            value: important
          - label: None
            value: none
      events:
        onChange:
          - id: notifications_changed_action
            type: SetState
            params:
              applied3_notifications:
                _state: applied3_notifications_toggle
    - id: applied3_save_btn
      type: Button
      properties:
        title: Save Settings
        icon: AiOutlineSave
        type: primary
      events:
        onClick:
          - id: save_settings_action
            type: DisplayMessage
            params:
              content: Settings saved successfully.
              duration: 2
```

```yaml
applied3_settings_card:
  _state: applied3_settings_card
```

```yaml
- id: data_segmented_selector
  type: SegmentedSelector
  properties:
    title: Range
    data:
      - id: 1
        name: Day
      - id: 2
        name: Week
      - id: 3
        name: Month
    html: "{{ item.name }}"
    valueKey: id
```

```yaml
data_segmented_selector:
  _state: data_segmented_selector
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `block` | boolean | `false` | Option to fit width to its parent's width. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `data` | array | - | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string | - | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string | - | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string | - | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `options` | array | `[]` | Options can either be an array of primitive values, or an array of label, value pairs - supports html. |
| `options.$.label` | string | - | Value label shown to user - supports html. |
| `options.$.value` | string \| number \| boolean \| object \| array | - | Value selected. Can be of any type. |
| `options.$.disabled` | boolean | `false` | Disable the option if true. |
| `options.$.icon` | string | - | Name of a React-Icon (See [all icons](https://react-icons.github.io/react-icons/)) to display in the segment option. |
| `shape` | string | `"default"` | Shape of the segmented control. Enum: `default`, `round`. |
| `size` | string | `"middle"` | Size of the block. Enum: `small`, `middle`, `large`. |
| `vertical` | boolean | `false` | Display the segmented control vertically. |
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
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design segmented tokens](https://ant.design/components/segmented#design-token). |
| `theme.trackBg` | string | - | Background color of the segmented track container. |
| `theme.trackPadding` | number | - | Padding around the segmented track. |
| `theme.itemColor` | string | - | Default text color for segmented items. |
| `theme.itemHoverColor` | string | - | Text color when hovering over a segmented item. |
| `theme.itemHoverBg` | string | - | Background color when hovering over a segmented item. |
| `theme.itemActiveBg` | string | - | Background color when a segmented item is being pressed. |
| `theme.itemSelectedBg` | string | - | Background color of the selected segmented item. |
| `theme.itemSelectedColor` | string | - | Text color of the selected segmented item. |
| `theme.borderRadius` | number | `6` | Border radius of the segmented control. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large segmented control. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small segmented control. |
| `theme.controlHeight` | number | `32` | Height of the segmented control. |
| `theme.controlHeightLG` | number | `40` | Height for large segmented control. |
| `theme.controlHeightSM` | number | `24` | Height for small segmented control. |
| `theme.fontSize` | number | `14` | Font size of segmented item text. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any }` | Trigger actions when selection is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The SegmentedSelector element. |
| `/icon` | The icon in the SegmentedSelector. |
| `/label` | The SegmentedSelector label. |
| `/extra` | The SegmentedSelector extra content. |
| `/feedback` | The SegmentedSelector validation feedback. |

No slots defined.
