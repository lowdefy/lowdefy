# Statistic

Statistic display with prefix, suffix, and formatting.

```yaml
- id: value_number
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Active Users
    value: 112893
- id: value_decimal
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Account Balance
    value: 112893.12
    precision: 2
- id: value_string
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Status
    value: Running
- id: value_version
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Version
    value: v4.2.1
```

```yaml
- id: prefix_dollar
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Revenue
    value: 24500
    prefix: $
- id: suffix_percent
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Completion
    value: 93.5
    suffix: "%"
- id: suffix_unit
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Response Time
    value: 42
    suffix: ms
- id: prefix_suffix_price
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Price
    value: 49.99
    prefix: $
    suffix: /mo
```

```yaml
- id: prefixicon_like
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Feedback
    value: 1128
    prefixIcon: AiOutlineLike
- id: prefixicon_arrow_up
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Growth
    value: 11.28
    suffix: "%"
    prefixIcon:
      name: AiOutlineArrowUp
      color: "#3f8600"
- id: prefixicon_arrow_down
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Decline
    value: 9.3
    suffix: "%"
    prefixIcon:
      name: AiOutlineArrowDown
      color: "#cf1322"
- id: suffixicon_rise
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Revenue Trend
    value: 12500
    prefix: $
    suffixIcon:
      name: AiOutlineRise
      color: "#3f8600"
- id: suffixicon_info
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Sessions
    value: 8920
    suffixIcon: AiOutlineInfoCircle
```

```yaml
- id: precision_0
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Total Sales
    value: 142587
    precision: 0
- id: precision_1
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Average Rating
    value: 4.7
    precision: 1
- id: precision_2
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Average Price
    value: 49.99
    precision: 2
    prefix: $
```

```yaml
- id: sep_default
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Default (Comma)
    value: 1234567.89
    precision: 2
- id: sep_space
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Space Separator
    value: 1234567.89
    precision: 2
    groupSeparator: " "
- id: sep_european
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: European Format
    value: 1234567.89
    precision: 2
    groupSeparator: .
    decimalSeparator: ","
```

```yaml
- id: loading_true
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Fetching Data
    value: 0
    loading: true
- id: loading_false
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Data Loaded
    value: 12345
    loading: false
- id: loading_with_prefix
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Loading Revenue
    value: 52800
    prefix: $
    loading: true
```

```yaml
- id: html_bold_title
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: <b>Important</b> Metric
    value: 98.7
    suffix: "%"
- id: html_colored_title
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: '<span style="color: #1677ff">Active</span> Connections'
    value: 1024
- id: html_icon_title
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Server Status &#x2705;
    value: Healthy
```

```yaml
- id: css_tailwind_bg
  type: Statistic
  layout:
    flex: 0 0 auto
  class: bg-bg-layout p-4 rounded-lg border border-border
  properties:
    title: Monthly Revenue
    value: 52800
    prefix: $
- id: css_tailwind_blue
  type: Statistic
  layout:
    flex: 0 0 auto
  class: bg-bg-layout p-4 rounded-lg border border-border
  properties:
    title: Active Users
    value: 2847
    prefixIcon: AiOutlineTeam
- id: css_tailwind_center
  type: Statistic
  layout:
    flex: 0 0 auto
  class: text-center bg-bg-layout p-4 rounded-lg border border-border
  properties:
    title: Avg. Score
    value: 94.2
    suffix: "%"
- id: css_inline_value
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Error Rate
    value: 0.12
    suffix: "%"
  style:
    .element:
      padding: 16px 24px
      borderRadius: 8px
      border: 1px solid
    .value:
      color: "#cf1322"
      fontSize: 28
```

```yaml
- id: theme_large_title
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Large Title Size
    value: 42
    theme:
      titleFontSize: 20
- id: theme_large_content
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Large Value Font
    value: 99.9
    suffix: "%"
    theme:
      contentFontSize: 36
- id: theme_custom_colors
  type: Statistic
  layout:
    flex: 0 0 auto
  properties:
    title: Custom Color Theme
    value: 1250
    prefix: $
    theme:
      colorText: "#722ed1"
      colorTextDescription: "#531dab"
```

