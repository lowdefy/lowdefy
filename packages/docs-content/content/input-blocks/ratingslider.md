# RatingSlider

Rating slider with customizable range, icons, and N/A option.

```yaml
- id: default_rating
  type: RatingSlider
  properties:
    title: Satisfaction Rating
```

```yaml
- id: range_0_5
  type: RatingSlider
  properties:
    title: Rating (0-5)
    min: 0
    max: 5
- id: range_1_10
  type: RatingSlider
  properties:
    title: Rating (1-10)
    min: 1
    max: 10
- id: range_0_100_step10
  type: RatingSlider
  properties:
    title: Percentage (0-100, step 10)
    min: 0
    max: 100
    step: 10
    showDots: false
- id: range_negative
  type: RatingSlider
  properties:
    title: Temperature (-5 to 5)
    min: -5
    max: 5
```

```yaml
- id: step_1
  type: RatingSlider
  properties:
    title: Step 1 (default)
    min: 0
    max: 10
    step: 1
- id: step_2
  type: RatingSlider
  properties:
    title: Step 2
    min: 0
    max: 10
    step: 2
- id: step_5
  type: RatingSlider
  properties:
    title: Step 5
    min: 0
    max: 50
    step: 5
- id: step_half
  type: RatingSlider
  properties:
    title: Step 0.5
    min: 0
    max: 5
    step: 0.5
```

```yaml
- id: marks_and_dots
  type: RatingSlider
  properties:
    title: Marks and Dots (defaults)
    showMarks: true
    showDots: true
- id: marks_only
  type: RatingSlider
  properties:
    title: Marks Only (no dots)
    showMarks: true
    showDots: false
- id: dots_only
  type: RatingSlider
  properties:
    title: Dots Only (no marks)
    showMarks: false
    showDots: true
- id: no_marks_no_dots
  type: RatingSlider
  properties:
    title: No Marks, No Dots
    showMarks: false
    showDots: false
- id: marks_step_2
  type: RatingSlider
  properties:
    title: Marks with Step 2
    min: 0
    max: 10
    step: 2
    showMarks: true
    showDots: true
```

```yaml
- id: tooltip_onclick
  type: RatingSlider
  properties:
    title: Tooltip on Click (default)
    tooltipVisible: onClick
- id: tooltip_always
  type: RatingSlider
  properties:
    title: Tooltip Always Visible
    tooltipVisible: always
- id: tooltip_never
  type: RatingSlider
  properties:
    title: Tooltip Never Visible
    tooltipVisible: never
```

```yaml
- id: na_default
  type: RatingSlider
  properties:
    title: With N/A Option (default)
    min: 0
    max: 10
- id: na_disabled
  type: RatingSlider
  properties:
    title: N/A Disabled
    disableNotApplicable: true
    min: 0
    max: 10
- id: na_custom_label
  type: RatingSlider
  properties:
    title: Custom N/A Label
    notApplicableLabel: None
    min: 0
    max: 10
- id: na_skip_label
  type: RatingSlider
  properties:
    title: N/A as "Skip"
    notApplicableLabel: Skip
    min: 1
    max: 5
```

```yaml
- id: icons_default
  type: RatingSlider
  properties:
    title: Default Icons (Frown / Smile)
    min: 0
    max: 10
- id: icons_custom
  type: RatingSlider
  properties:
    title: Custom Icons (Dislike / Like)
    minIcon: AiOutlineDislike
    maxIcon: AiOutlineLike
    min: 0
    max: 10
- id: icons_star
  type: RatingSlider
  properties:
    title: Star Icons
    minIcon: AiOutlineStar
    maxIcon: AiFillStar
    min: 1
    max: 5
- id: icons_heart
  type: RatingSlider
  properties:
    title: Heart Icons
    minIcon: AiOutlineHeart
    maxIcon: AiFillHeart
    min: 0
    max: 10
- id: icons_object_config
  type: RatingSlider
  properties:
    title: Icon Object Config (colored)
    minIcon:
      name: AiOutlineArrowDown
      color: "#ff4d4f"
    maxIcon:
      name: AiOutlineArrowUp
      color: "#52c41a"
    min: 0
    max: 10
```

