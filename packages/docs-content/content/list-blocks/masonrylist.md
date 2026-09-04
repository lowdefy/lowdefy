# MasonryList

Masonry-style grid layout for list data. Items flow into columns and stack vertically, filling gaps left by shorter items. Provide an array in state and use _state operators in the template to access each item's data.

```yaml
- id: ml_basic
  type: MasonryList
  properties:
    columns: 3
    gutter: 16
  blocks:
    - id: ml_basic.$.card
      type: Card
      class:
        _state: ml_basic.$.bg
      properties:
        size: small
      blocks:
        - id: ml_basic.$.title_block
          type: Title
          properties:
            content:
              _state: ml_basic.$.title
            level: 5
        - id: ml_basic.$.desc_block
          type: Paragraph
          properties:
            content:
              _state: ml_basic.$.desc
```

```yaml
- id: ml_basic
  type: MasonryList
  properties:
    columns: 3
    gutter: 16
  blocks:
    - id: ml_basic.$.card
      type: Card
      class:
        _state: ml_basic.$.bg
      properties:
        size: small
      blocks:
        - id: ml_basic.$.title_block
          type: Title
          properties:
            content:
              _state: ml_basic.$.title
            level: 5
        - id: ml_basic.$.desc_block
          type: Paragraph
          properties:
            content:
              _state: ml_basic.$.desc
```

```yaml
ml_basic:
  _state: ml_basic
```

```yaml
- id: ml_two
  type: MasonryList
  properties:
    columns: 2
    gutter: 16
  blocks:
    - id: ml_two.$.card
      type: Card
      class:
        _state: ml_two.$.bg
      properties:
        size: small
      blocks:
        - id: ml_two.$.title_block
          type: Title
          properties:
            content:
              _state: ml_two.$.title
            level: 5
        - id: ml_two.$.body_block
          type: Paragraph
          properties:
            content:
              _state: ml_two.$.body
```

```yaml
- id: ml_two
  type: MasonryList
  properties:
    columns: 2
    gutter: 16
  blocks:
    - id: ml_two.$.card
      type: Card
      class:
        _state: ml_two.$.bg
      properties:
        size: small
      blocks:
        - id: ml_two.$.title_block
          type: Title
          properties:
            content:
              _state: ml_two.$.title
            level: 5
        - id: ml_two.$.body_block
          type: Paragraph
          properties:
            content:
              _state: ml_two.$.body
```

```yaml
ml_two:
  _state: ml_two
```

```yaml
- id: ml_gutter_tight
  type: MasonryList
  properties:
    columns: 3
    gutter: 6
  blocks:
    - id: ml_gutter_tight.$.card
      type: Card
      class: bg-bg-layout
      properties:
        size: small
      blocks:
        - id: ml_gutter_tight.$.label_block
          type: Paragraph
          properties:
            content:
              _state: ml_gutter_tight.$.label
- id: ml_gutter_wide
  type: MasonryList
  properties:
    columns: 3
    gutter: 24
  blocks:
    - id: ml_gutter_wide.$.card
      type: Card
      class: bg-bg-layout
      properties:
        size: small
      blocks:
        - id: ml_gutter_wide.$.label_block
          type: Paragraph
          properties:
            content:
              _state: ml_gutter_wide.$.label
```

```yaml
- id: ml_gutter_tight
  type: MasonryList
  properties:
    columns: 3
    gutter: 6
  blocks:
    - id: ml_gutter_tight.$.card
      type: Card
      class: bg-bg-layout
      properties:
        size: small
      blocks:
        - id: ml_gutter_tight.$.label_block
          type: Paragraph
          properties:
            content:
              _state: ml_gutter_tight.$.label
- id: ml_gutter_wide
  type: MasonryList
  properties:
    columns: 3
    gutter: 24
  blocks:
    - id: ml_gutter_wide.$.card
      type: Card
      class: bg-bg-layout
      properties:
        size: small
      blocks:
        - id: ml_gutter_wide.$.label_block
          type: Paragraph
          properties:
            content:
              _state: ml_gutter_wide.$.label
```

```yaml
ml_gutter_tight:
  _state: ml_gutter_tight
ml_gutter_wide:
  _state: ml_gutter_wide
```

```yaml
- id: ml_notes
  type: MasonryList
  properties:
    columns: 3
    gutter: 12
  blocks:
    - id: ml_notes.$.card
      type: Card
      class:
        _state: ml_notes.$.bg
      properties:
        size: small
      blocks:
        - id: ml_notes.$.row
          type: Box
          layout:
            justify: space-between
            align: center
          blocks:
            - id: ml_notes.$.title_block
              type: Title
              layout:
                flex: 1 1 0
              properties:
                content:
                  _state: ml_notes.$.title
                level: 5
            - id: ml_notes.$.tag_block
              type: Tag
              layout:
                flex: 0 0 auto
              properties:
                title:
                  _state: ml_notes.$.tag
                color:
                  _state: ml_notes.$.color
        - id: ml_notes.$.body_block
          type: Paragraph
          properties:
            content:
              _state: ml_notes.$.body
```

