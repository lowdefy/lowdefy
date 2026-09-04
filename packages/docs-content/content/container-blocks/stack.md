# Stack

Arranges its children in a flex column. `Row`, `Stack` and `Grid` are the framework-owned arrangement blocks: the container says how the children are arranged, and each child says how big it is.

## Sizing a child

A `Stack` sets the arrangement — direction, `gap` and `align`. A child's size is a
Tailwind class on the child, set with the `class` key:

```yaml
- id: sidebar
  type: Stack
  properties:
    gap: sm
  blocks:
    - id: profile
      type: Card
      class: w-full
    - id: spacer
      type: Box
      class: grow
    - id: sign_out
      type: Button
      class: self-end
```

`grow`, `shrink-0`, `h-64`, `w-full`, `self-end` and their responsive variants
(`md:w-64`) all work, because the class lands on the element that is the flex item.

## Stack and Flex

`Flex` in `@lowdefy/blocks-antd` stays and keeps working. `Row` and `Stack` are the
framework-owned equivalents: they take no antd theme, they express arrangement as
Tailwind utility classes, and they are what the `layout:` deprecation names as the
replacement.

## Migrating from `layout:`

An area with `direction: column` becomes a `Stack` around its children, and the area's
`gap` and `align` become the `Stack`'s properties. `layout:` still works — see
[Layout](/layout-overview). `lowdefy check` reports every remaining site under the
`layout-deprecated` slug, and `lowdefy upgrade` offers the optional `layout-to-containers`
codemod, which does the mechanical rewrite and reports the sites it refuses.

First

Second

Third

```yaml
- id: stack_basic
  type: Stack
  blocks:
    - id: stack_basic_one
      type: Box
      class: p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: First
    - id: stack_basic_two
      type: Box
      class: p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: Second
    - id: stack_basic_three
      type: Box
      class: p-2 rounded border border-blue-500/40 bg-blue-500/10
      properties:
        content: Third
```

```yaml
- id: stack_centered
  type: Stack
  properties:
    gap: xs
    align: center
  class: p-2 rounded border border-dashed border-gray-400/60
  blocks:
    - id: stack_centered_title
      type: Html
      properties:
        html: '<h3 style="margin: 0;">Centered</h3>'
    - id: stack_centered_body
      type: Html
      properties:
        html: '<span style="opacity: 0.6;">Children keep their own width.</span>'
```

Approve

Reject

```yaml
- id: stack_nested
  type: Stack
  properties:
    gap: sm
  blocks:
    - id: stack_nested_heading
      type: Html
      properties:
        html: '<h3 style="margin: 0;">Invoice 1042</h3>'
    - id: stack_nested_actions
      type: Row
      properties:
        gap: sm
      blocks:
        - id: stack_nested_approve
          type: Box
          class: p-2 rounded bg-green-500/10
          properties:
            content: Approve
        - id: stack_nested_reject
          type: Box
          class: p-2 rounded bg-red-500/10
          properties:
            content: Reject
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `gap` | string | `"md"` | Space between the children. Enum: `none`, `xs`, `sm`, `md`, `lg`, `xl`. |
| `align` | string | `"stretch"` | Alignment of the children on the cross (horizontal) axis. Enum: `start`, `center`, `end`, `stretch`, `baseline`. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Stack flex container element. |

| Slot | Description |
| --- | --- |
| `content` | Child blocks stacked in the column. |
