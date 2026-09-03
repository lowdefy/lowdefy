---
name: lowdefy-loading-skeletons
description: Use when a page fetches data on load — showing skeletons while requests run, `loading` and `skeleton` on blocks, and avoiding layout jumps.
---

# Loading skeletons

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Skeleton

`/lowdefy-docs/content/display-blocks/skeleton`

Rectangular skeleton loading placeholder.

#### SkeletonInput

`/lowdefy-docs/content/display-blocks/skeletoninput`

Input-shaped skeleton loading placeholder.

#### SkeletonParagraph

`/lowdefy-docs/content/display-blocks/skeletonparagraph`

Paragraph-shaped skeleton loading placeholder.

#### SkeletonButton

`/lowdefy-docs/content/display-blocks/skeletonbutton`

Button-shaped skeleton loading placeholder.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Skeleton

Provided by `@lowdefy/blocks-loaders`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `height` | number \\| string |  |  | Height of the skeleton. |
| `width` | number \\| string |  |  | Width of the skeleton. |

##### Events

_No events._

##### Example

```yaml
- id: basic_line
  type: Skeleton
  layout:
    flex: 0 0 auto
  properties:
    width: 200
    height: 16
```

#### SkeletonInput

Provided by `@lowdefy/blocks-loaders`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | boolean |  | `true` | Render the label skeleton. Set to false for an input without a label. |
| `size` | `"small"`, `"medium"`, `"large"` |  | `"medium"` | Size of the skeleton. |
| `width` | number \\| string |  |  | Width of the skeleton. |
| `labelHeight` | number \\| string |  |  | Height of the skeleton. |
| `labelWidth` | number \\| string |  |  | Width of the skeleton. |
| `inputHeight` | number \\| string |  |  | Height of the skeleton. |

##### Events

_No events._

##### Example

```yaml
- id: size_small
  type: SkeletonInput
  properties:
    size: small
```

#### SkeletonParagraph

Provided by `@lowdefy/blocks-loaders`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `lines` | number |  | `4` | Number of paragraph lines of the skeleton. |
| `width` | number \\| string |  |  | Width of the skeleton. |

##### Events

_No events._

##### Example

```yaml
- id: basic_default
  type: SkeletonParagraph
```

#### SkeletonButton

Provided by `@lowdefy/blocks-loaders`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `shape` | `"default"`, `"round"` |  | `"default"` | Shape of the skeleton; round gives fully rounded ends. |
| `size` | `"small"`, `"medium"`, `"large"` |  | `"medium"` | Size of the skeleton. |
| `width` | number \\| string |  |  | Width of the skeleton. |

##### Events

_No events._

##### Example

```yaml
- id: shape_default
  type: SkeletonButton
  layout:
    flex: 0 0 auto
  properties:
    size: medium
    width: 120
```

#### Spinner

Provided by `@lowdefy/blocks-loaders`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `size` | string \\| number |  |  | Size of the icon spinner: small, medium, large, or a pixel number. |

##### Events

_No events._

##### Example

```yaml
- id: spinner_default
  type: Spinner
```
<!-- generated:reference:end -->

## Recipe

Must cover: `onInitAsync` renders skeletons until it settles, the per-block `skeleton` property (a skeleton block spec), `loading` on containers, matching skeleton size to the block it stands in for, and one skeleton per visual block rather than a page spinner.