```yaml
- id: color_blue
  type: RatingSlider
  properties:
    title: Blue (default primary)
    color: "#1677ff"
    min: 0
    max: 10
- id: color_green
  type: RatingSlider
  properties:
    title: Green
    color: "#52c41a"
    min: 0
    max: 10
- id: color_orange
  type: RatingSlider
  properties:
    title: Orange
    color: "#fa8c16"
    min: 0
    max: 10
- id: color_red
  type: RatingSlider
  properties:
    title: Red
    color: "#ff4d4f"
    min: 0
    max: 10
- id: color_purple
  type: RatingSlider
  properties:
    title: Purple
    color: "#722ed1"
    min: 0
    max: 10
```

```yaml
- id: disabled_default
  type: RatingSlider
  properties:
    title: Disabled
    disabled: true
- id: disabled_no_icons
  type: RatingSlider
  properties:
    title: Disabled Without Icons
    disabled: true
    disableIcons: true
- id: disabled_no_na
  type: RatingSlider
  properties:
    title: Disabled, No N/A
    disabled: true
    disableNotApplicable: true
- id: disabled_colored
  type: RatingSlider
  properties:
    title: Disabled with Color
    disabled: true
    color: "#722ed1"
```

```yaml
- id: autofocus_enabled
  type: RatingSlider
  properties:
    title: AutoFocus Enabled
    autoFocus: true
    min: 0
    max: 5
- id: autofocus_disabled
  type: RatingSlider
  properties:
    title: AutoFocus Disabled (default)
    autoFocus: false
    min: 0
    max: 5
```

```yaml
- id: label_default
  type: RatingSlider
  properties:
    title: Default Label
- id: label_with_extra
  type: RatingSlider
  properties:
    title: Rating with Extra
    label:
      extra: Please rate your experience from 0 to 10.
- id: label_inline
  type: RatingSlider
  properties:
    title: Inline Label
    label:
      inline: true
      span: 6
- id: label_inline_right
  type: RatingSlider
  properties:
    title: Inline Right-Aligned
    label:
      inline: true
      span: 6
      align: right
- id: label_no_colon
  type: RatingSlider
  properties:
    title: No Colon
    label:
      colon: false
```

```yaml
- id: minimal_slider
  type: RatingSlider
  properties:
    title: Minimal Slider
    disableIcons: true
    disableNotApplicable: true
    min: 0
    max: 10
- id: minimal_no_marks
  type: RatingSlider
  properties:
    title: Minimal No Marks
    disableIcons: true
    disableNotApplicable: true
    showMarks: false
    showDots: false
    min: 0
    max: 10
- id: minimal_no_label
  type: RatingSlider
  properties:
    label:
      disabled: true
    disableIcons: true
    disableNotApplicable: true
    min: 0
    max: 5
```

```yaml
- id: combo_survey_satisfaction
  type: RatingSlider
  properties:
    title: Customer Satisfaction
    min: 1
    max: 5
    step: 1
    color: "#52c41a"
    minIcon: AiOutlineFrown
    maxIcon: AiOutlineSmile
    tooltipVisible: always
    showMarks: true
    showDots: true
    label:
      extra: Rate your overall satisfaction
- id: combo_nps
  type: RatingSlider
  properties:
    title: Net Promoter Score
    min: 0
    max: 10
    step: 1
    color: "#1677ff"
    minIcon: AiOutlineDislike
    maxIcon: AiOutlineLike
    tooltipVisible: onClick
    showMarks: true
    showDots: true
    notApplicableLabel: Prefer not to say
    label:
      extra: How likely are you to recommend us?
- id: combo_temperature
  type: RatingSlider
  properties:
    title: Temperature Preference
    min: 0
    max: 100
    step: 5
    color: "#fa8c16"
    disableIcons: true
    disableNotApplicable: true
    tooltipVisible: always
    showMarks: true
    showDots: false
    label:
      extra: Set your preferred temperature (0-100)
- id: combo_difficulty
  type: RatingSlider
  properties:
    title: Difficulty Level
    min: 1
    max: 5
    step: 1
    color: "#ff4d4f"
    minIcon:
      name: AiOutlineSmile
      color: "#52c41a"
    maxIcon:
      name: AiOutlineWarning
      color: "#ff4d4f"
    disableNotApplicable: true
    showMarks: true
    showDots: true
    tooltipVisible: onClick
```

