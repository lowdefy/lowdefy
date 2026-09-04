# Title

Heading title with levels, copyable, ellipsis, and text styles.

h1. Heading Level 1

h2. Heading Level 2

h3. Heading Level 3

h4. Heading Level 4

h5. Heading Level 5

```yaml
- id: level_h1
  type: Title
  properties:
    content: h1. Heading Level 1
    level: 1
- id: level_h2
  type: Title
  properties:
    content: h2. Heading Level 2
    level: 2
- id: level_h3
  type: Title
  properties:
    content: h3. Heading Level 3
    level: 3
- id: level_h4
  type: Title
  properties:
    content: h4. Heading Level 4
    level: 4
- id: level_h5
  type: Title
  properties:
    content: h5. Heading Level 5
    level: 5
```

Default Title

Secondary Title

Success Title

Warning Title

Danger Title

```yaml
- id: type_default
  type: Title
  properties:
    content: Default Title
    level: 4
- id: type_secondary
  type: Title
  properties:
    content: Secondary Title
    level: 4
    type: secondary
- id: type_success
  type: Title
  properties:
    content: Success Title
    level: 4
    type: success
- id: type_warning
  type: Title
  properties:
    content: Warning Title
    level: 4
    type: warning
- id: type_danger
  type: Title
  properties:
    content: Danger Title
    level: 4
    type: danger
```

Blue Title

Green Title

Purple Title

Coral Title

```yaml
- id: color_blue
  type: Title
  properties:
    content: Blue Title
    level: 4
    color: "#1677ff"
- id: color_green
  type: Title
  properties:
    content: Green Title
    level: 4
    color: "#52c41a"
- id: color_purple
  type: Title
  properties:
    content: Purple Title
    level: 4
    color: "#722ed1"
- id: color_coral
  type: Title
  properties:
    content: Coral Title
    level: 3
    color: "#ff6b6b"
```

Code Heading Level 3

const config = lowdefy.init()

npm install lowdefy

```yaml
- id: code_h3
  type: Title
  properties:
    content: Code Heading Level 3
    level: 3
    code: true
- id: code_h4
  type: Title
  properties:
    content: const config = lowdefy.init()
    level: 4
    code: true
- id: code_h5
  type: Title
  properties:
    content: npm install lowdefy
    level: 5
    code: true
```

Italic Title

Underlined Title

Highlighted Title

Deleted Title

Italic & Underlined

```yaml
- id: deco_italic
  type: Title
  properties:
    content: Italic Title
    level: 4
    italic: true
- id: deco_underline
  type: Title
  properties:
    content: Underlined Title
    level: 4
    underline: true
- id: deco_mark
  type: Title
  properties:
    content: Highlighted Title
    level: 4
    mark: true
- id: deco_delete
  type: Title
  properties:
    content: Deleted Title
    level: 4
    delete: true
- id: deco_combined
  type: Title
  properties:
    content: Italic & Underlined
    level: 4
    italic: true
    underline: true
```

Disabled Section Heading

Disabled Subsection

Disabled Caption

```yaml
- id: disabled_h3
  type: Title
  properties:
    content: Disabled Section Heading
    level: 3
    disabled: true
- id: disabled_h4
  type: Title
  properties:
    content: Disabled Subsection
    level: 4
    disabled: true
- id: disabled_h5
  type: Title
  properties:
    content: Disabled Caption
    level: 5
    disabled: true
```

Title with <b>bold</b> and <i>italic</i> words

Visit the <a href="https://lowdefy.com">Lowdefy website</a>

Status: <span style="color: #52c41a">Online</span> / <span style="color: #ff4d4f">Offline</span>

```yaml
- id: html_bold_italic
  type: Title
  properties:
    content: Title with <b>bold</b> and <i>italic</i> words
    level: 4
- id: html_link
  type: Title
  properties:
    content: Visit the <a href="https://lowdefy.com">Lowdefy website</a>
    level: 4
- id: html_colored_spans
  type: Title
  properties:
    content: 'Status: <span style="color: #52c41a">Online</span> / <span
      style="color: #ff4d4f">Offline</span>'
    level: 4
```

Copy this title

Title with custom copy text

Hover the copy icon

Custom copy icon

Two-state copy icons

```yaml
- id: copyable_simple
  type: Title
  properties:
    content: Copy this title
    level: 4
    copyable: true
- id: copyable_custom_text
  type: Title
  properties:
    content: Title with custom copy text
    level: 4
    copyable:
      text: This custom text is copied instead of the visible title.
- id: copyable_tooltips
  type: Title
  properties:
    content: Hover the copy icon
    level: 4
    copyable:
      tooltips:
        - Click to copy
        - Copied!
- id: copyable_custom_icon
  type: Title
  properties:
    content: Custom copy icon
    level: 4
    copyable:
      icon: AiOutlineSnippets
- id: copyable_two_icons
  type: Title
  properties:
    content: Two-state copy icons
    level: 4
    copyable:
      icon:
        - AiOutlineCopy
        - AiOutlineCheck
      tooltips:
        - Copy text
        - Done!
```

