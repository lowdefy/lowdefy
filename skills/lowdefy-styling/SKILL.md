---
name: lowdefy-styling
description: Use when changing how blocks look — `style`, `class`, theme tokens, custom CSS, `Html` vs. `DangerousHtml`, and responsive `_media` queries.
---

# Styling

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Custom Styling

`/lowdefy-docs/content/concepts/custom-styling`

Lowdefy provides several ways to style blocks and customize the look of your app:

#### Custom HTML

`/lowdefy-docs/content/concepts/custom-html`



#### Html

`/lowdefy-docs/content/display-blocks/html`

Render raw HTML content safely.

#### _theme

`/lowdefy-docs/content/operators/_theme`

The `_theme` operator gets a value from the app's antd theme seed tokens, as configured in `theme.antd.token` in `lowdefy.yaml`. This is useful for accessing theme values in expressions, such as setting colors or sizes dynamically based on the app's theme.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Html

Provided by `@lowdefy/blocks-basic`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `html` | string |  |  | Content to be rendered as Html. |

##### Events

- `onTextSelection`: Trigger action when text is selected and pass selected text to the event object.

##### Example

```yaml
- id: basic_paragraph
  type: Html
  properties:
    html: '<p>This is a paragraph rendered safely with the Html block.</p>'
```

#### DangerousHtml

Provided by `@lowdefy/blocks-basic`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `html` | string |  |  | Content to be rendered as Html. |
| `DOMPurifyOptions` | object |  |  | Customize DOMPurify options. Options are only applied when the block is mounted, thus any parsed settings is only applied at first render. |

##### Events

_No events._

##### Example

```yaml
- id: basic_paragraph
  type: DangerousHtml
  properties:
    html: '<p>This is a basic paragraph rendered as HTML.</p>'
```

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _media

Provided by `@lowdefy/operators-js`.

**Form 1** — `"size"`, `"width"`, `"height"`, `"darkMode"`, `"darkModePreference"`: Media property to return.

**Form 2** — `true`: Return all media data.

**Form 3** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | `"size"`, `"width"`, `"height"`, `"darkMode"`, `"darkModePreference"` |  |  | Media property to return. |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all media data. |
<!-- generated:reference:end -->

## Recipe

Must cover: `style` for one-offs, `class` with app CSS in `lowdefy.yaml`, `theme` tokens and `_theme`, `Html` strips `<style>` (use `DangerousHtml`), `_media` for breakpoints, and `cssKeys` for block sub-elements.
