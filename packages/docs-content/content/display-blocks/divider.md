# Divider

Horizontal or vertical divider with optional text and orientation.

Home

Settings

Profile

```yaml
- id: type_horizontal
  type: Divider
- id: type_horizontal_titled
  type: Divider
  properties:
    title: Horizontal Divider
- id: type_vertical_row
  type: Box
  layout:
    gap: 0
  blocks:
    - id: type_vt_text_1
      type: Paragraph
      layout:
        flex: 0 0 auto
      properties:
        content: Home
    - id: type_vt_divider_1
      type: Divider
      layout:
        flex: 0 0 auto
      properties:
        orientation: vertical
    - id: type_vt_text_2
      type: Paragraph
      layout:
        flex: 0 0 auto
      properties:
        content: Settings
    - id: type_vt_divider_2
      type: Divider
      layout:
        flex: 0 0 auto
      properties:
        orientation: vertical
    - id: type_vt_text_3
      type: Paragraph
      layout:
        flex: 0 0 auto
      properties:
        content: Profile
```

```yaml
- id: title_plain_text
  type: Divider
  properties:
    title: Section Title
- id: title_html_bold
  type: Divider
  properties:
    title: <b>Bold Section Header</b>
- id: title_html_styled
  type: Divider
  properties:
    title: '<span style="color: #1677ff; font-size: 16px">Highlighted Title</span>'
```

```yaml
- id: orient_start
  type: Divider
  properties:
    title: Start
    titlePlacement: start
- id: orient_center
  type: Divider
  properties:
    title: Center (default)
    titlePlacement: center
- id: orient_end
  type: Divider
  properties:
    title: End
    titlePlacement: end
```

```yaml
- id: dashed_simple
  type: Divider
  properties:
    dashed: true
- id: dashed_with_title
  type: Divider
  properties:
    dashed: true
    title: Dashed with Title
- id: dashed_left_title
  type: Divider
  properties:
    dashed: true
    title: Dashed Start
    titlePlacement: start
```

```yaml
- id: plain_center
  type: Divider
  properties:
    title: Plain Center
    plain: true
- id: plain_left
  type: Divider
  properties:
    title: Plain Start
    plain: true
    titlePlacement: start
- id: plain_dashed
  type: Divider
  properties:
    title: Plain Dashed
    plain: true
    dashed: true
```

```yaml
- id: css_tailwind_margin
  type: Divider
  class: my-8
  properties:
    title: Extra Margin via Tailwind
- id: css_inline_color
  type: Divider
  style:
    .element:
      borderColor: "#1677ff"
- id: css_inline_thick
  type: Divider
  style:
    .element:
      borderWidth: 3px
- id: css_inline_title_color
  type: Divider
  properties:
    title: Styled Title
  style:
    .element:
      color: "#722ed1"
      borderColor: "#722ed1"
```

Item A

Item B

```yaml
- id: theme_text_padding
  type: Divider
  properties:
    title: Wide Text Padding
    theme:
      textPaddingInline: 3em
- id: theme_orientation_tight
  type: Divider
  properties:
    title: Tight Orientation Margin
    titlePlacement: start
    theme:
      orientationMargin: 0
- id: theme_orientation_wide
  type: Divider
  properties:
    title: Wide Orientation Margin
    titlePlacement: start
    theme:
      orientationMargin: 0.25
- id: theme_vertical_margin
  type: Box
  layout:
    gap: 0
  blocks:
    - id: theme_vm_text_1
      type: Paragraph
      layout:
        flex: 0 0 auto
      properties:
        content: Item A
    - id: theme_vm_divider
      type: Divider
      layout:
        flex: 0 0 auto
      properties:
        orientation: vertical
        theme:
          verticalMarginInline: 24
    - id: theme_vm_text_2
      type: Paragraph
      layout:
        flex: 0 0 auto
      properties:
        content: Item B
```

