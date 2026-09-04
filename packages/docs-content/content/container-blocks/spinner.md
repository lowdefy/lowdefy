# Spinner

Loading spinner overlay for content areas.

```yaml
- id: spinner_default
  type: Spinner
```

```yaml
- id: spinner_named_small
  type: Spinner
  layout:
    flex: 0 0 auto
  properties:
    size: small
- id: spinner_named_medium
  type: Spinner
  layout:
    flex: 0 0 auto
  properties:
    size: medium
- id: spinner_named_large
  type: Spinner
  layout:
    flex: 0 0 auto
  properties:
    size: large
```

```yaml
- id: spinner_numeric_16
  type: Spinner
  layout:
    flex: 0 0 auto
  properties:
    size: 16
- id: spinner_numeric_32
  type: Spinner
  layout:
    flex: 0 0 auto
  properties:
    size: 32
- id: spinner_numeric_64
  type: Spinner
  layout:
    flex: 0 0 auto
  properties:
    size: 64
```

```yaml
- id: spinner_styled_blue
  type: Spinner
  layout:
    flex: 0 0 auto
  class:
    element: text-blue-500
  properties:
    size: large
- id: spinner_styled_green
  type: Spinner
  layout:
    flex: 0 0 auto
  class:
    element: text-green-500
  properties:
    size: large
- id: spinner_styled_red
  type: Spinner
  layout:
    flex: 0 0 auto
  class:
    element: text-red-500
  properties:
    size: large
- id: spinner_styled_purple
  type: Spinner
  layout:
    flex: 0 0 auto
  class:
    element: text-purple-600
  properties:
    size: large
```

```yaml
- id: spinner_css_bg_pill
  type: Spinner
  layout:
    flex: 0 0 auto
  class:
    element: bg-blue-50 p-4 rounded-full
  properties:
    size: large
- id: spinner_css_bordered
  type: Spinner
  layout:
    flex: 0 0 auto
  class:
    element: border border-gray-200 p-3 rounded-lg bg-white shadow-sm
  properties:
    size: medium
- id: spinner_css_dark_bg
  type: Spinner
  layout:
    flex: 0 0 auto
  class:
    element: bg-gray-800 text-white p-4 rounded-xl
  properties:
    size: large
```

```yaml
- id: spinner_style_custom_color
  type: Spinner
  layout:
    flex: 0 0 auto
  style:
    .element:
      color: "#fa8c16"
  properties:
    size: large
- id: spinner_style_padded
  type: Spinner
  layout:
    flex: 0 0 auto
  style:
    .element:
      padding: 16px
      backgroundColor: "#f6ffed"
      borderRadius: 12px
  properties:
    size: medium
```

Loading orders...

```yaml
- id: spinner_loading_overlay_card
  type: Card
  properties:
    title: Recent Orders
  slots:
    extra:
      blocks:
        - id: spinner_loading_overlay_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Refresh
            icon: AiOutlineReload
            color: primary
            variant: outlined
            size: small
          events:
            onClick:
              - id: spinner_loading_overlay_msg
                type: DisplayMessage
                params:
                  content: Fetching latest orders...
                  duration: 2
  blocks:
    - id: spinner_loading_overlay_box
      type: Box
      layout:
        direction: column
        align: center
        justify: center
        gap: 12
      style:
        .element:
          minHeight: 200px
      blocks:
        - id: spinner_loading_overlay_spinner
          type: Spinner
          layout:
            flex: 0 0 auto
          class:
            element: text-blue-500
          properties:
            size: large
        - id: spinner_loading_overlay_text
          type: Paragraph
          layout:
            flex: 0 0 auto
          class: text-gray-400
          properties:
            content: Loading orders...
```

```yaml
- id: spinner_btn_loading_card
  type: Card
  properties:
    title: Submit Application
  blocks:
    - id: spinner_btn_loading_form_name
      type: TextInput
      properties:
        label:
          title: Full Name
        placeholder: Enter your name
    - id: spinner_btn_loading_form_email
      type: TextInput
      properties:
        label:
          title: Email Address
        placeholder: you@example.com
    - id: spinner_btn_loading_row
      type: Box
      layout:
        gap: 12
        align: center
        justify: end
      blocks:
        - id: spinner_btn_loading_indicator
          type: Spinner
          layout:
            flex: 0 0 auto
          class:
            element: text-blue-500
          visible:
            _if:
              test:
                _eq:
                  - _state: submitting
                  - true
              then: true
              else: false
          properties:
            size: small
        - id: spinner_btn_loading_submit
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Submit
            color: primary
            variant: solid
            icon: AiOutlineSend
          events:
            onClick:
              - id: spinner_btn_loading_set_state
                type: SetState
                params:
                  submitting: true
              - id: spinner_btn_loading_msg
                type: DisplayMessage
                params:
                  content: Application submitted successfully!
                  duration: 3
```

```yaml
- id: spinner_btn_loading_card
  type: Card
  properties:
    title: Submit Application
  blocks:
    - id: spinner_btn_loading_form_name
      type: TextInput
      properties:
        label:
          title: Full Name
        placeholder: Enter your name
    - id: spinner_btn_loading_form_email
      type: TextInput
      properties:
        label:
          title: Email Address
        placeholder: you@example.com
    - id: spinner_btn_loading_row
      type: Box
      layout:
        gap: 12
        align: center
        justify: end
      blocks:
        - id: spinner_btn_loading_indicator
          type: Spinner
          layout:
            flex: 0 0 auto
          class:
            element: text-blue-500
          visible:
            _if:
              test:
                _eq:
                  - _state: submitting
                  - true
              then: true
              else: false
          properties:
            size: small
        - id: spinner_btn_loading_submit
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Submit
            color: primary
            variant: solid
            icon: AiOutlineSend
          events:
            onClick:
              - id: spinner_btn_loading_set_state
                type: SetState
                params:
                  submitting: true
              - id: spinner_btn_loading_msg
                type: DisplayMessage
                params:
                  content: Application submitted successfully!
                  duration: 3
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | string \| number | - | Size of the icon spinner: small, medium, large, or a pixel number. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Spinner element. |

No slots defined.