This is a very long title that should be truncated with an ellipsis when it overflows the available space in a single line of the container.

This is an extremely long title that demonstrates multi-row ellipsis truncation. When the content exceeds the specified number of rows, it will be truncated and show an ellipsis indicator at the end of the visible text area.

This long title can be expanded by clicking the expand control. It demonstrates how ellipsis with expandable works to let users reveal the full heading when needed.

This title has a custom suffix appended after the ellipsis truncation point so readers know more content exists.

```yaml
- id: ellipsis_single
  type: Title
  properties:
    content: This is a very long title that should be truncated with an ellipsis
      when it overflows the available space in a single line of the container.
    level: 4
    ellipsis: true
- id: ellipsis_rows_2
  type: Title
  properties:
    content: This is an extremely long title that demonstrates multi-row ellipsis
      truncation. When the content exceeds the specified number of rows, it will
      be truncated and show an ellipsis indicator at the end of the visible text
      area.
    level: 5
    ellipsis:
      rows: 2
- id: ellipsis_expandable
  type: Title
  properties:
    content: This long title can be expanded by clicking the expand control. It
      demonstrates how ellipsis with expandable works to let users reveal the
      full heading when needed.
    level: 5
    ellipsis:
      rows: 1
      expandable: true
- id: ellipsis_suffix
  type: Title
  properties:
    content: This title has a custom suffix appended after the ellipsis truncation
      point so readers know more content exists.
    level: 4
    ellipsis:
      rows: 1
      suffix: " /Read More"
```

Tailwind Background

Tailwind Left Border

Uppercase Tracking

Inline Border Bottom

Inline Text Shadow

```yaml
- id: css_tailwind_bg
  type: Title
  class: bg-bg-layout px-4 py-2 rounded-lg
  properties:
    content: Tailwind Background
    level: 4
- id: css_tailwind_border
  type: Title
  class: border-l-4 border-blue-500 pl-3
  properties:
    content: Tailwind Left Border
    level: 4
- id: css_tailwind_uppercase
  type: Title
  class: uppercase tracking-widest
  properties:
    content: Uppercase Tracking
    level: 5
- id: css_inline_border_bottom
  type: Title
  properties:
    content: Inline Border Bottom
    level: 4
  style:
    .element:
      borderBottom: 2px solid
      paddingBottom: 8px
- id: css_inline_shadow
  type: Title
  properties:
    content: Inline Text Shadow
    level: 3
    color: "#1677ff"
  style:
    .element:
      textShadow: 2px 2px 4px rgba(22, 119, 255, 0.3)
```

Large H4 Title

Light Weight Title

Teal Success Title

Extra Margin Title

```yaml
- id: theme_large_h4
  type: Title
  properties:
    content: Large H4 Title
    level: 4
    theme:
      fontSizeHeading4: 28
- id: theme_light_weight
  type: Title
  properties:
    content: Light Weight Title
    level: 3
    theme:
      fontWeightStrong: 300
- id: theme_custom_success
  type: Title
  properties:
    content: Teal Success Title
    level: 4
    type: success
    theme:
      colorSuccess: "#13c2c2"
- id: theme_spacing
  type: Title
  properties:
    content: Extra Margin Title
    level: 4
    theme:
      titleMarginTop: 0px
      titleMarginBottom: 0px
```

Engineering

Building Config-Driven Web Applications

Learn how Lowdefy simplifies complex application development by replacing boilerplate code with declarative YAML configuration.

```yaml
- id: article_card
  type: Card
  properties:
    size: small
  blocks:
    - id: article_category
      type: Title
      properties:
        content: Engineering
        level: 5
        type: secondary
    - id: article_headline
      type: Title
      properties:
        content: Building Config-Driven Web Applications
        level: 2
    - id: article_subtitle
      type: Paragraph
      properties:
        content: Learn how Lowdefy simplifies complex application development by
          replacing boilerplate code with declarative YAML configuration.
        type: secondary
    - id: article_meta
      type: Box
      layout:
        gap: 12
      blocks:
        - id: article_author
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: By Jane Smith
            icon: AiOutlineUser
            color: default
            variant: text
            size: small
        - id: article_date
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: March 12, 2026
            icon: AiOutlineCalendar
            color: default
            variant: text
            size: small
```

Dashboard Overview

Monitor your application performance and key metrics.

Active Users

12,847

Error Rate

0.12%

Requests / min

3,204

Recent Activity

