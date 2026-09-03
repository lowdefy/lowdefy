# SkeletonButton

Button-shaped skeleton loading placeholder.

```yaml
- id: shape_default
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 120
- id: shape_round
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 120
    shape: round
```

```yaml
- id: size_small
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: small
    width: 80
- id: size_medium
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 100
- id: size_large
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: large
    width: 120
```

```yaml
- id: size_small_round
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: small
    width: 80
    shape: round
- id: size_medium_round
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 100
    shape: round
- id: size_large_round
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: large
    width: 120
    shape: round
```

```yaml
- id: active_small
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: small
    width: 80
- id: active_medium
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 100
- id: active_large
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: large
    width: 120
- id: active_round
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 120
    shape: round
```

```yaml
- id: block_small
  type: SkeletonButton
  properties:
    size: small
- id: block_medium
  type: SkeletonButton
  properties:
    size: medium
- id: block_large
  type: SkeletonButton
  properties:
    size: large
```

```yaml
- id: block_small_round
  type: SkeletonButton
  properties:
    size: small
    shape: round
- id: block_medium_round
  type: SkeletonButton
  properties:
    size: medium
    shape: round
- id: block_large_round
  type: SkeletonButton
  properties:
    size: large
    shape: round
```

```yaml
- id: custom_px_80
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 80
- id: custom_px_160
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 160
- id: custom_px_240
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 240
- id: custom_pct_50
  type: SkeletonButton
  properties:
    size: medium
    width: 50%
```

```yaml
- id: btn_group_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: btn_group_1
      type: SkeletonButton
      layout:
        flex: 0 0 auto
      properties:
        size: medium
        width: 100
        shape: round
    - id: btn_group_2
      type: SkeletonButton
      layout:
        flex: 0 0 auto
      properties:
        size: medium
        width: 80
        shape: round
    - id: btn_group_3
      type: SkeletonButton
      layout:
        flex: 0 0 auto
      properties:
        size: medium
        width: 60
        shape: round
```

```yaml
- id: style_custom_radius
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 140
  style:
    .element:
      borderRadius: 4
- id: style_no_radius
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 140
  style:
    .element:
      borderRadius: 0
- id: style_circle
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: large
    width: 40
  style:
    .element:
      borderRadius: 20
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `shape` | string | `"default"` | Shape of the skeleton; round gives fully rounded ends. Enum: `default`, `round`. |
| `size` | string | `"medium"` | Size of the skeleton. Enum: `small`, `medium`, `large`. |
| `width` | number \| string | - | Width of the skeleton. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The SkeletonButton element. |

No slots defined.
