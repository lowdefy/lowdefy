# Watermark

Watermark overlay with text, image, and font customization.

```yaml
- id: basic_single
  type: Watermark
  properties:
    text: Lowdefy
  blocks:
    - id: basic_single_child
      type: Box
      style:
        height: 200px
- id: basic_multiline
  type: Watermark
  properties:
    text:
      - Lowdefy
      - Confidential
  blocks:
    - id: basic_multiline_child
      type: Box
      style:
        height: 220px
```

```yaml
- id: img_logo
  type: Watermark
  properties:
    image: https://lowdefy.com/favicon-32x32.png
    width: 80
    height: 80
  blocks:
    - id: img_logo_child
      type: Box
      style:
        height: 240px
- id: img_small
  type: Watermark
  properties:
    image: https://lowdefy.com/favicon-32x32.png
    width: 40
    height: 40
  blocks:
    - id: img_small_child
      type: Box
      style:
        height: 200px
```

```yaml
- id: font_red
  type: Watermark
  properties:
    text: Rejected
    font:
      color: rgba(255, 0, 0, 0.15)
  blocks:
    - id: font_red_child
      type: Box
      style:
        height: 180px
- id: font_large_bold
  type: Watermark
  properties:
    text: DRAFT
    font:
      fontSize: 28
      fontWeight: bold
      color: rgba(255, 0, 0, 0.08)
  blocks:
    - id: font_large_bold_child
      type: Box
      style:
        height: 220px
- id: font_serif_italic
  type: Watermark
  properties:
    text: Elegant
    font:
      fontFamily: Georgia, serif
      fontStyle: italic
      fontSize: 20
      color: rgba(139, 92, 246, 0.1)
  blocks:
    - id: font_serif_italic_child
      type: Box
      style:
        height: 200px
```

```yaml
- id: align_left
  type: Watermark
  properties:
    text:
      - Left Aligned
      - Second Line
    font:
      textAlign: left
      color: rgba(0, 0, 0, 0.1)
  blocks:
    - id: align_left_child
      type: Box
      style:
        height: 200px
- id: align_center
  type: Watermark
  properties:
    text:
      - Center Aligned
      - Second Line
    font:
      textAlign: center
      color: rgba(0, 0, 0, 0.1)
  blocks:
    - id: align_center_child
      type: Box
      style:
        height: 200px
- id: align_right
  type: Watermark
  properties:
    text:
      - Right Aligned
      - Second Line
    font:
      textAlign: right
      color: rgba(0, 0, 0, 0.1)
  blocks:
    - id: align_right_child
      type: Box
      style:
        height: 200px
```

```yaml
- id: rotate_default
  type: Watermark
  properties:
    text: Default (-22 degrees)
  blocks:
    - id: rotate_default_child
      type: Box
      style:
        height: 180px
- id: rotate_horizontal
  type: Watermark
  properties:
    text: Horizontal (0 degrees)
    rotate: 0
  blocks:
    - id: rotate_horizontal_child
      type: Box
      style:
        height: 180px
- id: rotate_steep
  type: Watermark
  properties:
    text: Steep (-45 degrees)
    rotate: -45
  blocks:
    - id: rotate_steep_child
      type: Box
      style:
        height: 200px
```

```yaml
- id: gap_tight
  type: Watermark
  properties:
    text: Tight Gap
    gap:
      - 50
      - 50
  blocks:
    - id: gap_tight_child
      type: Box
      style:
        height: 200px
- id: gap_wide
  type: Watermark
  properties:
    text: Wide Gap
    gap:
      - 200
      - 200
  blocks:
    - id: gap_wide_child
      type: Box
      style:
        height: 200px
- id: offset_shifted
  type: Watermark
  properties:
    text: Offset (50, 40)
    offset:
      - 50
      - 40
  blocks:
    - id: offset_shifted_child
      type: Box
      style:
        height: 200px
```

