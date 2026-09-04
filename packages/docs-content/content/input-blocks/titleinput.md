# TitleInput

Editable title heading with levels, copyable, and text styles.

```yaml
- id: heading_level_1
  type: TitleInput
  properties:
    level: 1
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          heading_level_1: h1. Editable Heading Level 1
- id: heading_level_2
  type: TitleInput
  properties:
    level: 2
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          heading_level_2: h2. Editable Heading Level 2
- id: heading_level_3
  type: TitleInput
  properties:
    level: 3
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          heading_level_3: h3. Editable Heading Level 3
- id: heading_level_4
  type: TitleInput
  properties:
    level: 4
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          heading_level_4: h4. Editable Heading Level 4
- id: heading_level_5
  type: TitleInput
  properties:
    level: 5
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          heading_level_5: h5. Editable Heading Level 5
```

```yaml
heading_level_1:
  _state: heading_level_1
heading_level_2:
  _state: heading_level_2
heading_level_3:
  _state: heading_level_3
heading_level_4:
  _state: heading_level_4
heading_level_5:
  _state: heading_level_5
```

```yaml
- id: type_default
  type: TitleInput
  properties:
    level: 3
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          type_default: Default Type Title
- id: type_secondary
  type: TitleInput
  properties:
    level: 3
    type: secondary
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          type_secondary: Secondary Type Title
- id: type_success
  type: TitleInput
  properties:
    level: 3
    type: success
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          type_success: Success Type Title
- id: type_warning
  type: TitleInput
  properties:
    level: 3
    type: warning
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          type_warning: Warning Type Title
- id: type_danger
  type: TitleInput
  properties:
    level: 3
    type: danger
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          type_danger: Danger Type Title
```

```yaml
type_default:
  _state: type_default
type_secondary:
  _state: type_secondary
type_success:
  _state: type_success
type_warning:
  _state: type_warning
type_danger:
  _state: type_danger
```

```yaml
- id: style_italic
  type: TitleInput
  properties:
    level: 3
    italic: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_italic: Italic Title
- id: style_underline
  type: TitleInput
  properties:
    level: 3
    underline: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_underline: Underlined Title
- id: style_delete
  type: TitleInput
  properties:
    level: 3
    delete: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_delete: Strikethrough Title
- id: style_mark
  type: TitleInput
  properties:
    level: 3
    mark: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_mark: Marked (Highlighted) Title
- id: style_code
  type: TitleInput
  properties:
    level: 3
    code: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_code: Code Style Title
```

```yaml
style_italic:
  _state: style_italic
style_underline:
  _state: style_underline
style_delete:
  _state: style_delete
style_mark:
  _state: style_mark
style_code:
  _state: style_code
```

```yaml
- id: combined_italic_underline
  type: TitleInput
  properties:
    level: 3
    italic: true
    underline: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_italic_underline: Italic and Underlined
- id: combined_mark_code
  type: TitleInput
  properties:
    level: 3
    mark: true
    code: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_mark_code: Marked and Code
- id: combined_italic_delete
  type: TitleInput
  properties:
    level: 3
    italic: true
    delete: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_italic_delete: Italic and Strikethrough
- id: combined_underline_mark
  type: TitleInput
  properties:
    level: 3
    underline: true
    mark: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_underline_mark: Underlined and Marked
- id: combined_all_styles
  type: TitleInput
  properties:
    level: 3
    italic: true
    underline: true
    mark: true
    code: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_all_styles: All Styles Applied
```

```yaml
combined_italic_underline:
  _state: combined_italic_underline
combined_mark_code:
  _state: combined_mark_code
combined_italic_delete:
  _state: combined_italic_delete
combined_underline_mark:
  _state: combined_underline_mark
combined_all_styles:
  _state: combined_all_styles
```

```yaml
- id: color_blue
  type: TitleInput
  properties:
    level: 3
    color: "#1677ff"
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          color_blue: Blue Title
- id: color_green
  type: TitleInput
  properties:
    level: 3
    color: "#52c41a"
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          color_green: Green Title
- id: color_purple
  type: TitleInput
  properties:
    level: 3
    color: "#722ed1"
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          color_purple: Purple Title
- id: color_coral
  type: TitleInput
  properties:
    level: 3
    color: "#ff6b6b"
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          color_coral: Coral Title
- id: color_teal
  type: TitleInput
  properties:
    level: 3
    color: "#13c2c2"
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          color_teal: Teal Title
```

