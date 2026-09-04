# Layout

> ### Moving to `Row`, `Grid` and `Stack`
>
> Per-block `layout:` is **deprecated**. It keeps working in v8, and nothing on this page
> stops rendering — but new config should use the framework-owned arrangement blocks
> [`Row`](/Row), [`Grid`](/Grid) and [`Stack`](/Stack) instead. The container says how its
> children are arranged; each child says how big it is, with a Tailwind class.
>
> | `layout:` | Replacement |
> | --- | --- |
> | `span`, `offset` on siblings | Wrap them in a [`Grid`](/Grid) (`columns: 24`) and set `class: col-span-N`, with `offset` accumulated into `col-start-N` |
> | `flex`, `grow`, `shrink`, `size` | Wrap them in a [`Row`](/Row) and use `class: grow`, `shrink-0`, `basis-[120px]` |
> | an area with `direction: column` | Wrap its children in a [`Stack`](/Stack) |
> | `selfAlign` | `class: self-start`, `self-center`, `self-end` |
> | area `gap`, `align`, `justify`, `wrap` | the container block's `properties` |
> | area `overflow` | `class: overflow-auto` on the container |
>
> `lowdefy check` reports every remaining site under the `layout-deprecated` slug, one
> warning per site naming the wrapper it needs, and a final count of sites and files.
> `lowdefy upgrade` offers the optional `layout-to-containers` codemod, which does the
> mechanical rewrite and reports every site it refuses — operator-valued `layout:` and
> responsive breakpoint objects are converted by hand.
>
> Whether `layout:` is removed in v9 is a later decision, taken on what those counts say.

> ### When is a wrapper rendered?
>
> Lowdefy only adds layout `div`s where layout was asked for. A block is wrapped in a
> column (`div.lf-col`, id `bl-<blockId>`) when its own `layout:` has any block key —
> `span`, `offset`, `push`, `pull`, `order`, `flex`, `grow`, `shrink`, `size`,
> `selfAlign`, a responsive breakpoint (`xs`…`2xl`), or `disabled` — or when the slot it
> sits in renders a row, because a column is sized as a flex item of its row. A content
> slot is wrapped in a row (`div.lf-row`, id `ar-<blockId>-<slot>`) when the slot or the
> container's `layout:` sets any arrangement key — `gap`, `align`, `justify`,
> `direction`, `wrap`, `overflow` — when the slot has a `class:` or `style:` of its own,
> when the container block passes a content style into the slot (`Row`, `Grid`, `Stack`,
> `Result`, `PageHeaderMenu` and `PageSiderMenu` do), or when any block in the slot is
> laid out. Otherwise neither `div` exists and the block's own root element is the node
> in the page: every block renders its `id`, its `data-testid`, its `class:` and its
> `style:` on the element it owns, so a `Title` with no layout really is an `<h1>`.
>
> The decision reads which keys are present, not what they evaluate to, so an operator
> in `layout:` that resolves to `null` on one render does not restructure the DOM.
> A skeleton follows the same rule as the block it stands in for, so a loading page
> occupies the same boxes as the loaded one. Two consequences worth knowing: the
> `#bl-<blockId>` and `#ar-<blockId>-<slot>` ids only exist where a wrapper does — target
> the block's own id instead — and where the flex row is gone, adjacent margins collapse
> as they do in normal block flow. Golden DOM snapshots change with this release; run
> `lowdefy snapshot --update` once and review the diff.

Containers blocks are used to arrange blocks on a page. Blocks of category `container` and `list` all function as container blocks. Container blocks have content slots into which a list of blocks are rendered. `List` category blocks can render content slots for each element in the data array.

Blocks on a page can be arranged using a __span__ or __flex__ layout. Blocks in __span__ layout are placed in a 24 column CSS custom properties grid, whereas __flex__ blocks dynamically grows or shrink to fit content into a row depending on content size and screen size.

# Content slots

