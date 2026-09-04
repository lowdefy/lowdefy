# Grid

Arranges its children on a CSS grid, 24 columns by default. `Row`, `Stack` and `Grid` are the framework-owned arrangement blocks: the container says how the children are arranged, and each child says how big it is.

## Sizing a child

A `Grid` sets the track count with `columns` — 24 by default, matching the 24-column
`layout.span` grid it replaces — and the space between children with `gap`. A child's
size is a Tailwind class on the child, set with the `class` key:

```yaml
- id: body
  type: Grid
  blocks:
    - id: form
      type: Card
      class: col-span-24 md:col-span-16
    - id: side
      type: Card
      class: col-span-24 md:col-span-8
```

`col-span-N`, `col-start-N`, `row-span-N` and their responsive variants all work,
because the class lands on the element that is the grid item. A child with no span
class occupies a single column.

Use `columnsSm` and `columnsMd` to change the track count itself from the 640px and
768px breakpoints up; use the children's own responsive classes to change how much of
the grid each child takes.

## Grid and Flex

`Flex` in `@lowdefy/blocks-antd` stays and keeps working; it is a flex container, not
a grid. `Row`, `Stack` and `Grid` are the framework-owned arrangement blocks, and they
are what the `layout:` deprecation names as the replacement.

## Migrating from `layout:`

Siblings that carried `layout: { span, offset }` become the children of one `Grid` with
`columns: 24`: `span` becomes `class: col-span-N`, and `offset` — a cumulative margin, not
a grid line — is accumulated across the row into `col-start-N`. `layout:` still works —
see [Layout](/layout-overview). `lowdefy check` reports every remaining site under the
`layout-deprecated` slug, and `lowdefy upgrade` offers the optional `layout-to-containers`
codemod, which does the mechanical rewrite and reports the sites it refuses.

col-span-16

col-span-8

```yaml
- id: grid_basic
  type: Grid
  blocks:
    - id: grid_basic_main
      type: Box
      class: col-span-16 p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: col-span-16
    - id: grid_basic_side
      type: Box
      class: col-span-8 p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: col-span-8
```

Full width on small screens, two thirds from md up.

Full width on small screens, one third from md up.

```yaml
- id: grid_responsive
  type: Grid
  properties:
    gap: lg
  blocks:
    - id: grid_responsive_form
      type: Box
      class: col-span-24 md:col-span-16 p-2 rounded bg-green-500/10
      properties:
        content: Full width on small screens, two thirds from md up.
    - id: grid_responsive_side
      type: Box
      class: col-span-24 md:col-span-8 p-2 rounded bg-orange-500/10
      properties:
        content: Full width on small screens, one third from md up.
```

Users

Revenue

Tasks

Errors

```yaml
- id: grid_tiles
  type: Grid
  properties:
    columns: 2
    columnsMd: 4
    gap: sm
  blocks:
    - id: grid_tiles_users
      type: Box
      class: p-4 rounded border border-blue-500/20 bg-blue-500/5
      properties:
        content: Users
    - id: grid_tiles_revenue
      type: Box
      class: p-4 rounded border border-green-500/20 bg-green-500/5
      properties:
        content: Revenue
    - id: grid_tiles_tasks
      type: Box
      class: p-4 rounded border border-orange-500/20 bg-orange-500/5
      properties:
        content: Tasks
    - id: grid_tiles_errors
      type: Box
      class: p-4 rounded border border-red-500/20 bg-red-500/5
      properties:
        content: Errors
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | integer | `24` | Number of columns in the grid. A child spans columns with a class of its own, like "col-span-8". Enum: `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `24`. |
| `columnsSm` | integer | - | Number of columns from the sm breakpoint (640px) up. Enum: `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `24`. |
| `columnsMd` | integer | - | Number of columns from the md breakpoint (768px) up. Enum: `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `24`. |
| `rows` | integer | - | Number of explicit rows. Left unset, the grid adds rows as the children need them. Enum: `1`, `2`, `3`, `4`, `5`, `6`. |
| `gap` | string | `"md"` | Space between the children. Enum: `none`, `xs`, `sm`, `md`, `lg`, `xl`. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Grid container element. |

| Slot | Description |
| --- | --- |
| `content` | Child blocks placed in the grid. |