```yaml
color_blue:
  _state: color_blue
color_green:
  _state: color_green
color_purple:
  _state: color_purple
color_coral:
  _state: color_coral
color_teal:
  _state: color_teal
```

```yaml
- id: copyable_boolean
  type: TitleInput
  properties:
    level: 3
    copyable: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          copyable_boolean: Click the copy icon to copy this title
- id: copyable_custom_text
  type: TitleInput
  properties:
    level: 3
    copyable:
      text: This custom text is copied instead of the visible title.
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          copyable_custom_text: Title with custom copy text
- id: copyable_custom_tooltips
  type: TitleInput
  properties:
    level: 3
    copyable:
      tooltips:
        - Click to copy
        - Copied!
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          copyable_custom_tooltips: Hover the copy icon for custom tooltips
- id: copyable_custom_text_and_tooltips
  type: TitleInput
  properties:
    level: 3
    copyable:
      text: Custom copied content for this title.
      tooltips:
        - Copy custom text
        - Text copied successfully!
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          copyable_custom_text_and_tooltips: Custom text and tooltips together
```

```yaml
copyable_boolean:
  _state: copyable_boolean
copyable_custom_text:
  _state: copyable_custom_text
copyable_custom_tooltips:
  _state: copyable_custom_tooltips
copyable_custom_text_and_tooltips:
  _state: copyable_custom_text_and_tooltips
```

```yaml
- id: editable_boolean_true
  type: TitleInput
  properties:
    level: 3
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          editable_boolean_true: Editable with boolean true
- id: editable_boolean_false
  type: TitleInput
  properties:
    level: 3
    editable: false
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          editable_boolean_false: Not editable (editable false)
- id: editable_custom_tooltip
  type: TitleInput
  properties:
    level: 3
    editable:
      tooltip: Click here to edit this title
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          editable_custom_tooltip: Click the pencil to edit
- id: editable_max_length
  type: TitleInput
  properties:
    level: 3
    editable:
      maxLength: 50
      tooltip: Limited to 50 characters
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          editable_max_length: Max 50 characters allowed
- id: editable_editing_state
  type: TitleInput
  properties:
    level: 3
    editable:
      editing: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          editable_editing_state: Starts in editing mode
```

```yaml
editable_boolean_true:
  _state: editable_boolean_true
editable_boolean_false:
  _state: editable_boolean_false
editable_custom_tooltip:
  _state: editable_custom_tooltip
editable_max_length:
  _state: editable_max_length
editable_editing_state:
  _state: editable_editing_state
```

```yaml
- id: ellipsis_boolean
  type: TitleInput
  properties:
    level: 3
    ellipsis: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          ellipsis_boolean: This is a very long editable title that should be truncated
            with an ellipsis when it overflows the available space in a single
            line of text content.
- id: ellipsis_two_rows
  type: TitleInput
  properties:
    level: 4
    ellipsis:
      rows: 2
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          ellipsis_two_rows: This is an extremely long title text that demonstrates
            multi-row ellipsis truncation. When the content exceeds the
            specified number of rows it will be truncated and show an ellipsis
            indicator at the end of the visible text area.
- id: ellipsis_three_rows_expandable
  type: TitleInput
  properties:
    level: 4
    ellipsis:
      rows: 3
      expandable: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          ellipsis_three_rows_expandable: This is a very long title that will be truncated
            after three rows. It demonstrates the expandable ellipsis feature
            which allows users to click to expand and see the full content of
            the title. This is useful for long headings that need to be visible
            on demand without taking up too much vertical space in the layout.
- id: ellipsis_with_suffix
  type: TitleInput
  properties:
    level: 4
    ellipsis:
      rows: 1
      suffix: " [more]"
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          ellipsis_with_suffix: This long title demonstrates the suffix feature of the
            ellipsis configuration where a custom suffix string appears at the
            truncation point instead of the default behavior.
- id: ellipsis_expandable_with_suffix
  type: TitleInput
  properties:
    level: 4
    ellipsis:
      rows: 2
      expandable: true
      suffix: " ...(click to expand)"
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          ellipsis_expandable_with_suffix: This title combines expandable and suffix
            options. Click to expand and see the full content. The suffix text
            appears at the end of the truncated text to provide a visual cue to
            the user.
```