```yaml
- id: style_background
  type: RatingSlider
  properties:
    title: Custom Background
    min: 0
    max: 10
  style:
    .element:
      padding: 8
      borderRadius: 8
- id: style_wide
  type: RatingSlider
  properties:
    title: Full Width with Padding
    min: 0
    max: 10
    disableNotApplicable: true
  style:
    .element:
      paddingLeft: 16
      paddingRight: 16
```

```yaml
- id: class_rounded
  type: RatingSlider
  class: rounded-lg shadow-sm p-2 border border-border
  properties:
    title: Rounded Card Style
    min: 0
    max: 10
- id: class_gradient_bg
  type: RatingSlider
  class: bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-md
  properties:
    title: Gradient Background
    min: 0
    max: 10
    color: "#722ed1"
```

```yaml
- id: theme_large_handle
  type: RatingSlider
  properties:
    title: Large Handle
    min: 0
    max: 10
    theme:
      handleSize: 14
      handleSizeHover: 16
- id: theme_thick_rail
  type: RatingSlider
  properties:
    title: Thick Rail
    min: 0
    max: 10
    theme:
      railSize: 8
- id: theme_custom_colors
  type: RatingSlider
  properties:
    title: Custom Track and Rail Colors
    min: 0
    max: 10
    theme:
      trackBg: "#b7eb8f"
      trackHoverBg: "#73d13d"
      handleColor: "#52c41a"
      handleActiveColor: "#389e0d"
- id: theme_large_dots
  type: RatingSlider
  properties:
    title: Large Dots
    min: 0
    max: 10
    showDots: true
    theme:
      dotSize: 12
- id: theme_purple_slider
  type: RatingSlider
  properties:
    title: Purple Theme
    min: 0
    max: 10
    color: "#722ed1"
    theme:
      trackHoverBg: "#b37feb"
      handleColor: "#722ed1"
      handleActiveColor: "#531dab"
      dotBorderColor: "#d3adf7"
      dotActiveBorderColor: "#722ed1"
```

```yaml
- id: applied_product_review_card
  type: Card
  properties:
    title: Write a Product Review
  blocks:
    - id: applied_product_review_rating
      type: RatingSlider
      required: true
      properties:
        title: Product Rating
        min: 1
        max: 5
        step: 1
        color: "#fa8c16"
        minIcon: AiOutlineStar
        maxIcon: AiFillStar
        showMarks: true
        showDots: true
        disableNotApplicable: true
        label:
          extra: How would you rate this product?
      events:
        onChange:
          - id: applied_product_review_set_rating
            type: SetState
            params:
              productRating:
                _event: value
    - id: applied_product_review_text
      type: TextArea
      properties:
        title: Your Review
        label:
          extra: Tell us more about your experience.
        rows: 4
    - id: applied_product_review_submit
      type: Button
      properties:
        title: Submit Review
        icon: AiOutlineSend
        type: primary
        block: true
      events:
        onClick:
          - id: applied_product_review_validate
            type: Validate
            params: applied_product_review_rating
          - id: applied_product_review_message
            type: DisplayMessage
            params:
              content: Thank you for your review!
              status: success
```

