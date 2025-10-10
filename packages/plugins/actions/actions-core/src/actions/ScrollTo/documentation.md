<TITLE>
ScrollTo
<TITLE>

<DESCRIPTION>
The `ScrollTo` action is used to scroll the users browser. It is often used to scroll back to the top
of a long form after resetting the form, or to scroll the user to the top of a page after linking to a new page.

The `ScrollTo` action has two modes - scrolling to a block and scrolling to x and y coordinates on a page.

> When scrolling to a block, `ScrollTo` implements [`Element.scrollIntoView()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView), while
when scrolling to coordinates, it implements [`Window.scrollTo()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo).
<DESCRIPTION>

<USAGE>
```
(params: {
  top?: number,
  left?: number,
  behavior?: enum
}): void

(params: {
  blockId: string,
  options: {
    behavior?: enum,
    block? enum,
    inline?: enum
  }
}): void
```

######  Scroll to coordinates
- `top: number`: Specifies the number of pixels along the Y axis to scroll the window.
- `left: number`: Specifies the number of pixels along the X axis to scroll the window.
- `behavior: enum`: Defines the transition animation. One of `auto` or `smooth`.

######  Scroll to a block
- `blockId: string`: __Required__ - The blockId of a block to scroll to.
- `options: object`: _Object_
  - `behavior: enum`: Defines the transition animation. One of `auto` or `smooth`. Defaults to `auto`.
  - `block: enum`: Defines vertical alignment. One of `start`, `center`, `end`, or `nearest`. Defaults to `start`.
  - `inline: enum`: Defines horizontal alignment. One of `start`, `center`, `end`, or `nearest`. Defaults to `nearest`.
</USAGE>

<EXAMPLES>
### Scroll to a block:
```yaml
- id: scroll_to_block
  type: ScrollTo
  params:
    blockId: my_block
```

### Scroll to the top of the page:
```yaml
- id: scroll_to_top
  type: ScrollTo
  params:
    top: 0
```

### Scroll to the top of the page after linking from a previous page:
```yaml
- id: link_button
  type: Button
  events:
    onClick:
      - id: link_
        type: Link
        params:
          pageId: next_page
      - id: scroll_to_top
        type: ScrollTo
        params:
          top: 0
```

### Scroll to the centre of a block:
```yaml
- id: scroll_to_block
  type: ScrollTo
  params:
    blockId: my_block
    options:
      block: center
      inline: center
```
</EXAMPLES>
