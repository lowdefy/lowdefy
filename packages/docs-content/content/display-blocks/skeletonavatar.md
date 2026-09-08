# SkeletonAvatar

Avatar-shaped skeleton loading placeholder.

```yaml
- id: shape_round
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    shape: round
- id: shape_square
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    shape: square
```

```yaml
- id: size_small_round
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: small
    shape: round
- id: size_medium_round
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    shape: round
- id: size_large_round
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: large
    shape: round
```

```yaml
- id: size_small_square
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: small
    shape: square
- id: size_medium_square
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    shape: square
- id: size_large_square
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: large
    shape: square
```

```yaml
- id: active_round_small
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: small
    shape: round
- id: active_round_medium
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    shape: round
- id: active_round_large
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: large
    shape: round
- id: active_square_small
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: small
    shape: square
- id: active_square_medium
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    shape: square
- id: active_square_large
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: large
    shape: square
```

```yaml
- id: custom_tiny
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: small
    shape: round
  style:
    .element:
      width: 16
      height: 16
- id: custom_xlarge
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: large
    shape: round
  style:
    .element:
      width: 64
      height: 64
      borderRadius: 32
- id: custom_xxlarge
  type: SkeletonAvatar
  layout:
    flex: 0 0 auto
  properties:
    size: large
    shape: round
  style:
    .element:
      width: 96
      height: 96
      borderRadius: 48
```

```yaml
- id: avatar_text_row
  type: Box
  layout:
    gap: 12
    align: center
  blocks:
    - id: avatar_icon
      type: SkeletonAvatar
      layout:
        flex: 0 0 auto
      properties:
        size: large
        shape: round
    - id: avatar_text_col
      type: Box
      layout:
        gap: 6
      blocks:
        - id: avatar_name_line
          type: Skeleton
          properties:
            width: 160
            height: 14
        - id: avatar_desc_line
          type: Skeleton
          properties:
            width: 100
            height: 12
- id: avatar_square_row
  type: Box
  layout:
    gap: 12
    align: center
  blocks:
    - id: avatar_sq_icon
      type: SkeletonAvatar
      layout:
        flex: 0 0 auto
      properties:
        size: large
        shape: square
    - id: avatar_sq_col
      type: Box
      layout:
        gap: 6
      blocks:
        - id: avatar_sq_line_1
          type: Skeleton
          properties:
            width: 200
            height: 14
        - id: avatar_sq_line_2
          type: Skeleton
          properties:
            width: 140
            height: 14
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | string | `"medium"` | Size of the skeleton. Enum: `small`, `medium`, `large`. |
| `shape` | string | `"round"` | Shape of the skeleton. Enum: `square`, `round`. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The SkeletonAvatar element. |

No slots defined.
