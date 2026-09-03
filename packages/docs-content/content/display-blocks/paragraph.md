# Paragraph

Text paragraph with copyable, ellipsis, and text style options.

Lowdefy is a config-driven web framework. Build internal tools, client portals, and web apps with YAML or JSON.

This paragraph supports <b>bold</b>, <i>italic</i>, and <a href="https://lowdefy.com">links</a> via HTML.

A longer paragraph showing how body text renders at its default size. Lowdefy makes it easy to build internal tools, client portals, and web applications using YAML or JSON configuration files. No need to learn complex frontend frameworks or manage build tooling.

```yaml
- id: basic_plain
  type: Paragraph
  properties:
    content: Lowdefy is a config-driven web framework. Build internal tools, client
      portals, and web apps with YAML or JSON.
- id: basic_html
  type: Paragraph
  properties:
    content: This paragraph supports <b>bold</b>, <i>italic</i>, and <a
      href="https://lowdefy.com">links</a> via HTML.
- id: basic_long
  type: Paragraph
  properties:
    content: A longer paragraph showing how body text renders at its default size.
      Lowdefy makes it easy to build internal tools, client portals, and web
      applications using YAML or JSON configuration files. No need to learn
      complex frontend frameworks or manage build tooling.
```

Default paragraph text with the standard color.

Secondary paragraph text with a muted appearance.

Success paragraph indicating a positive outcome.

Warning paragraph to alert the user about something.

Danger paragraph highlighting a critical issue.

```yaml
- id: type_default
  type: Paragraph
  properties:
    content: Default paragraph text with the standard color.
- id: type_secondary
  type: Paragraph
  properties:
    content: Secondary paragraph text with a muted appearance.
    type: secondary
- id: type_success
  type: Paragraph
  properties:
    content: Success paragraph indicating a positive outcome.
    type: success
- id: type_warning
  type: Paragraph
  properties:
    content: Warning paragraph to alert the user about something.
    type: warning
- id: type_danger
  type: Paragraph
  properties:
    content: Danger paragraph highlighting a critical issue.
    type: danger
```

Strong (bold) paragraph text for emphasis.

Italic paragraph text often used for citations or side notes.

Underlined paragraph text to draw attention.

Deleted (strikethrough) text indicating removed content.

Marked (highlighted) text to call out key information.

```yaml
- id: deco_strong
  type: Paragraph
  properties:
    content: Strong (bold) paragraph text for emphasis.
    strong: true
- id: deco_italic
  type: Paragraph
  properties:
    content: Italic paragraph text often used for citations or side notes.
    italic: true
- id: deco_underline
  type: Paragraph
  properties:
    content: Underlined paragraph text to draw attention.
    underline: true
- id: deco_delete
  type: Paragraph
  properties:
    content: Deleted (strikethrough) text indicating removed content.
    delete: true
- id: deco_mark
  type: Paragraph
  properties:
    content: Marked (highlighted) text to call out key information.
    mark: true
```

Bold and italic text for maximum emphasis.

Underlined and highlighted to draw strong attention.

This feature is deprecated and will be removed in a future version.

Critical security vulnerability detected.

```yaml
- id: combined_strong_italic
  type: Paragraph
  properties:
    content: Bold and italic text for maximum emphasis.
    strong: true
    italic: true
- id: combined_underline_mark
  type: Paragraph
  properties:
    content: Underlined and highlighted to draw strong attention.
    underline: true
    mark: true
- id: combined_warning_italic
  type: Paragraph
  properties:
    content: This feature is deprecated and will be removed in a future version.
    type: warning
    italic: true
    underline: true
- id: combined_danger_strong
  type: Paragraph
  properties:
    content: Critical security vulnerability detected.
    type: danger
    strong: true
```

Disabled paragraph text appears faded.

This section is currently unavailable. The content will be accessible once the feature has been enabled by your administrator.

Disabled bold text still shows the faded style.

```yaml
- id: disabled_default
  type: Paragraph
  properties:
    content: Disabled paragraph text appears faded.
    disabled: true
- id: disabled_long
  type: Paragraph
  properties:
    content: This section is currently unavailable. The content will be accessible
      once the feature has been enabled by your administrator.
    disabled: true
- id: disabled_strong
  type: Paragraph
  properties:
    content: Disabled bold text still shows the faded style.
    disabled: true
    strong: true
```

