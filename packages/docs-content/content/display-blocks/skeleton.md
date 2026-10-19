# Skeleton

Rectangular skeleton loading placeholder.

```yaml
- id: basic_line
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 16
- id: basic_block
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 120
    height: 40
- id: basic_tall
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 80
    height: 80
```

```yaml
- id: active_thin
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 250
    height: 12
- id: active_medium
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 300
    height: 16
- id: active_thick
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 180
    height: 24
```

```yaml
- id: avatar_row
  type: Box
  layout:
    gap: 12
    align: center
  blocks:
    - id: avatar_circle
      type: SkeletonAvatar
      layout:
        flex: 0 0 auto
      properties:
        size: large
        shape: round
    - id: avatar_lines
      type: Box
      layout:
        gap: 8
      blocks:
        - id: avatar_name
          type: Skeleton
          properties:
            width: 180
            height: 14
        - id: avatar_desc
          type: Skeleton
          properties:
            width: 120
            height: 14
```

```yaml
- id: paragraph_row_container
  type: Box
  layout:
    gap: 10
  blocks:
    - id: para_row_1
      type: Skeleton
      properties:
        width: 100%
        height: 14
    - id: para_row_2
      type: Skeleton
      properties:
        width: 100%
        height: 14
    - id: para_row_3
      type: Skeleton
      properties:
        width: 100%
        height: 14
    - id: para_row_4
      type: Skeleton
      properties:
        width: 60%
        height: 14
```

```yaml
- id: width_full
  type: Skeleton
  properties:
    width: 100%
    height: 16
- id: width_half
  type: Skeleton
  properties:
    width: 50%
    height: 16
- id: width_quarter
  type: Skeleton
  properties:
    width: 25%
    height: 16
- id: width_px
  type: Skeleton
  properties:
    width: 300
    height: 16
```

```yaml
- id: height_thin
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 8
- id: height_default
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 16
- id: height_medium
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 32
- id: height_thick
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 48
```

```yaml
- id: pct_100
  type: Skeleton
  properties:
    width: 100%
    height: 14
- id: pct_80
  type: Skeleton
  properties:
    width: 80%
    height: 14
- id: pct_60
  type: Skeleton
  properties:
    width: 60%
    height: 14
- id: pct_40
  type: Skeleton
  properties:
    width: 40%
    height: 14
```

```yaml
- id: card_skeleton
  type: Box
  style:
    padding: 16
    border: 1px solid
    borderRadius: 8
    maxWidth: 360
  layout:
    gap: 12
  blocks:
    - id: card_image
      type: Skeleton
      properties:
        width: 100%
        height: 180
    - id: card_title
      type: Skeleton
      properties:
        width: 70%
        height: 20
    - id: card_desc_1
      type: Skeleton
      properties:
        width: 100%
        height: 14
    - id: card_desc_2
      type: Skeleton
      properties:
        width: 100%
        height: 14
    - id: card_desc_3
      type: Skeleton
      properties:
        width: 50%
        height: 14
```

```yaml
- id: style_rounded
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 20
  style:
    .element:
      borderRadius: 10
- id: style_square
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 60
    height: 60
  style:
    .element:
      borderRadius: 8
- id: style_circle
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 60
    height: 60
  style:
    .element:
      borderRadius: 30
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `height` | number \| string | - | Height of the skeleton. |
| `width` | number \| string | - | Width of the skeleton. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Skeleton element. |

No slots defined.
