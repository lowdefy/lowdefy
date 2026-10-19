# SkeletonInput

Input-shaped skeleton loading placeholder.

```yaml
- id: size_small
  type: SkeletonInput
  properties:
    size: small
- id: size_medium
  type: SkeletonInput
  properties:
    size: medium
- id: size_large
  type: SkeletonInput
  properties:
    size: large
```

```yaml
- id: active_small
  type: SkeletonInput
  properties:
    size: small
- id: active_medium
  type: SkeletonInput
  properties:
    size: medium
- id: active_large
  type: SkeletonInput
  properties:
    size: large
```

```yaml
- id: no_label_small
  type: SkeletonInput
  properties:
    size: small
    label: false
- id: no_label_medium
  type: SkeletonInput
  properties:
    size: medium
    label: false
- id: no_label_large
  type: SkeletonInput
  properties:
    size: large
    label: false
```

```yaml
- id: width_full
  type: SkeletonInput
  properties:
    size: medium
    width: 100%
- id: width_half
  type: SkeletonInput
  properties:
    size: medium
    width: 50%
- id: width_fixed
  type: SkeletonInput
  properties:
    size: medium
    width: 300
```

```yaml
- id: label_narrow
  type: SkeletonInput
  properties:
    size: medium
    labelWidth: 15%
- id: label_wide
  type: SkeletonInput
  properties:
    size: medium
    labelWidth: 50%
- id: label_fixed
  type: SkeletonInput
  properties:
    size: medium
    labelWidth: 120
```

```yaml
- id: label_height_small
  type: SkeletonInput
  properties:
    size: medium
    labelHeight: 12
- id: label_height_default
  type: SkeletonInput
  properties:
    size: medium
    labelHeight: 20
- id: label_height_tall
  type: SkeletonInput
  properties:
    size: medium
    labelHeight: 28
```

```yaml
- id: input_height_short
  type: SkeletonInput
  properties:
    size: medium
    inputHeight: 24
- id: input_height_default
  type: SkeletonInput
  properties:
    size: medium
- id: input_height_tall
  type: SkeletonInput
  properties:
    size: medium
    inputHeight: 48
```

```yaml
- id: combined_compact
  type: SkeletonInput
  properties:
    size: small
    labelWidth: 20%
    labelHeight: 12
    width: 60%
- id: combined_full
  type: SkeletonInput
  properties:
    size: large
    labelWidth: 40%
    labelHeight: 24
    inputHeight: 44
    width: 100%
- id: combined_no_label
  type: SkeletonInput
  properties:
    size: medium
    label: false
    inputHeight: 40
    width: 80%
```

```yaml
- id: form_skeleton
  type: Box
  layout:
    gap: 16
  blocks:
    - id: form_row_1
      type: Box
      layout:
        gap: 16
        direction: row
      blocks:
        - id: form_first_name
          type: SkeletonInput
          properties:
            size: medium
            labelWidth: 40%
        - id: form_last_name
          type: SkeletonInput
          properties:
            size: medium
            labelWidth: 40%
    - id: form_email
      type: SkeletonInput
      properties:
        size: medium
        labelWidth: 20%
    - id: form_notes
      type: SkeletonInput
      properties:
        size: medium
        labelWidth: 15%
        inputHeight: 80
    - id: form_submit
      type: SkeletonButton
      properties:
        size: medium
        width: 120
```

```yaml
- id: style_rounded_input
  type: SkeletonInput
  properties:
    size: medium
  style:
    .input:
      borderRadius: 8
- id: style_custom_bg
  type: SkeletonInput
  properties:
    size: medium
    label: false
  style:
    .element:
      maxWidth: 400
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | boolean | `true` | Render the label skeleton. Set to false for an input without a label. |
| `size` | string | `"medium"` | Size of the skeleton. Enum: `small`, `medium`, `large`. |
| `width` | number \| string | - | Width of the skeleton. |
| `labelHeight` | number \| string | - | Height of the skeleton. |
| `labelWidth` | number \| string | - | Width of the skeleton. |
| `inputHeight` | number \| string | - | Height of the skeleton. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The outer container. |
| `/input` | The input skeleton. |

No slots defined.