_Last updated 2 minutes ago_

```yaml
- id: dashboard_card
  type: Card
  properties:
    title: System Overview
    size: small
  blocks:
    - id: dashboard_row
      type: Box
      layout:
        gap: 16
      blocks:
        - id: dash_revenue
          type: Statistic
          layout:
            flex: 1 1 0
          class: bg-bg-layout p-4 rounded-lg
          properties:
            title: Total Revenue
            value: 126560
            prefix: $
            precision: 0
            prefixIcon:
              name: AiOutlineDollarCircle
              color: "#52c41a"
        - id: dash_users
          type: Statistic
          layout:
            flex: 1 1 0
          class: bg-bg-layout p-4 rounded-lg
          properties:
            title: Active Users
            value: 8920
            prefixIcon:
              name: AiOutlineTeam
              color: "#1677ff"
        - id: dash_errors
          type: Statistic
          layout:
            flex: 1 1 0
          class: bg-bg-layout p-4 rounded-lg
          properties:
            title: Error Rate
            value: 0.12
            suffix: "%"
            precision: 2
            prefixIcon:
              name: AiOutlineBug
              color: "#ff4d4f"
    - id: dashboard_updated
      type: Markdown
      properties:
        content: _Last updated 2 minutes ago_
```

```yaml
- id: sales_card
  type: Card
  properties:
    title: Q4 Sales Report
    size: small
  blocks:
    - id: sales_stats
      type: Box
      layout:
        gap: 16
      blocks:
        - id: sales_total
          type: Statistic
          layout:
            flex: 1 1 0
          properties:
            title: Total Sales
            value: 284300
            prefix: $
            precision: 0
            prefixIcon:
              name: AiOutlineArrowUp
              color: "#3f8600"
            theme:
              contentFontSize: 28
        - id: sales_orders
          type: Statistic
          layout:
            flex: 1 1 0
          properties:
            title: Orders
            value: 1523
            prefixIcon: AiOutlineShoppingCart
        - id: sales_avg
          type: Statistic
          layout:
            flex: 1 1 0
          properties:
            title: Avg. Order Value
            value: 186.67
            prefix: $
            precision: 2
    - id: sales_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: sales_export_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Export Report
            icon: AiOutlineDownload
            color: primary
            variant: outlined
          events:
            onClick:
              - id: sales_export_msg
                type: DisplayMessage
                params:
                  content: Report exported successfully.
                  status: success
        - id: sales_share_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Share
            icon: AiOutlineShareAlt
            color: primary
            variant: solid
          events:
            onClick:
              - id: sales_share_msg
                type: DisplayMessage
                params:
                  content: Share link copied to clipboard.
                  status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `decimalSeparator` | string | `"."` | Decimal separator. |
| `groupSeparator` | string | `","` | Group separator. |
| `loading` | boolean | `false` | Control the loading status of Statistic. |
| `precision` | number | - | Number of decimals to display. |
| `prefix` | string | - | Prefix text, priority over prefixIcon. |
| `prefixIcon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon which prefix the statistic. |
| `suffix` | string | - | Suffix text, priority over suffixIcon. |
| `suffixIcon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon which suffix the statistic. |
| `title` | string | - | Title to describe the component - supports html. |
| `value` | number \| string | - | Value to display. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design statistic tokens](https://ant.design/components/statistic#design-token). |
| `theme.titleFontSize` | number | `14` | Font size of the statistic title. |
| `theme.contentFontSize` | number | `24` | Font size of the statistic value. |
| `theme.contentFontWeight` | string | - | Font weight of the statistic value. |
| `theme.contentFontFamily` | string | - | Font family of the statistic value. |
| `theme.colorText` | string | - | Default text color for the statistic value. |
| `theme.colorTextDescription` | string | - | Color for the statistic title text. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Statistic element. |
| `/prefixIcon` | The prefix icon in the Statistic. |
| `/suffixIcon` | The suffix icon in the Statistic. |
| `/value` | The Statistic value. |

No slots defined.