```yaml
- id: dashboard_header
  type: Box
  layout:
    gap: 0
  blocks:
    - id: dashboard_title
      type: Title
      properties:
        content: Dashboard Overview
        level: 2
    - id: dashboard_desc
      type: Paragraph
      properties:
        content: Monitor your application performance and key metrics.
        type: secondary
- id: dashboard_cards
  type: Box
  layout:
    gap: 12
  blocks:
    - id: dashboard_stat_users
      type: Card
      layout:
        flex: 1 1 0
      properties:
        size: small
      blocks:
        - id: stat_users_label
          type: Title
          properties:
            content: Active Users
            level: 5
            type: secondary
        - id: stat_users_value
          type: Title
          properties:
            content: 12,847
            level: 2
            type: success
    - id: dashboard_stat_errors
      type: Card
      layout:
        flex: 1 1 0
      properties:
        size: small
      blocks:
        - id: stat_errors_label
          type: Title
          properties:
            content: Error Rate
            level: 5
            type: secondary
        - id: stat_errors_value
          type: Title
          properties:
            content: 0.12%
            level: 2
            type: danger
    - id: dashboard_stat_requests
      type: Card
      layout:
        flex: 1 1 0
      properties:
        size: small
      blocks:
        - id: stat_requests_label
          type: Title
          properties:
            content: Requests / min
            level: 5
            type: secondary
        - id: stat_requests_value
          type: Title
          properties:
            content: 3,204
            level: 2
- id: dashboard_section_title
  type: Title
  properties:
    content: Recent Activity
    level: 4
    copyable: true
  events:
    onCopy:
      - id: copy_msg
        type: DisplayMessage
        params:
          content: Section title copied.
          status: info
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | boolean | `false` | Apply code style. |
| `color` | string | - | Title color. |
| `content` | string | - | Title text content - supports html. |
| `copyable` | boolean \| object | `false` | Provide copy text button. |
| `copyable.text` | string | - | Paragraph text to copy when clicked. |
| `copyable.icon` | string \| object \| array | - | Copy icon, can be an array or two icons for before and after clicked. |
| `copyable.tooltips` | string \| array | - | Tooltip text, can be an array or two strings for before and after clicked. |
| `delete` | boolean | `false` | Apply deleted (strikethrough) style. |
| `disabled` | boolean | `false` | Apply disabled style. |
| `ellipsis` | boolean \| object | `false` | Display ellipsis when text overflows a single line. |
| `ellipsis.rows` | number | - | Max rows of content. |
| `ellipsis.expandable` | boolean | - | Expand hidden content when clicked. |
| `ellipsis.suffix` | string | - | Suffix of ellipses content. |
| `italic` | boolean | `false` | Apply italic style. |
| `level` | number | `1` | Set title type. Matches with h1, h2, h3 and h4. Enum: `1`, `2`, `3`, `4`, `5`. |
| `mark` | boolean | `false` | Apply marked (highlighted) style. |
| `type` | string | `"default"` | Additional types. Don't specify for default. Enum: `secondary`, `warning`, `danger`, `success`. |
| `underline` | boolean | `false` | Apply underline style. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design typography tokens](https://ant.design/components/typography#design-token). |
| `theme.titleMarginBottom` | string | `"0.5em"` | Margin bottom of title. |
| `theme.titleMarginTop` | string | `"1.2em"` | Margin top of title. |
| `theme.fontSizeHeading1` | number | `38` | Font size of h1 heading. |
| `theme.fontSizeHeading2` | number | `30` | Font size of h2 heading. |
| `theme.fontSizeHeading3` | number | `24` | Font size of h3 heading. |
| `theme.fontSizeHeading4` | number | `20` | Font size of h4 heading. |
| `theme.fontSizeHeading5` | number | `16` | Font size of h5 heading. |
| `theme.lineHeightHeading1` | number | `1.2105` | Line height of h1 heading. |
| `theme.lineHeightHeading2` | number | `1.2667` | Line height of h2 heading. |
| `theme.lineHeightHeading3` | number | `1.3333` | Line height of h3 heading. |
| `theme.lineHeightHeading4` | number | `1.4` | Line height of h4 heading. |
| `theme.lineHeightHeading5` | number | `1.5` | Line height of h5 heading. |
| `theme.fontWeightStrong` | number | `600` | Font weight for strong text. |
| `theme.fontFamilyCode` | string | - | Font family for code style text. |
| `theme.colorText` | string | - | Default text color. |
| `theme.colorTextSecondary` | string | - | Secondary text color. |
| `theme.colorSuccess` | string | - | Success text color. |
| `theme.colorWarning` | string | - | Warning text color. |
| `theme.colorError` | string | - | Danger/error text color. |
| `theme.colorTextDisabled` | string | - | Disabled text color. |
| `theme.colorLink` | string | - | Link color. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onExpand` | \- | Trigger action when ellipse expand is clicked. |
| `onCopy` | \- | Trigger action when copy text is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Title element. |
| `/copyableIcon` | The copyable icon in the Title. |

No slots defined.