```yaml
- id: applied_survey_card
  type: Card
  properties:
    title: Customer Feedback Survey
  blocks:
    - id: applied_survey_service_rating
      type: RatingSlider
      properties:
        title: Service Quality
        min: 1
        max: 10
        color: "#1677ff"
        minIcon: AiOutlineFrown
        maxIcon: AiOutlineSmile
        showMarks: true
        label:
          extra: How would you rate the service you received?
    - id: applied_survey_quality_rating
      type: RatingSlider
      properties:
        title: Product Quality
        min: 1
        max: 10
        color: "#52c41a"
        minIcon: AiOutlineDislike
        maxIcon: AiOutlineLike
        showMarks: true
        label:
          extra: How would you rate the quality of our products?
    - id: applied_survey_value_rating
      type: RatingSlider
      properties:
        title: Value for Money
        min: 1
        max: 10
        color: "#fa8c16"
        showMarks: true
        label:
          extra: How would you rate the value for money?
    - id: applied_survey_submit
      type: Button
      properties:
        title: Submit Survey
        icon: AiOutlineCheck
        type: primary
        block: true
      events:
        onClick:
          - id: applied_survey_message
            type: DisplayMessage
            params:
              content: Survey submitted successfully. Thank you for your feedback!
              status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `color` | string | - | Rating slider color. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `disableIcons` | boolean | `false` | Hides minimum and maximum icons. |
| `disableNotApplicable` | boolean | `false` | Disables the N/A option left of slider. |
| `minIcon` | string \| object | `"AiOutlineFrown"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize the icon to the left of the minimum side of the slider. |
| `maxIcon` | string \| object | `"AiOutlineSmile"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize the icon to the right of the maximum side of the slider. |
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
| `min` | number | `0` | The minimum value of the slider. |
| `max` | number | `10` | The maximum value of the slider. |
| `notApplicableLabel` | string | `"N/A"` | Label shown at the null value of the slider. |
| `showDots` | boolean | `true` | Shows dots at values between step values when true. |
| `showMarks` | boolean | `true` | Shows values at specified min, max and step values. |
| `step` | number | `1` |  The size of the step between values, has to be values greater than 0. |
| `tooltipVisible` | string | `"onClick"` | When tooltip should be visible. Enum: `never`, `onClick`, `always`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design slider tokens](https://ant.design/components/slider#design-token). |
| `theme.controlSize` | number | `10` | Size of the slider control element. |
| `theme.railSize` | number | `4` | Height (horizontal) or width (vertical) of the slider rail track. |
| `theme.handleSize` | number | `10` | Size of the slider handle. |
| `theme.handleSizeHover` | number | `12` | Size of the slider handle on hover. |
| `theme.dotSize` | number | `8` | Size of the slider step dots. |
| `theme.handleLineWidth` | number | `2` | Border line width of the handle. |
| `theme.handleLineWidthHover` | number | `2.5` | Border line width of the handle on hover. |
| `theme.railBg` | string | `"rgba(0,0,0,0.04)"` | Background color of the slider rail. |
| `theme.railHoverBg` | string | `"rgba(0,0,0,0.06)"` | Background color of the slider rail on hover. |
| `theme.trackBg` | string | `"#91caff"` | Background color of the active track. |
| `theme.trackHoverBg` | string | `"#69b1ff"` | Background color of the active track on hover. |
| `theme.handleColor` | string | `"#91caff"` | Color of the slider handle. |
| `theme.handleActiveColor` | string | `"#1677ff"` | Color of the slider handle when active. |
| `theme.handleActiveOutlineColor` | string | `"rgba(22,119,255,0.2)"` | Color of the handle focus outline ring. |
| `theme.handleColorDisabled` | string | `"#bfbfbf"` | Color of the slider handle when disabled. |
| `theme.dotBorderColor` | string | `"#f0f0f0"` | Border color of the step dots. |
| `theme.dotActiveBorderColor` | string | `"#91caff"` | Border color of the active step dots. |
| `theme.trackBgDisabled` | string | `"rgba(0,0,0,0.04)"` | Background color of the track when disabled. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value }` | Trigger action when rating is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The RatingSlider element. |
| `/label` | The RatingSlider label. |
| `/extra` | The RatingSlider extra content. |
| `/feedback` | The RatingSlider validation feedback. |
| `/minIcon` | The min icon in the RatingSlider. |
| `/maxIcon` | The max icon in the RatingSlider. |

No slots defined.
