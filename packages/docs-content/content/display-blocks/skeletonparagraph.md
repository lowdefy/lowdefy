# SkeletonParagraph

Paragraph-shaped skeleton loading placeholder.

```yaml
- id: basic_default
  type: SkeletonParagraph
```

```yaml
- id: rows_1
  type: SkeletonParagraph
  properties:
    lines: 1
- id: rows_2
  type: SkeletonParagraph
  properties:
    lines: 2
- id: rows_3
  type: SkeletonParagraph
  properties:
    lines: 3
- id: rows_4
  type: SkeletonParagraph
  properties:
    lines: 4
- id: rows_6
  type: SkeletonParagraph
  properties:
    lines: 6
- id: rows_8
  type: SkeletonParagraph
  properties:
    lines: 8
```

```yaml
- id: width_100
  type: SkeletonParagraph
  properties:
    width: 100%
    lines: 3
- id: width_75
  type: SkeletonParagraph
  properties:
    width: 75%
    lines: 3
- id: width_50
  type: SkeletonParagraph
  properties:
    width: 50%
    lines: 3
```

```yaml
- id: width_px_400
  type: SkeletonParagraph
  properties:
    width: 400
    lines: 3
- id: width_px_300
  type: SkeletonParagraph
  properties:
    width: 300
    lines: 3
- id: width_px_200
  type: SkeletonParagraph
  properties:
    width: 200
    lines: 3
```

```yaml
- id: active_default
  type: SkeletonParagraph
  properties:
    lines: 4
- id: active_short
  type: SkeletonParagraph
  properties:
    lines: 2
    width: 60%
```

```yaml
- id: single_full
  type: SkeletonParagraph
  properties:
    lines: 1
    width: 100%
- id: single_half
  type: SkeletonParagraph
  properties:
    lines: 1
    width: 50%
```

```yaml
- id: article_skeleton
  type: Box
  layout:
    gap: 16
  blocks:
    - id: article_title
      type: Skeleton
      properties:
        width: 60%
        height: 24
    - id: article_subtitle
      type: Skeleton
      properties:
        width: 40%
        height: 16
    - id: article_body
      type: SkeletonParagraph
      properties:
        lines: 6
    - id: article_body_2
      type: SkeletonParagraph
      properties:
        lines: 4
```

```yaml
- id: card_with_para
  type: Box
  style:
    padding: 16
    border: 1px solid
    borderRadius: 8
    maxWidth: 400
  layout:
    gap: 12
  blocks:
    - id: card_header_row
      type: Box
      layout:
        gap: 12
        align: center
        direction: row
      blocks:
        - id: card_avatar
          type: SkeletonAvatar
          layout:
            flex: 0 0 auto
          properties:
            size: large
            shape: round
        - id: card_header_lines
          type: Box
          layout:
            gap: 6
          blocks:
            - id: card_name
              type: Skeleton
              properties:
                width: 140
                height: 14
            - id: card_date
              type: Skeleton
              properties:
                width: 80
                height: 12
    - id: card_body
      type: SkeletonParagraph
      properties:
        lines: 3
```

```yaml
- id: style_narrow
  type: SkeletonParagraph
  properties:
    lines: 3
  style:
    .element:
      maxWidth: 300
- id: style_padded
  type: SkeletonParagraph
  properties:
    lines: 3
  style:
    .element:
      padding: 16
      border: 1px solid
      borderRadius: 8
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `lines` | number | `4` | Number of paragraph lines of the skeleton. |
| `width` | number \| string | - | Width of the skeleton. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The SkeletonParagraph element. |

No slots defined.
