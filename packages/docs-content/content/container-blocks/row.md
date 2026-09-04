# Row

Arranges its children in a flex row. `Row`, `Stack` and `Grid` are the framework-owned arrangement blocks: the container says how the children are arranged, and each child says how big it is.

## Sizing a child

A `Row` sets the arrangement — direction, `gap`, `wrap`, `align` and `justify`. A
child's size is a Tailwind class on the child, set with the `class` key:

```yaml
- id: toolbar
  type: Row
  properties:
    gap: sm
    wrap: nowrap
  blocks:
    - id: search
      type: TextInput
      class: grow
    - id: refresh
      type: Button
      class: shrink-0
    - id: settings
      type: Button
      class: ml-auto
```

`grow`, `shrink-0`, `basis-1/3`, `w-64`, `self-center` and their responsive variants
(`md:w-full`) all work, because the class lands on the element that is the flex item.

## Row and Flex

`Flex` in `@lowdefy/blocks-antd` stays and keeps working. `Row` and `Stack` are the
framework-owned equivalents: they take no antd theme, they express arrangement as
Tailwind utility classes, and they are what the `layout:` deprecation names as the
replacement.

## Migrating from `layout:`

Siblings that carried `layout: { flex, grow, shrink, size }` become the children of one
`Row`, with those keys as Tailwind utility classes, and the area's `gap`, `align`,
`justify` and `wrap` become the `Row`'s properties. `layout:` still works — see
[Layout](/layout-overview). `lowdefy check` reports every remaining site under the
`layout-deprecated` slug, and `lowdefy upgrade` offers the optional `layout-to-containers`
codemod, which does the mechanical rewrite and reports the sites it refuses.

One

Two

Three

```yaml
- id: row_basic
  type: Row
  blocks:
    - id: row_basic_one
      type: Box
      class: p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: One
    - id: row_basic_two
      type: Box
      class: p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: Two
    - id: row_basic_three
      type: Box
      class: p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: Three
```

```yaml
- id: row_spaced
  type: Row
  properties:
    gap: lg
    justify: between
    align: center
  class: p-2 rounded border border-dashed border-gray-400/60
  blocks:
    - id: row_spaced_title
      type: Html
      properties:
        html: '<h3 style="margin: 0;">Report</h3>'
    - id: row_spaced_meta
      type: Html
      properties:
        html: '<span style="opacity: 0.6;">Updated today</span>'
```

w-32

grow

ml-auto

```yaml
- id: row_sized
  type: Row
  properties:
    gap: sm
    wrap: nowrap
  blocks:
    - id: row_sized_fixed
      type: Box
      class: w-32 shrink-0 p-2 rounded bg-gray-500/10
      properties:
        content: w-32
    - id: row_sized_fill
      type: Box
      class: grow p-2 rounded bg-green-500/10
      properties:
        content: grow
    - id: row_sized_pushed
      type: Box
      class: ml-auto p-2 rounded bg-orange-500/10
      properties:
        content: ml-auto
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `gap` | string | `"md"` | Space between the children. Enum: `none`, `xs`, `sm`, `md`, `lg`, `xl`. |
| `wrap` | string | `"wrap"` | Whether children that do not fit move to a new line. Use "nowrap" to keep one line and let the children shrink. Enum: `wrap`, `nowrap`, `reverse`. |
| `align` | string | `"stretch"` | Alignment of the children on the cross (vertical) axis. Enum: `start`, `center`, `end`, `stretch`, `baseline`. |
| `justify` | string | `"start"` | Distribution of the children along the main (horizontal) axis. Enum: `start`, `center`, `end`, `between`, `around`, `evenly`. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Row flex container element. |

| Slot | Description |
| --- | --- |
| `content` | Child blocks arranged in the row. |
