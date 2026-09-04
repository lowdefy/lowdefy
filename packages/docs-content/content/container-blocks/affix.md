# Affix

An Affix block makes its content stick to the viewport when scrolling.

```yaml
- id: affix_basic_top
  type: Affix
  properties:
    offsetTop: 10
  blocks:
    - id: affix_basic_top_btn
      type: Button
      properties:
        title: Affix Top (10px)
        color: primary
        variant: solid
```

```yaml
- id: affix_offset_top_0
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetTop: 0
  blocks:
    - id: affix_offset_top_0_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Offset 0px
        color: primary
        variant: solid
        size: small
- id: affix_offset_top_20
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetTop: 20
  blocks:
    - id: affix_offset_top_20_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Offset 20px
        color: primary
        variant: outlined
        size: small
- id: affix_offset_top_80
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetTop: 80
  blocks:
    - id: affix_offset_top_80_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Offset 80px
        color: primary
        variant: dashed
        size: small
```

```yaml
- id: affix_offset_bottom_0
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetBottom: 0
  blocks:
    - id: affix_offset_bottom_0_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Bottom 0px
        color: primary
        variant: solid
        size: small
- id: affix_offset_bottom_30
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetBottom: 30
  blocks:
    - id: affix_offset_bottom_30_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Bottom 30px
        color: primary
        variant: outlined
        size: small
- id: affix_offset_bottom_60
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetBottom: 60
  blocks:
    - id: affix_offset_bottom_60_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Bottom 60px
        color: primary
        variant: dashed
        size: small
```

```yaml
- id: affix_on_change
  type: Affix
  properties:
    offsetTop: 10
  events:
    onChange:
      - id: affix_on_change_message
        type: DisplayMessage
        params:
          content:
            _if:
              test:
                _eq:
                  - _event: affixed
                  - true
              then: Affix is now fixed to the viewport.
              else: Affix returned to its original position.
          duration: 3
  blocks:
    - id: affix_on_change_btn
      type: Button
      properties:
        title: Scroll to trigger onChange
        color: primary
        variant: solid
```

```yaml
- id: affix_on_change
  type: Affix
  properties:
    offsetTop: 10
  events:
    onChange:
      - id: affix_on_change_message
        type: DisplayMessage
        params:
          content:
            _if:
              test:
                _eq:
                  - _event: affixed
                  - true
              then: Affix is now fixed to the viewport.
              else: Affix returned to its original position.
          duration: 3
  blocks:
    - id: affix_on_change_btn
      type: Button
      properties:
        title: Scroll to trigger onChange
        color: primary
        variant: solid
```

```yaml
- id: affix_theme_default_z
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetTop: 10
    theme:
      zIndexPopup: 10
  blocks:
    - id: affix_theme_default_z_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Default z-index (10)
        color: default
        variant: outlined
        size: small
- id: affix_theme_high_z
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetTop: 10
    theme:
      zIndexPopup: 100
  blocks:
    - id: affix_theme_high_z_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: High z-index (100)
        color: primary
        variant: solid
        size: small
- id: affix_theme_low_z
  type: Affix
  layout:
    flex: 0 0 auto
  properties:
    offsetTop: 10
    theme:
      zIndexPopup: 1
  blocks:
    - id: affix_theme_low_z_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Low z-index (1)
        color: default
        variant: dashed
        size: small
```

```yaml
- id: affix_css_shadow
  type: Affix
  layout:
    flex: 0 0 auto
  class:
    element: shadow-lg rounded-lg
  properties:
    offsetTop: 10
  blocks:
    - id: affix_css_shadow_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Shadow + Rounded
        color: primary
        variant: solid
        size: small
- id: affix_css_ring
  type: Affix
  layout:
    flex: 0 0 auto
  class:
    element: ring-2 ring-green-400 rounded-lg
  properties:
    offsetTop: 10
  blocks:
    - id: affix_css_ring_btn
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Ring Border
        color: default
        variant: outlined
        size: small
```

```yaml
- id: affix_style_zindex
  type: Affix
  properties:
    offsetTop: 10
  style:
    .element:
      zIndex: 200
      boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15)
  blocks:
    - id: affix_style_zindex_btn
      type: Button
      properties:
        title: Custom z-index (200) + Shadow
        color: primary
        variant: solid
```

Edit Employee Record

```yaml
- id: affix_form_toolbar
  type: Affix
  properties:
    offsetTop: 0
  blocks:
    - id: affix_form_toolbar_card
      type: Card
      properties:
        size: small
        bordered: true
      blocks:
        - id: affix_form_toolbar_row
          type: Box
          layout:
            gap: 8
            justify: space-between
            align: center
          blocks:
            - id: affix_form_toolbar_title
              type: Title
              layout:
                flex: 0 0 auto
              properties:
                content: Edit Employee Record
                level: 5
            - id: affix_form_toolbar_actions
              type: Box
              layout:
                flex: 0 0 auto
                gap: 8
              blocks:
                - id: affix_form_toolbar_discard
                  type: Button
                  layout:
                    flex: 0 0 auto
                  properties:
                    title: Discard
                    color: default
                    variant: outlined
                    size: small
                  events:
                    onClick:
                      - id: affix_form_toolbar_discard_msg
                        type: DisplayMessage
                        params:
                          content: Changes discarded.
                          status: warning
                - id: affix_form_toolbar_save
                  type: Button
                  layout:
                    flex: 0 0 auto
                  properties:
                    title: Save Changes
                    icon: AiOutlineSave
                    color: primary
                    variant: solid
                    size: small
                  events:
                    onClick:
                      - id: affix_form_toolbar_save_msg
                        type: DisplayMessage
                        params:
                          content: Employee record saved successfully.
                          status: success
```

3 items selected

```yaml
- id: affix_bottom_bar
  type: Affix
  properties:
    offsetBottom: 0
  blocks:
    - id: affix_bottom_bar_card
      type: Card
      class: shadow-lg
      properties:
        size: small
      blocks:
        - id: affix_bottom_bar_row
          type: Box
          layout:
            gap: 12
            justify: flex-end
            align: center
          blocks:
            - id: affix_bottom_bar_status
              type: Paragraph
              layout:
                flex: 1 1 0
              properties:
                content: 3 items selected
            - id: affix_bottom_bar_delete
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Delete
                icon: AiOutlineDelete
                color: danger
                variant: outlined
                size: small
              events:
                onClick:
                  - id: affix_bottom_bar_delete_msg
                    type: DisplayMessage
                    params:
                      content: Items deleted.
                      status: error
            - id: affix_bottom_bar_export
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Export
                icon: AiOutlineDownload
                color: primary
                variant: solid
                size: small
              events:
                onClick:
                  - id: affix_bottom_bar_export_msg
                    type: DisplayMessage
                    params:
                      content: Export started.
                      status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `offsetBottom` | number | - | Offset from the bottom of the viewport (in pixels). |
| `offsetTop` | number | - | Offset from the top of the viewport (in pixels). |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design affix tokens](https://ant.design/components/affix#design-token). |
| `theme.zIndexPopup` | number | `10` | Z-index of the affix element when fixed. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | \- | Triggered when container affix status changes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Affix element. |

| Slot | Description |
| --- | --- |
| `content` | Child blocks wrapped by the Affix. |