```yaml
ellipsis_boolean:
  _state: ellipsis_boolean
ellipsis_two_rows:
  _state: ellipsis_two_rows
ellipsis_three_rows_expandable:
  _state: ellipsis_three_rows_expandable
ellipsis_with_suffix:
  _state: ellipsis_with_suffix
ellipsis_expandable_with_suffix:
  _state: ellipsis_expandable_with_suffix
```

```yaml
- id: disabled_level_1
  type: TitleInput
  properties:
    level: 1
    disabled: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_level_1: Disabled Level 1 Title
- id: disabled_level_3
  type: TitleInput
  properties:
    level: 3
    disabled: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_level_3: Disabled Level 3 Title
- id: disabled_with_styles
  type: TitleInput
  properties:
    level: 3
    disabled: true
    italic: true
    underline: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_with_styles: Disabled with Italic and Underline
- id: disabled_secondary
  type: TitleInput
  properties:
    level: 3
    disabled: true
    type: secondary
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          disabled_secondary: Disabled Secondary Type
```

```yaml
disabled_level_1:
  _state: disabled_level_1
disabled_level_3:
  _state: disabled_level_3
disabled_with_styles:
  _state: disabled_with_styles
disabled_secondary:
  _state: disabled_secondary
```

```yaml
- id: default_value_simple
  type: TitleInput
  properties:
    level: 3
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          default_value_simple: This is the default value
- id: default_value_long
  type: TitleInput
  properties:
    level: 4
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          default_value_long: A longer default value that demonstrates how TitleInput
            handles pre-populated content for editing
- id: default_value_with_type
  type: TitleInput
  properties:
    level: 3
    type: success
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          default_value_with_type: Default value with success type
- id: default_value_with_styles
  type: TitleInput
  properties:
    level: 3
    italic: true
    mark: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          default_value_with_styles: Default value with italic and mark
- id: no_default_value
  type: TitleInput
  properties:
    level: 3
    editable: true
```

```yaml
default_value_simple:
  _state: default_value_simple
default_value_long:
  _state: default_value_long
default_value_with_type:
  _state: default_value_with_type
default_value_with_styles:
  _state: default_value_with_styles
no_default_value:
  _state: no_default_value
```

```yaml
- id: level_1_secondary
  type: TitleInput
  properties:
    level: 1
    type: secondary
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          level_1_secondary: Level 1 Secondary
- id: level_2_success
  type: TitleInput
  properties:
    level: 2
    type: success
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          level_2_success: Level 2 Success
- id: level_3_warning
  type: TitleInput
  properties:
    level: 3
    type: warning
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          level_3_warning: Level 3 Warning
- id: level_4_danger
  type: TitleInput
  properties:
    level: 4
    type: danger
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          level_4_danger: Level 4 Danger
- id: level_5_success
  type: TitleInput
  properties:
    level: 5
    type: success
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          level_5_success: Level 5 Success
```

```yaml
level_1_secondary:
  _state: level_1_secondary
level_2_success:
  _state: level_2_success
level_3_warning:
  _state: level_3_warning
level_4_danger:
  _state: level_4_danger
level_5_success:
  _state: level_5_success
```

```yaml
- id: theme_color_text
  type: TitleInput
  properties:
    level: 3
    editable: true
    theme:
      colorText: "#531dab"
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          theme_color_text: Custom Text Color
- id: theme_font_family
  type: TitleInput
  properties:
    level: 3
    editable: true
    theme:
      fontFamily: Georgia, serif
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          theme_font_family: Custom Font Family
- id: theme_font_weight_strong
  type: TitleInput
  properties:
    level: 3
    editable: true
    theme:
      fontWeightStrong: 900
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          theme_font_weight_strong: Custom Font Weight
- id: theme_font_size_heading3
  type: TitleInput
  properties:
    level: 3
    editable: true
    theme:
      fontSizeHeading3: 32
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          theme_font_size_heading3: Large Font Size for h3
- id: theme_multiple_tokens
  type: TitleInput
  properties:
    level: 3
    editable: true
    theme:
      colorText: "#1d39c4"
      fontFamily: Courier New, monospace
      fontWeightStrong: 700
      fontSizeHeading3: 28
      lineHeightHeading3: 1.6
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          theme_multiple_tokens: Multiple Token Overrides
```

```yaml
theme_color_text:
  _state: theme_color_text
theme_font_family:
  _state: theme_font_family
theme_font_weight_strong:
  _state: theme_font_weight_strong
theme_font_size_heading3:
  _state: theme_font_size_heading3
theme_multiple_tokens:
  _state: theme_multiple_tokens
```