```yaml
- id: settings_card
  type: Card
  properties:
    title: Account Settings
    size: small
  blocks:
    - id: settings_profile_heading
      type: Divider
      properties:
        title: Profile
        titlePlacement: start
        plain: true
    - id: settings_name
      type: TextInput
      properties:
        label:
          title: Display Name
        placeholder: Enter your name
    - id: settings_email
      type: TextInput
      properties:
        label:
          title: Email Address
        placeholder: you@company.com
    - id: settings_notifications_heading
      type: Divider
      properties:
        title: Notifications
        titlePlacement: start
        plain: true
    - id: settings_notify_toggle
      type: Switch
      properties:
        label:
          title: Email Notifications
    - id: settings_danger_heading
      type: Divider
      properties:
        title: '<span style="color: #ff4d4f">Danger Zone</span>'
        titlePlacement: start
        plain: true
        dashed: true
      style:
        .element:
          borderColor: "#ff4d4f"
    - id: settings_delete_row
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: settings_delete_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Delete Account
            color: danger
            variant: outlined
            icon: AiOutlineDelete
          events:
            onClick:
              - id: settings_delete_msg
                type: DisplayMessage
                params:
                  content: Account deletion requested.
                  status: warning
```

## Building Config-Driven Applications
A practical guide to rapid development with declarative frameworks.

By Jane Smith

March 2026

5 min read

Config-driven frameworks allow teams to ship features faster by reducing boilerplate.
Instead of writing repetitive UI code, developers describe what they want in YAML or JSON.

- Declarative configs reduce development time by up to 60%
- Schema validation catches errors before deployment
- Teams can onboard new developers faster with standardized patterns

```yaml
- id: article_card
  type: Card
  blocks:
    - id: article_title
      type: Markdown
      properties:
        content: |
          ## Building Config-Driven Applications
          A practical guide to rapid development with declarative frameworks.
    - id: article_meta_row
      type: Box
      layout:
        gap: 0
      blocks:
        - id: article_author
          type: Paragraph
          layout:
            flex: 0 0 auto
          properties:
            content: By Jane Smith
        - id: article_meta_divider_1
          type: Divider
          layout:
            flex: 0 0 auto
          properties:
            orientation: vertical
        - id: article_date
          type: Paragraph
          layout:
            flex: 0 0 auto
          properties:
            content: March 2026
        - id: article_meta_divider_2
          type: Divider
          layout:
            flex: 0 0 auto
          properties:
            orientation: vertical
        - id: article_reading_time
          type: Paragraph
          layout:
            flex: 0 0 auto
          properties:
            content: 5 min read
    - id: article_intro_divider
      type: Divider
    - id: article_body
      type: Markdown
      properties:
        content: >
          Config-driven frameworks allow teams to ship features faster by
          reducing boilerplate.

          Instead of writing repetitive UI code, developers describe what they
          want in YAML or JSON.
    - id: article_section_divider
      type: Divider
      properties:
        title: Key Takeaways
        titlePlacement: start
        plain: true
    - id: article_takeaways
      type: Markdown
      properties:
        content: |
          - Declarative configs reduce development time by up to 60%
          - Schema validation catches errors before deployment
          - Teams can onboard new developers faster with standardized patterns
    - id: article_footer_divider
      type: Divider
      properties:
        dashed: true
    - id: article_footer_row
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: article_share_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Share Article
            color: primary
            variant: outlined
            icon: AiOutlineShareAlt
          events:
            onClick:
              - id: article_share_msg
                type: DisplayMessage
                params:
                  content: Link copied to clipboard!
                  status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `dashed` | boolean | `false` | Whether line is dashed. |
| `orientation` | string | `"horizontal"` | Direction of the divider line. Enum: `horizontal`, `vertical`. |
| `title` | string | - | Divider title - supports html. |
| `titlePlacement` | string | `"center"` | Position of title text within the divider. Enum: `start`, `end`, `center`. |
| `plain` | boolean | `false` | Show text as plain style. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design divider tokens](https://ant.design/components/divider#design-token). |
| `theme.textPaddingInline` | string | `"1em"` | Horizontal padding of text content in the divider. |
| `theme.orientationMargin` | number | `0.05` | Distance between text and edge when orientation is left or right. Value between 0 and 1 representing a percentage. |
| `theme.verticalMarginInline` | number | `8` | Horizontal margin for vertical dividers. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Divider element. |

No slots defined.