```yaml
- id: zindex_high
  type: Watermark
  properties:
    text: High zIndex (100)
    zIndex: 100
  blocks:
    - id: zindex_high_child
      type: Box
      style:
        height: 180px
- id: inherit_false
  type: Watermark
  properties:
    text: Inherit disabled
    inherit: false
  blocks:
    - id: inherit_false_child
      type: Box
      style:
        height: 180px
```

```yaml
- id: theme_color_fill
  type: Watermark
  properties:
    text: Custom Fill Color
    theme:
      colorFill: rgba(22, 119, 255, 0.12)
  blocks:
    - id: theme_color_fill_child
      type: Box
      style:
        height: 200px
- id: theme_font_size
  type: Watermark
  properties:
    text: Large Default Font
    theme:
      fontSizeLG: 24
  blocks:
    - id: theme_font_size_child
      type: Box
      style:
        height: 200px
- id: theme_font_family
  type: Watermark
  properties:
    text: Serif Theme Font
    theme:
      fontFamily: Georgia, serif
  blocks:
    - id: theme_font_family_child
      type: Box
      style:
        height: 200px
```

The element CSS key applies Tailwind classes to the Watermark wrapper. Here a gradient background and rounded corners create a styled preview area.

Dark Background

White watermark text with low opacity stays subtle on a dark surface. Useful for dark-mode interfaces and embedded viewers.

Drag and drop files here or click to browse

```yaml
- id: css_gradient_bg
  type: Watermark
  class:
    element: bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4
  properties:
    text: Preview
    font:
      color: rgba(79, 70, 229, 0.1)
      fontSize: 18
  blocks:
    - id: css_gradient_bg_content
      type: Paragraph
      properties:
        content: >
          The element CSS key applies Tailwind classes to the Watermark wrapper.
          Here a gradient background and rounded corners create a styled preview
          area.
- id: css_dark_surface
  type: Watermark
  class:
    element: bg-bg-layout rounded-lg p-4
  properties:
    text: Dark Theme
    font:
      color: rgba(255, 255, 255, 0.08)
      fontSize: 16
  blocks:
    - id: css_dark_surface_title
      type: Title
      style:
        color: white
      properties:
        content: Dark Background
        level: 5
    - id: css_dark_surface_content
      type: Paragraph
      style:
        color: rgba(255, 255, 255, 0.7)
      properties:
        content: >
          White watermark text with low opacity stays subtle on a dark surface.
          Useful for dark-mode interfaces and embedded viewers.
- id: css_bordered_area
  type: Watermark
  class:
    element: border-2 border-dashed border-border rounded-xl p-6
  properties:
    text: Upload Area
    font:
      color: rgba(0, 0, 0, 0.06)
      fontSize: 20
    rotate: 0
    gap:
      - 120
      - 80
  blocks:
    - id: css_bordered_area_text
      type: Paragraph
      style:
        textAlign: center
        color: "#999"
      properties:
        content: Drag and drop files here or click to browse
```

Quarterly Financial Report

Prepared for the Board of Directors — Q1 2026

Revenue for the first quarter reached $12.4M, representing a 15% increase year-over-year. Operating margins improved to 23% driven by efficiency gains across all business units.

Customer acquisition costs decreased by 8% while customer lifetime value increased by 12%, indicating strong unit economics. The sales pipeline remains robust with $45M in qualified opportunities.

```yaml
- id: report_wrapper
  type: Box
  class: bg-bg-container rounded-lg shadow-sm
  blocks:
    - id: report_watermark
      type: Watermark
      properties:
        text: DRAFT
        font:
          fontSize: 28
          fontWeight: bold
          color: rgba(255, 0, 0, 0.06)
        gap:
          - 150
          - 150
        rotate: -30
      blocks:
        - id: report_heading
          type: Title
          properties:
            content: Quarterly Financial Report
            level: 4
        - id: report_subtitle
          type: Paragraph
          properties:
            content: Prepared for the Board of Directors — Q1 2026
        - id: report_divider
          type: Divider
        - id: report_body_1
          type: Paragraph
          properties:
            content: >
              Revenue for the first quarter reached $12.4M, representing a 15%
              increase year-over-year. Operating margins improved to 23% driven
              by efficiency gains across all business units.
        - id: report_body_2
          type: Paragraph
          properties:
            content: >
              Customer acquisition costs decreased by 8% while customer lifetime
              value increased by 12%, indicating strong unit economics. The
              sales pipeline remains robust with $45M in qualified
              opportunities.
```