```yaml
- id: combined_copyable_editable
  type: TitleInput
  properties:
    level: 3
    copyable: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_copyable_editable: Copyable and Editable Title
- id: combined_type_styles_copyable
  type: TitleInput
  properties:
    level: 3
    type: success
    italic: true
    copyable: true
    editable: true
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_type_styles_copyable: Success Type with Italic and Copyable
- id: combined_color_styles_editable
  type: TitleInput
  properties:
    level: 3
    color: "#722ed1"
    code: true
    editable:
      tooltip: Edit this purple code title
      maxLength: 100
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_color_styles_editable: Custom Color with Code Style
- id: combined_ellipsis_copyable_editable
  type: TitleInput
  properties:
    level: 4
    ellipsis:
      rows: 2
      expandable: true
    copyable:
      tooltips:
        - Copy this long title
        - Copied!
    editable:
      tooltip: Edit this long title
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_ellipsis_copyable_editable: This is a very long title that combines
            ellipsis truncation with both copyable and editable features to
            demonstrate how multiple features work together in a single
            component.
- id: combined_full_featured
  type: TitleInput
  properties:
    level: 3
    type: success
    italic: true
    copyable:
      text: Full-featured title content
      tooltips:
        - Copy title
        - Title copied!
    editable:
      tooltip: Click to edit
      maxLength: 120
    theme:
      fontWeightStrong: 700
      fontSizeHeading3: 26
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          combined_full_featured: Full-Featured Title Input
```

```yaml
combined_copyable_editable:
  _state: combined_copyable_editable
combined_type_styles_copyable:
  _state: combined_type_styles_copyable
combined_color_styles_editable:
  _state: combined_color_styles_editable
combined_ellipsis_copyable_editable:
  _state: combined_ellipsis_copyable_editable
combined_full_featured:
  _state: combined_full_featured
```

```yaml
- id: style_override_inline
  type: TitleInput
  properties:
    level: 3
    editable: true
  style:
    background: linear-gradient(90deg,
    padding: 8px 16px
    borderLeft: 4px solid
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_override_inline: Inline Styled Title
- id: style_override_tailwind
  type: TitleInput
  properties:
    level: 3
    editable: true
  style:
    className: rounded-lg bg-bg-layout p-3 shadow-sm
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_override_tailwind: Tailwind Styled Title
- id: style_override_combined
  type: TitleInput
  properties:
    level: 2
    type: success
    editable: true
  style:
    border: 1px dashed
    borderRadius: 8px
    padding: 12px 20px
    className: shadow-md
  events:
    onMount:
      - id: set_default
        type: SetState
        params:
          style_override_combined: Combined Inline and Tailwind Styles
```

```yaml
style_override_inline:
  _state: style_override_inline
style_override_tailwind:
  _state: style_override_tailwind
style_override_combined:
  _state: style_override_combined
```

```yaml
- id: applied2_doc_editor_card
  type: Card
  properties:
    title: Document Editor
  blocks:
    - id: applied2_doc_title
      type: TitleInput
      properties:
        level: 2
        editable:
          tooltip: Click to rename this document
          maxLength: 80
        copyable: true
      events:
        onMount:
          - id: set_doc_title_default
            type: SetState
            params:
              applied2_doc_title: Untitled Document
    - id: applied2_doc_status
      type: Selector
      properties:
        title: Status
        placeholder: Select document status...
        options:
          - label: Draft
            value: draft
          - label: In Review
            value: review
          - label: Approved
            value: approved
          - label: Published
            value: published
    - id: applied2_doc_category
      type: Selector
      properties:
        title: Category
        placeholder: Select category...
        options:
          - label: Technical Specification
            value: tech_spec
          - label: User Guide
            value: user_guide
          - label: Release Notes
            value: release_notes
          - label: Internal Memo
            value: memo
    - id: applied2_doc_save_btn
      type: Button
      properties:
        title: Save Document
        icon: AiOutlineSave
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: save_doc_action
            type: DisplayMessage
            params:
              content: Document saved successfully.
              duration: 3
```

```yaml
applied2_doc_editor_card:
  _state: applied2_doc_editor_card
```