const app = lowdefy.init({ config })

npx lowdefy@latest dev

{ "type": "TextInput", "properties": { "label": "Name" } }

```yaml
- id: code_inline
  type: Paragraph
  properties:
    content: const app = lowdefy.init({ config })
    code: true
- id: code_command
  type: Paragraph
  properties:
    content: npx lowdefy@latest dev
    code: true
- id: code_json
  type: Paragraph
  properties:
    content: '{ "type": "TextInput", "properties": { "label": "Name" } }'
    code: true
```

Click the copy icon to copy this text.

Copy this paragraph (custom text is copied instead)

Hover the copy icon to see custom tooltips

Two-state copy icons that change after clicking

npm install lowdefy

```yaml
- id: copyable_simple
  type: Paragraph
  properties:
    content: Click the copy icon to copy this text.
    copyable: true
- id: copyable_custom_text
  type: Paragraph
  properties:
    content: Copy this paragraph (custom text is copied instead)
    copyable:
      text: This is the custom text that gets copied to clipboard instead of the
        visible content.
- id: copyable_tooltips
  type: Paragraph
  properties:
    content: Hover the copy icon to see custom tooltips
    copyable:
      tooltips:
        - Click to copy text
        - Text copied!
- id: copyable_icons
  type: Paragraph
  properties:
    content: Two-state copy icons that change after clicking
    copyable:
      icon:
        - AiOutlineCopy
        - AiOutlineCheck
- id: copyable_code
  type: Paragraph
  properties:
    content: npm install lowdefy
    code: true
    copyable: true
```

Copy this text and a message will appear.

API Key shown here (actual key copied)

Copy this and state will track it.

```yaml
- id: copyable_event
  type: Paragraph
  properties:
    content: Copy this text and a message will appear.
    copyable: true
  events:
    onCopy:
      - id: copyable_event_msg
        type: DisplayMessage
        params:
          content: Text copied to clipboard!
          status: success
- id: copyable_event_custom
  type: Paragraph
  properties:
    content: API Key shown here (actual key copied)
    copyable:
      text: sk-abc123def456
      tooltips:
        - Copy API key
        - API key copied!
  events:
    onCopy:
      - id: copyable_event_custom_msg
        type: DisplayMessage
        params:
          content: API key copied to clipboard.
          status: info
- id: copyable_event_set_state
  type: Paragraph
  properties:
    content: Copy this and state will track it.
    copyable: true
  events:
    onCopy:
      - id: copyable_event_set
        type: SetState
        params:
          lastCopied: Copied text tracked via onCopy event.
```

This is a very long paragraph that will be truncated when it exceeds the width of its container. The overflow text is replaced with an ellipsis to indicate there is more content available beyond what is currently visible.

This paragraph demonstrates multi-line ellipsis with two rows. It contains enough text to span several lines, and after reaching the specified row limit, the remaining content will be hidden behind an ellipsis. Users can click the expand button to reveal the full text. This is useful for previews of long-form content.

Three-line ellipsis with a custom suffix. Lowdefy makes it easy to build internal tools, client portals, and web applications using YAML or JSON configuration files. No need to learn complex frontend frameworks, manage build tooling, or write boilerplate code. Just define your UI in config and Lowdefy takes care of the rest.

```yaml
- id: ellipsis_single
  type: Paragraph
  properties:
    content: This is a very long paragraph that will be truncated when it exceeds
      the width of its container. The overflow text is replaced with an ellipsis
      to indicate there is more content available beyond what is currently
      visible.
    ellipsis: true
- id: ellipsis_rows_2
  type: Paragraph
  properties:
    content: This paragraph demonstrates multi-line ellipsis with two rows. It
      contains enough text to span several lines, and after reaching the
      specified row limit, the remaining content will be hidden behind an
      ellipsis. Users can click the expand button to reveal the full text. This
      is useful for previews of long-form content.
    ellipsis:
      rows: 2
      expandable: true
- id: ellipsis_rows_3_suffix
  type: Paragraph
  properties:
    content: Three-line ellipsis with a custom suffix. Lowdefy makes it easy to
      build internal tools, client portals, and web applications using YAML or
      JSON configuration files. No need to learn complex frontend frameworks,
      manage build tooling, or write boilerplate code. Just define your UI in
      config and Lowdefy takes care of the rest.
    ellipsis:
      rows: 3
      expandable: true
      suffix: " /Read More"
```