```yaml
- id: ml_notes
  type: MasonryList
  properties:
    columns: 3
    gutter: 12
  blocks:
    - id: ml_notes.$.card
      type: Card
      class:
        _state: ml_notes.$.bg
      properties:
        size: small
      blocks:
        - id: ml_notes.$.row
          type: Box
          layout:
            justify: space-between
            align: center
          blocks:
            - id: ml_notes.$.title_block
              type: Title
              layout:
                flex: 1 1 0
              properties:
                content:
                  _state: ml_notes.$.title
                level: 5
            - id: ml_notes.$.tag_block
              type: Tag
              layout:
                flex: 0 0 auto
              properties:
                title:
                  _state: ml_notes.$.tag
                color:
                  _state: ml_notes.$.color
        - id: ml_notes.$.body_block
          type: Paragraph
          properties:
            content:
              _state: ml_notes.$.body
```

```yaml
ml_notes:
  _state: ml_notes
```

```yaml
- id: ml_team
  type: MasonryList
  properties:
    columns: 4
    gutter: 12
  blocks:
    - id: ml_team.$.card
      type: Card
      properties:
        size: small
      blocks:
        - id: ml_team.$.header
          type: Box
          layout:
            gap: 8
            align: center
          blocks:
            - id: ml_team.$.avatar
              type: Avatar
              layout:
                flex: 0 0 auto
              properties:
                content:
                  _state: ml_team.$.initials
                color:
                  _state: ml_team.$.bg
            - id: ml_team.$.name_block
              type: Title
              layout:
                flex: 1 1 0
              properties:
                content:
                  _state: ml_team.$.name
                level: 5
        - id: ml_team.$.role_block
          type: Paragraph
          properties:
            content:
              _state: ml_team.$.role
```

```yaml
- id: ml_team
  type: MasonryList
  properties:
    columns: 4
    gutter: 12
  blocks:
    - id: ml_team.$.card
      type: Card
      properties:
        size: small
      blocks:
        - id: ml_team.$.header
          type: Box
          layout:
            gap: 8
            align: center
          blocks:
            - id: ml_team.$.avatar
              type: Avatar
              layout:
                flex: 0 0 auto
              properties:
                content:
                  _state: ml_team.$.initials
                color:
                  _state: ml_team.$.bg
            - id: ml_team.$.name_block
              type: Title
              layout:
                flex: 1 1 0
              properties:
                content:
                  _state: ml_team.$.name
                level: 5
        - id: ml_team.$.role_block
          type: Paragraph
          properties:
            content:
              _state: ml_team.$.role
```

```yaml
ml_team:
  _state: ml_team
```

```yaml
- id: ml_seq
  type: MasonryList
  properties:
    columns: 3
    gutter: 16
    sequential: true
  blocks:
    - id: ml_seq.$.card
      type: Card
      class:
        _state: ml_seq.$.bg
      properties:
        size: small
      blocks:
        - id: ml_seq.$.title_block
          type: Title
          properties:
            content:
              _state: ml_seq.$.title
            level: 5
        - id: ml_seq.$.desc_block
          type: Paragraph
          properties:
            content:
              _state: ml_seq.$.desc
```

```yaml
- id: ml_seq
  type: MasonryList
  properties:
    columns: 3
    gutter: 16
    sequential: true
  blocks:
    - id: ml_seq.$.card
      type: Card
      class:
        _state: ml_seq.$.bg
      properties:
        size: small
      blocks:
        - id: ml_seq.$.title_block
          type: Title
          properties:
            content:
              _state: ml_seq.$.title
            level: 5
        - id: ml_seq.$.desc_block
          type: Paragraph
          properties:
            content:
              _state: ml_seq.$.desc
```

```yaml
ml_seq:
  _state: ml_seq
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | integer \| object | - | Number of columns, or responsive breakpoint object (e.g. { xs: 1, sm: 2, md: 3 }). |
| `fresh` | boolean | `false` | Force refresh the masonry layout. |
| `gutter` | number \| array | - | Gap between items in pixels. Number or [horizontal, vertical] array. |
| `sequential` | boolean | `false` | Render items sequentially (top to bottom, then next column). Default is balanced column-fill. |
| `theme` | object | - | Antd design token overrides for this block. Masonry uses global motion tokens for item animations. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design masonry tokens](https://ant.design/components/masonry). |
| `theme.motionDurationSlow` | string | `"0.3s"` | Duration of item position and fade-in animations. |
| `theme.motionDurationFast` | string | `"0.1s"` | Duration of item fade-out animations. |
| `theme.motionEaseOut` | string | `"cubic-bezier(0.215, 0.61, 0.355, 1)"` | Easing function for item animations. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The MasonryList element. |

| Slot | Description |
| --- | --- |
| `content` | Blocks rendered for each masonry item. |