Each container has content slots - these are named areas where nested blocks can be placed. All container blocks have a primary content slot. This slot is called `content`. Container blocks might have other content slots, like `header`, `footer`, or `title`. These content slots are implemented specifically by the block.

To place blocks in the primary content slot of a container, the block definitions for those blocks can be placed inside the `blocks` array of the container block.

> In the following examples, blocks of type `Container` will represent a generic container block, and blocks of type `Block` will represent a generic block. The `Container` block might be a [`Box`](/Box), a [`Card`](/Card), a [`PageHeaderMenu`](/PageHeaderMenu) or any other container block. The `Block` blocks could be any type of block, including other container blocks.


###### Two blocks in the primary content slot (`content`) of a container:
```yaml
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
    - id: block2
      type: Block

To place blocks in other content slots, the block definitions can be placed in the `blocks` array of the specific slot in the `slots` object:

> Note the blocks are placed under `slots.[slotName].blocks`


###### Blocks in the `header`, `content` and `footer` slots:
```yaml
- id: container
  type: Container
  slots:
    header:
      blocks:
        - id: block1
          type: Block
    content:
      blocks:
        - id: block2
          type: Block
    footer:
      blocks:
        - id: block3
          type: Block

Placing blocks both in the `blocks` array, as well as under the `slots.content.blocks` array is an anti-pattern, and in this case the blocks under `blocks` will overwrite those under `slots.content.blocks`.

###### Anti-pattern: Blocks in the `blocks` and `slots.content.blocks`:
```yaml
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
  slots:
    content:
      blocks:
        - id: block2
          type: Block

# Layouts using span

Each content slot has 24 columns. Blocks have a `span` property, which determines how many columns the block occupies. Blocks are laid out horizontally, until the sum of the spans is more than 24, then the last block block is wrapped to the next row.

By default a block is given a span of 24. This is what makes blocks lay out vertically below each other.

> Blocks are also given a default span of 24 for mobile layouts, even if another span is given, to provide a good default mobile experience. Read more about responsive layouts below.

###### Block spans example:
```
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block # Default span of 24
    - id: block2
      type: Block
      layout:
        span: 16 # Two thirds of the area
    - id: block3
      type: Block
      layout:
        span: 8 # Remaining one third of the area
    - id: block4
      type: Block
      layout:
        span: 12
    - id: block5
      type: Block
      layout:
        span: 18 # Sum would be over 24, so wraps to the next row