```yaml
- id: applied3_blog_editor_card
  type: Card
  properties:
    title: Blog Post Editor
  blocks:
    - id: applied3_post_title
      type: TitleInput
      properties:
        level: 1
        editable:
          tooltip: Enter your blog post title
          maxLength: 120
        copyable: true
      events:
        onMount:
          - id: set_post_title_default
            type: SetState
            params:
              applied3_post_title: Untitled Blog Post
    - id: applied3_post_content
      type: TextArea
      properties:
        title: Content
        placeholder: Write your blog post content here...
        autoSize:
          minRows: 6
          maxRows: 16
    - id: applied3_post_category
      type: Selector
      properties:
        title: Category
        placeholder: Select a category...
        options:
          - label: Technology
            value: technology
          - label: Design
            value: design
          - label: Business
            value: business
          - label: Lifestyle
            value: lifestyle
    - id: applied3_publish_btn
      type: Button
      properties:
        title: Publish Post
        icon: AiOutlineSend
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: publish_post_action
            type: DisplayMessage
            params:
              content: Blog post published successfully.
              duration: 3
```

```yaml
applied3_blog_editor_card:
  _state: applied3_blog_editor_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | boolean | `false` | Apply code style. |
| `color` | string | - | Title color. |
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
| `editable` | boolean \| object | `true` | Allow paragraph editing when true, editable settings can be provided with editable object. |
| `editable.icon` | string \| object | - | Edit icon. |
| `editable.tooltip` | string | - | Edit tooltip text. |
| `editable.editing` | boolean | `false` | Control editing state. |
| `editable.maxLength` | number | - | Max length of text area input. |
| `italic` | boolean | `false` | Apply italic style. |
| `level` | number | `1` | Set title type. Matches with h1, h2, h3 and h4. Enum: `1`, `2`, `3`, `4`, `5`. |
| `mark` | boolean | `false` | Apply marked (highlighted) style. |
| `type` | string | `"default"` | Additional types. Don't specify for default. Enum: `default`, `secondary`, `warning`, `danger`, `success`. |
| `underline` | boolean | `false` | Apply underline style. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design typography tokens](https://ant.design/components/typography#design-token). |
| `theme.titleMarginBottom` | string | `"0.5em"` | Margin bottom for title elements. |
| `theme.titleMarginTop` | string | `"1.2em"` | Margin top for title elements. |
| `theme.colorText` | string | - | Default text color. |
| `theme.colorTextSecondary` | string | - | Text color for secondary type. |
| `theme.colorSuccess` | string | - | Text color for success type. |
| `theme.colorWarning` | string | - | Text color for warning type. |
| `theme.colorError` | string | - | Text color for danger type. |
| `theme.colorLink` | string | - | Color for links within typography. |
| `theme.colorLinkHover` | string | - | Color for links on hover. |
| `theme.colorLinkActive` | string | - | Color for links when active. |
| `theme.colorTextDescription` | string | - | Color for description text. |
| `theme.colorTextDisabled` | string | - | Color for disabled text. |
| `theme.fontFamily` | string | - | Font family for typography text. |
| `theme.fontSize` | number | `14` | Base font size. |
| `theme.fontSizeHeading1` | number | `38` | Font size for h1 level. |
| `theme.fontSizeHeading2` | number | `30` | Font size for h2 level. |
| `theme.fontSizeHeading3` | number | `24` | Font size for h3 level. |
| `theme.fontSizeHeading4` | number | `20` | Font size for h4 level. |
| `theme.fontSizeHeading5` | number | `16` | Font size for h5 level. |
| `theme.fontWeightStrong` | number | `600` | Font weight for strong/bold text. |
| `theme.lineHeight` | number | `1.5714` | Base line height. |
| `theme.lineHeightHeading1` | number | `1.2105` | Line height for h1. |
| `theme.lineHeightHeading2` | number | `1.2667` | Line height for h2. |
| `theme.lineHeightHeading3` | number | `1.3333` | Line height for h3. |
| `theme.lineHeightHeading4` | number | `1.4` | Line height for h4. |
| `theme.lineHeightHeading5` | number | `1.5` | Line height for h5. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onExpand` | `{ ellipsis: boolean }` | Trigger action when ellipse expand is clicked. |
| `onCopy` | `{ value: string }` | Trigger action when copy text is clicked. |
| `onChange` | `{ value: string }` | Trigger action when title is changed. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The TitleInput element. |
| `/copyableIcon` | The copyable icon in the TitleInput. |
| `/editableIcon` | The editable icon in the TitleInput. |

No slots defined.
