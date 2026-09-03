---
name: lowdefy-layout
description: Use when arranging blocks on a page — the grid layout system, `layout.size` and `span`, `Box` and `Flex` containers, alignment, gutters and responsive breakpoints.
---

# Layout

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Layout

`/lowdefy-docs/content/concepts/layout-overview`

Containers blocks are used to arrange blocks on a page. Blocks of category `container` and `list` all function as container blocks. Container blocks have content slots into which a list of blocks are rendered. `List` category blocks can render content slots for each element in the data array.

#### Box

`/lowdefy-docs/content/container-blocks/box`

Basic block-level container for layout.

#### Flex

`/lowdefy-docs/content/container-blocks/flex`

Flexible box layout container for arranging child blocks.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Box

Provided by `@lowdefy/blocks-basic`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `content` | string |  |  | Box content string. Overrides the "content" content area. |

##### Events

- `onClick`: Trigger actions when the Box is clicked.
- `onPaste`: Trigger actions when the element is focused and a paste event is triggered.

##### Example

```yaml
- id: box_basic
  type: Box
  blocks:
    - id: box_basic_text
      type: Html
      properties:
        html: '<p style="margin: 0;">A basic Box renders a div and contains child blocks.</p>'
```

#### Flex

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `vertical` | boolean |  | `false` | Whether the main axis direction is vertical. |
| `wrap` | boolean \\| string |  |  | Set whether the element is displayed in a single line or in multiple lines. |
| `justify` | `"flex-start"`, `"center"`, `"flex-end"`, `"space-between"`, `"space-around"`, `"space-evenly"` |  |  | Set the alignment of elements on the main axis. |
| `align` | `"flex-start"`, `"center"`, `"flex-end"`, `"stretch"`, `"baseline"` |  |  | Set the alignment of elements on the cross axis. |
| `gap` | string \\| number |  |  | Set the gap between items. Can be "small", "middle", "large", or a number. |
| `flex` | string \\| number |  |  | Flex CSS shorthand property. |
| `component` | string |  |  | Custom element type. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

_No events._

##### Example

```yaml
- id: flex_basic
  type: Flex
  properties:
    gap: 8
  blocks:
    - id: flex_basic_btn1
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: One
        color: primary
        variant: solid
    - id: flex_basic_btn2
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Two
        color: primary
        variant: outlined
    - id: flex_basic_btn3
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Three
        color: primary
        variant: dashed
```

#### Card

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `bordered` | boolean |  | `true` | Toggles rendering of the border around the card. |
| `hoverable` | boolean |  | `false` | Lift up when hovering card. |
| `inner` | boolean |  | `false` | Change the card style to inner. |
| `size` | `"default"`, `"small"` |  | `"default"` | Size of the card. |
| `title` | string |  |  | Title to show in the title area - supports html. Overwritten by blocks in the title content area. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onClick`: Trigger actions when the Card is clicked.

##### Example

```yaml
- id: basic_card
  type: Card
  properties:
    title: Card Title
  blocks:
    - id: basic_card_p1
      type: Paragraph
      properties:
        content: Cards provide a flexible and extensible content container with multiple variants. This is the default card with a simple title and body content.
    - id: basic_card_p2
      type: Paragraph
      properties:
        content: You can place any blocks inside the card body using the standard blocks key.
```
<!-- generated:reference:end -->

## Recipe

Must cover: `layout.span` (24-column grid) and `layout.size`, `blocks` vs. `areas`, `Flex` for one-dimensional rows, `Box` as the neutral container, `contentGutter`, responsive `span` objects, and avoiding nested grids for simple rows.