Click expand to trigger an event. Lowdefy makes it easy to build internal tools, client portals, and web applications using YAML or JSON configuration files. No need to learn complex frontend frameworks, manage build tooling, or write boilerplate code.

Expanding this paragraph will update state. This is useful for tracking which sections the user has read or interacted with. You can use the ellipsis state to drive conditional logic elsewhere in the app.

Expandable paragraph with a suffix and event. Lowdefy apps are defined in YAML with blocks, operators, actions, and connections. The framework handles rendering, state management, and server-side logic so you can focus on building features.

```yaml
- id: ellipsis_event
  type: Paragraph
  properties:
    content: Click expand to trigger an event. Lowdefy makes it easy to build
      internal tools, client portals, and web applications using YAML or JSON
      configuration files. No need to learn complex frontend frameworks, manage
      build tooling, or write boilerplate code.
    ellipsis:
      rows: 2
      expandable: true
  events:
    onExpand:
      - id: ellipsis_event_msg
        type: DisplayMessage
        params:
          content: Content expanded!
          status: info
- id: ellipsis_event_set_state
  type: Paragraph
  properties:
    content: Expanding this paragraph will update state. This is useful for tracking
      which sections the user has read or interacted with. You can use the
      ellipsis state to drive conditional logic elsewhere in the app.
    ellipsis:
      rows: 2
      expandable: true
  events:
    onExpand:
      - id: ellipsis_event_set
        type: SetState
        params:
          sectionExpanded: true
      - id: ellipsis_event_set_msg
        type: DisplayMessage
        params:
          content: State updated - sectionExpanded is now true.
          status: success
- id: ellipsis_event_suffix
  type: Paragraph
  properties:
    content: Expandable paragraph with a suffix and event. Lowdefy apps are defined
      in YAML with blocks, operators, actions, and connections. The framework
      handles rendering, state management, and server-side logic so you can
      focus on building features.
    ellipsis:
      rows: 1
      expandable: true
      suffix: " [...]"
  events:
    onExpand:
      - id: ellipsis_event_suffix_msg
        type: DisplayMessage
        params:
          content: Full text revealed.
          status: info
```

Paragraph styled with Tailwind classes for background, padding, and border radius.

Paragraph with a left border accent using Tailwind utility classes.

PARAGRAPH WITH WIDE LETTER SPACING

This paragraph has increased line height for better readability. When you have dense text content, increasing the line height makes it easier for users to follow lines of text across the page.

A blockquote-style paragraph using inline styles with a left border and padding.

```yaml
- id: css_tailwind_bg
  type: Paragraph
  class: bg-bg-layout p-3 rounded-lg
  properties:
    content: Paragraph styled with Tailwind classes for background, padding, and
      border radius.
- id: css_tailwind_border
  type: Paragraph
  class: border-l-4 border-blue-500 pl-3
  properties:
    content: Paragraph with a left border accent using Tailwind utility classes.
    type: secondary
    italic: true
- id: css_inline_spacing
  type: Paragraph
  properties:
    content: PARAGRAPH WITH WIDE LETTER SPACING
  style:
    .element:
      letterSpacing: 3px
      textTransform: uppercase
      fontSize: 12px
- id: css_inline_line_height
  type: Paragraph
  properties:
    content: This paragraph has increased line height for better readability. When
      you have dense text content, increasing the line height makes it easier
      for users to follow lines of text across the page.
  style:
    .element:
      lineHeight: 2
- id: css_inline_blockquote
  type: Paragraph
  properties:
    content: A blockquote-style paragraph using inline styles with a left border and
      padding.
    italic: true
  style:
    .element:
      borderLeft: 3px solid
      paddingLeft: 12px
```

Custom heavy font weight for strong text (fontWeightStrong 900).

Custom teal success color applied via theme tokens.

Custom orange warning color via theme override.

console.log("custom monospace font")