Project Overview

A web application for managing team workflows and project timelines. Currently in active development with scheduled release next quarter.

Mobile app for real-time inventory tracking across multiple warehouses. Integrates with existing ERP systems for seamless data sync.

```yaml
- id: dashboard_watermark
  type: Watermark
  properties:
    text:
      - CONFIDENTIAL
      - Do Not Copy
    font:
      fontSize: 18
      color: rgba(22, 119, 255, 0.06)
      fontWeight: bold
    gap:
      - 120
      - 120
  blocks:
    - id: dashboard_title
      type: Title
      properties:
        content: Project Overview
        level: 4
    - id: dashboard_cards
      type: Box
      layout:
        gap: 16
      blocks:
        - id: dashboard_card_alpha
          type: Card
          layout:
            flex: 1 1 0
          properties:
            title: Project Alpha
          slots:
            extra:
              blocks:
                - id: dashboard_alpha_tag
                  type: Tag
                  layout:
                    flex: 0 0 auto
                  properties:
                    title: Active
                    color: success
          blocks:
            - id: dashboard_alpha_desc
              type: Paragraph
              properties:
                content: A web application for managing team workflows and project timelines.
                  Currently in active development with scheduled release next
                  quarter.
            - id: dashboard_alpha_progress
              type: Progress
              properties:
                percent: 68
        - id: dashboard_card_beta
          type: Card
          layout:
            flex: 1 1 0
          properties:
            title: Project Beta
          slots:
            extra:
              blocks:
                - id: dashboard_beta_tag
                  type: Tag
                  layout:
                    flex: 0 0 auto
                  properties:
                    title: Planning
                    color: warning
          blocks:
            - id: dashboard_beta_desc
              type: Paragraph
              properties:
                content: Mobile app for real-time inventory tracking across multiple warehouses.
                  Integrates with existing ERP systems for seamless data sync.
            - id: dashboard_beta_progress
              type: Progress
              properties:
                percent: 25
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `font` | object | - | Font style configuration with color, fontSize, fontWeight, fontFamily, fontStyle, textAlign. |
| `font.color` | string | - | Font color of the watermark. |
| `font.fontFamily` | string | - | Font family of the watermark. |
| `font.fontSize` | number | - | Font size of the watermark. |
| `font.fontStyle` | string | - | Font style of the watermark. |
| `font.fontWeight` | string \| number | - | Font weight of the watermark. |
| `font.textAlign` | string | - | Text alignment of the watermark. Enum: `start`, `end`, `left`, `right`, `center`. |
| `gap` | array | - | Gap between watermarks as [horizontal, vertical]. |
| `height` | number | - | Height of the watermark. |
| `image` | string | - | Image URL to use as watermark. If set, text content is ignored. |
| `inherit` | boolean | `true` | Inherit watermark config from parent Watermark block. |
| `offset` | array | - | Offset of the watermark from the top-left as [x, y]. |
| `rotate` | number | `-22` | Rotation angle of watermark in degrees. |
| `text` | string \| array | - | Watermark text content. Maps to antd "content" prop. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design watermark tokens](https://ant.design/components/watermark#design-token). |
| `theme.colorFill` | string | - | Default watermark text color when font.color is not set. Maps to the global colorFill token. |
| `theme.fontSizeLG` | number | `16` | Default watermark font size when font.fontSize is not set. Maps to the global fontSizeLG token. |
| `theme.fontFamily` | string | `"sans-serif"` | Default font family used when font.fontFamily is not set. |
| `width` | number | - | Width of the watermark. |
| `zIndex` | integer | - | Z-index of the watermark. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Watermark element. |

| Slot | Description |
| --- | --- |
| `content` | Child blocks with a watermark overlay. |