```

# Layouts using flex

Blocks can also be laid out using [CSS flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Basic_Concepts_of_Flexbox) properties. These properties are `grow` (`flex-grow`), `shrink` (`flex-shrink`), `size` (`flex-basis`) and `flex` (`flex`). If any of these properties are set, the default span of 24 or any span set in the configuration is not applied. If one of `grow`, `shrink`, or `size` are set, the other properties take their default values. The `flex` property overwrites the `grow`, `shrink`, and `size` properties.

# Block layout properties

The `layout` object on blocks can be used to control how a block is placed in the layout. The `layout` properties that can be defined are:

- `selfAlign`: _Enum_ - Align block vertically in the area. Options are `top`, `middle`, and `bottom`. Default `top.`
- `align`: _Enum_ - Align content area children vertically. Options are `top`, `middle`, and `bottom`. Default `top.` This value flows to the content area as a default. In Lowdefy v4 `layout.align` aligned the block itself within its parent — that is now `layout.selfAlign`. Setting `layout.align` on a block aligns the block's own content, never the block itself.
- `flex`: _String_ - Set the [`flex`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex) CSS property. This overwrites the `grow`, `shrink`, and `size` properties.
- `gap`: _Number_ | _Array_ - Set the gap (space) between blocks in the content area. If an array, the first element is the horizontal gap, and the second is the vertical gap. This value flows to the content area as a default.
- `grow`: _Number_ - Set the [`flex-grow`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-grow) CSS property. Default 0.
- `justify`: _Enum_ - Justify content area children horizontally. Options are `start`, `end`, `center`, `space-around`, and `space-between`. Default `start`. This value flows to the content area as a default.
- `direction`: _Enum_ - Set the flex-direction for the content area. Options are `row`, `row-reverse`, `column`, and `column-reverse`. Default `row`. This value flows to the content area as a default.
- `wrap`: _Enum_ - Set the flex-wrap for the content area. Options are `wrap`, `nowrap`, and `wrap-reverse`. Default `wrap`. This value flows to the content area as a default.
- `overflow`: _Enum_ - Set the overflow for the content area. Options are `visible`, `hidden`, `scroll`, and `auto`. Default `visible`. This value flows to the content area as a default.
- `order`: _Number_ - Change the order blocks are rendered in. By default blocks are rendered in the order they appear in the blocks array.
- `offset`: _Number_ - Number of grid cells to shift the block to the right.
- `pull`: _Number_ - Shift the block this number of cells to the left. This will make it overlap above with previous blocks.
- `push`: _Number_ - Shift the block this number of cells to the right. This will make it overlap under with the following blocks.
- `shrink`: _Number_ - Set the [`flex-shrink`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-shrink) CSS property. Default 1.
- `size`: _String_ | _Number_ - Set the [`flex-basis`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-basis) CSS property. Default `auto`.
- `span`: _Number_ - Number of grid cells the block should occupy. Setting `span: 0` hides the block (`display: none`).

### Responsive layouts

All the settings defined in the Block `layout` properties can be defined for the various responsive breakpoints. Breakpoints apply to all window width sizes smaller than the breakpoint width, where the smallest breakpoint setting takes precedence.

The responsive breakpoints are:

  - `xs`: window width less than 640px
  - `sm`: window width greater than 640px
  - `md`: window width greater than 768px
  - `lg`: window width greater than 1024px
  - `xl`: window width greater than 1280px
  - `2xl`: window width greater than 1536px

The responsive layout settings are applied to the `layout` object. For example making a block half container width and full container width for devices like tablets or smaller:
```yaml
id: responsive_block
type: Box
layout:
  span: 12
  md:
    span: 24
```

> **Note:** Responsive breakpoint settings on `style` have been removed. Only `layout` supports responsive breakpoints. Use Tailwind responsive classes via `class` for responsive styling instead.

See the [Migration Guide](/v4-to-v5) for details on all layout changes.

### Block layout properties usage examples:

```
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
      layout:
        span: 6
    - id: block2
      type: Block
      layout:
        selfAlign: top
        span: 6
    - id: block3
      type: Block
      layout:
        selfAlign: middle
        span: 6
    - id: block4
      type: Block
      layout:
        selfAlign: bottom
        span: 6
```

```
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
      layout:
        order: 1
    - id: block2
      type: Block
```

```
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
      layout:
        offset: 4
    - id: block2
      type: Block
      layout:
        offset: 4
        span: 10
```

```
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
      layout:
        span: 12
    - id: block2
      type: Block
      style:
        opacity: 0.5
      layout:
        pull: 3
        span: 12
```

```
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
      layout:
        push: 3
        span: 12
    - id: block2
      type: Block
      style:
        opacity: 0.5
      layout:
        span: 12