```yaml
- id: theme_bold_weight
  type: Paragraph
  properties:
    content: Custom heavy font weight for strong text (fontWeightStrong 900).
    strong: true
    theme:
      fontWeightStrong: 900
- id: theme_custom_colors
  type: Paragraph
  properties:
    content: Custom teal success color applied via theme tokens.
    type: success
    theme:
      colorSuccess: "#13c2c2"
- id: theme_warning_color
  type: Paragraph
  properties:
    content: Custom orange warning color via theme override.
    type: warning
    theme:
      colorWarning: "#fa541c"
- id: theme_code_font
  type: Paragraph
  properties:
    content: console.log("custom monospace font")
    code: true
    theme:
      fontFamilyCode: '"JetBrains Mono", "Fira Code", monospace'
```

Lowdefy is a config-driven web framework that lets you build internal tools, client portals, and web apps using YAML. No frontend expertise required.

Over 50 pre-built blocks are available out of the box, including form inputs, charts, tables, and layout components.

Install the CLI to get started.

npx lowdefy@latest dev

Note: Lowdefy requires Node.js 18 or later. Check your version with node /version.

```yaml
- id: article_card
  type: Card
  properties:
    title: Getting Started with Lowdefy
    size: small
  blocks:
    - id: article_intro
      type: Paragraph
      properties:
        content: Lowdefy is a config-driven web framework that lets you build internal
          tools, client portals, and web apps using YAML. No frontend expertise
          required.
    - id: article_highlight
      type: Paragraph
      properties:
        content: Over 50 pre-built blocks are available out of the box, including form
          inputs, charts, tables, and layout components.
        mark: true
        strong: true
    - id: article_code_label
      type: Paragraph
      properties:
        content: Install the CLI to get started.
        type: secondary
    - id: article_code_snippet
      type: Paragraph
      properties:
        content: npx lowdefy@latest dev
        code: true
        copyable: true
      events:
        onCopy:
          - id: article_copy_msg
            type: DisplayMessage
            params:
              content: Command copied! Paste it into your terminal.
              status: success
    - id: article_note
      type: Paragraph
      properties:
        content: "Note: Lowdefy requires Node.js 18 or later. Check your version with
          node /version."
        type: warning
        italic: true
```

All services are operational. Last checked 2 minutes ago.

API response times are elevated. The team is investigating the root cause.

Database cluster is unreachable. Automatic failover has been triggered.

For real-time updates, subscribe to the status page or contact support. Incident reports are published within 30 minutes of detection. Historical uptime data is available in the admin dashboard.

Maintenance window scheduled for Sunday 02:00-04:00 UTC.

```yaml
- id: status_card
  type: Card
  properties:
    title: System Status
    size: small
  blocks:
    - id: status_ok
      type: Paragraph
      properties:
        content: All services are operational. Last checked 2 minutes ago.
        type: success
        strong: true
    - id: status_degraded
      type: Paragraph
      properties:
        content: API response times are elevated. The team is investigating the root
          cause.
        type: warning
    - id: status_outage
      type: Paragraph
      properties:
        content: Database cluster is unreachable. Automatic failover has been triggered.
        type: danger
        strong: true
    - id: status_detail
      type: Paragraph
      properties:
        content: For real-time updates, subscribe to the status page or contact support.
          Incident reports are published within 30 minutes of detection.
          Historical uptime data is available in the admin dashboard.
        ellipsis:
          rows: 2
          expandable: true
      events:
        onExpand:
          - id: status_expand_msg
            type: DisplayMessage
            params:
              content: Showing full status details.
              status: info
    - id: status_disabled
      type: Paragraph
      properties:
        content: Maintenance window scheduled for Sunday 02:00-04:00 UTC.
        disabled: true
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | boolean | `false` | Apply code style. |
| `content` | string | - | Paragraph text content - supports html. |
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
| `mark` | boolean | `false` | Apply marked (highlighted) style. |
| `strong` | boolean | `false` | Apply strong (bold) style. |
| `type` | string | `"default"` | Additional types. Don't specify for default. Enum: `success`, `default`, `secondary`, `warning`, `danger`. |
| `underline` | boolean | `false` | Apply underline style. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design typography tokens](https://ant.design/components/typography#design-token). |
| `theme.titleMarginBottom` | string | `"0.5em"` | Margin bottom of title. |
| `theme.titleMarginTop` | string | `"1.2em"` | Margin top of title. |
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
| `onTextSelection` | `{ selection: string }` | Trigger action when text is selected. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Paragraph element. |
| `/copyableIcon` | The copyable icon in the Paragraph. |

No slots defined.