```

# Area layout properties

Properties can be set on each area to control how blocks are layed out inside that area. These properties are set under the `areaName` key:

The properties that can be set are:
  - `align`: _Enum_ - Align blocks vertically in the area. Options are `top`, `middle`, and `bottom`. Default `top.`
  - `direction`: _Enum_ - Set the [`flex-direction`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction) CSS property for the area. Options are `row`, `row-reverse`, `column`, and and `column-reverse`. Default `row`.
  - `gap`: _Number_ | _Array_  - Create gap (space) between blocks placed in the area. If an array, the first element is the horizontal gap, and the second is the vertical gap.
  - `justify`: _Enum_ - Justify blocks horizontally inside the area. Options are `start`, `end`, `center`, `space-around`, and `space-between`. Default `start`.
  - `overflow`: _Enum_ - Set the [`overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) CSS property for the area. Options are `visible`, `hidden`, `scroll`, and `space-between`. Default `visible`.
  - `wrap`: _Enum_ - Set the [`flex-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap) CSS property for the area. Options are `wrap`, `nowrap`, and `wrap-reverse`. Default `wrap`.

> **Note:** The `gap`, `align`, `justify`, `direction`, `wrap`, and `overflow` properties can also be set on the parent block's `layout` object, where they flow to the content area as defaults.

### Area layout properties examples:

```yaml
- id: container
  type: Container
  slots:
    area1:
      align: top
      blocks:
        - id: block1
          type: Block
          layout:
            span: 12
        - id: block2
          type: Block
          layout:
            span: 12
    area2:
      align: middle
      blocks:
        - id: block3
          type: Block
          layout:
            span: 12
        - id: block4
          type: Block
          layout:
            span: 12
    area3:
      align: bottom
      blocks:
        - id: block5
          type: Block
          layout:
            span: 12
        - id: block6
          type: Block
          layout:
            span: 12
```

##### Area 1 - `align: top`

##### Area 2 - `align: middle`

##### Area 3 - `align: bottom`

```yaml
- id: container
  type: Container
  slots:
    area1:
      direction: row
      blocks:
        - id: block1
          type: Block
          layout:
            size: auto
        - id: block2
          type: Block
          layout:
            size: auto
    area2:
      direction: row-reverse
      blocks:
        - id: block3
          type: Block
          layout:
            size: auto
        - id: block4
          type: Block
          layout:
            size: auto
    area3:
      direction: column
      blocks:
        - id: block5
          type: Block
          layout:
            size: auto
        - id: block6
          type: Block
          layout:
            size: auto
    area4:
      direction: column-reverse
      blocks:
        - id: block7
          type: Block
          layout:
            size: auto
        - id: block8
          type: Block
          layout:
            size: auto
```

##### Area 1 - `direction: row`

##### Area 2 - `direction: row-reverse`

##### Area 3 - `direction: column`

##### Area 4  - `direction: column-reverse`

```yaml
- id: container
  type: Container
  slots:
    area1:
      gap: 16
      blocks:
        - id: block1
          type: Block
          layout:
            span: 12
        - id: block2
          type: Block
          layout:
            span: 12
        - id: block3
          type: Block

    area2:
      gap: [8, 32]
      blocks:
        - id: block4
          type: Block
          layout:
            span: 12
        - id: block5
          type: Block
          layout:
            span: 12
        - id: block6
          type: Block

```

##### Area 1 - `gap: 16`

##### Area 2 - `gap: [8, 32]`

```yaml
- id: container
  type: Container
  slots:
    area1:
      justify: start
      blocks:
        - id: block1
          type: Block
          layout:
            size: auto
        - id: block2
          type: Block
          layout:
            size: auto
        - id: block3
          type: Block
          layout:
            size: auto
    area2:
      justify: end
      blocks:
        - id: block4
          type: Block
          layout:
            size: auto
        - id: block5
          type: Block
          layout:
            size: auto
        - id: block6
          type: Block
          layout:
            size: auto
    area3:
      justify: center
      blocks:
        - id: block7
          type: Block
          layout:
            size: auto
        - id: block8
          type: Block
          layout:
            size: auto
        - id: block9
          type: Block
          layout:
            size: auto
    area4:
      justify: space-around
      blocks:
        - id: block10
          type: Block
          layout:
            size: auto
        - id: block11
          type: Block
          layout:
            size: auto
        - id: block12
          type: Block
          layout:
            size: auto
    area5:
      justify: space-between
      blocks:
        - id: block13
          type: Block
          layout:
            size: auto
        - id: block14
          type: Block
          layout:
            size: auto
        - id: block15
          type: Block
          layout:
            size: auto
```

##### Area 1 - `justify: start`

##### Area 2 - `justify: end`

##### Area 3 - `justify: center`

##### Area 4 - `justify: space-around`

##### Area 5 - `justify: space-between`
